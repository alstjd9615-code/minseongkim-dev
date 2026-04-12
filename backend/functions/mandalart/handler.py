"""
Mandalart Lambda handler.

POST   /mandalart                    → create a mandalart
GET    /mandalart                    → list user's mandalarts
PUT    /mandalart/{mandalartId}      → update a mandalart
DELETE /mandalart/{mandalartId}      → delete a mandalart
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
MANDALART_TABLE = os.environ.get("MANDALART_TABLE", "lifemanager-mandalart")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }


def _response(status: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **_cors_headers()},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _get_user_id(event: dict[str, Any]) -> str | None:
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        return claims.get("sub")
    except (KeyError, TypeError):
        return None


def _empty_cells() -> list[dict[str, Any]]:
    return [{"text": "", "completed": False} for _ in range(81)]


def _validate_cells(cells: Any) -> list[dict[str, Any]] | None:
    if not isinstance(cells, list) or len(cells) != 81:
        return None
    validated = []
    for cell in cells:
        if not isinstance(cell, dict):
            return None
        validated.append({
            "text": str(cell.get("text", ""))[:100],
            "completed": bool(cell.get("completed", False)),
        })
    return validated


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    mandalart_id: str | None = path_params.get("mandalartId")

    # ── POST /mandalart ────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        title: str = str(body.get("title", "")).strip()
        if not title:
            return _response(400, {"message": "'title' is required"})
        if len(title) > 200:
            return _response(400, {"message": "Title too long (max 200)"})

        raw_cells = body.get("cells")
        cells = _validate_cells(raw_cells) if raw_cells else _empty_cells()
        if cells is None:
            return _response(400, {"message": "cells must be an array of 81 {text, completed} objects"})

        new_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "mandalartId": new_id,
            "title": title,
            "cells": cells,
            "createdAt": now,
            "updatedAt": now,
        }

        table = dynamodb.Table(MANDALART_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save mandalart"})

        return _response(201, item)

    # ── GET /mandalart ─────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        table = dynamodb.Table(MANDALART_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve mandalarts"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── PUT /mandalart/{mandalartId} ───────────────────────────────────────
    if http_method == "PUT":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not mandalart_id:
            return _response(400, {"message": "mandalartId is required"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        update_expressions = []
        expr_attr_names: dict[str, str] = {}
        expr_attr_values: dict[str, Any] = {}

        if "title" in body:
            title = str(body["title"]).strip()
            if not title:
                return _response(400, {"message": "'title' cannot be empty"})
            update_expressions.append("#tt = :title")
            expr_attr_names["#tt"] = "title"
            expr_attr_values[":title"] = title

        if "cells" in body:
            cells = _validate_cells(body["cells"])
            if cells is None:
                return _response(400, {"message": "cells must be an array of 81 {text, completed} objects"})
            update_expressions.append("cells = :cells")
            expr_attr_values[":cells"] = cells

        if not update_expressions:
            return _response(400, {"message": "No fields to update"})

        now = _now_iso()
        update_expressions.append("updatedAt = :updatedAt")
        expr_attr_values[":updatedAt"] = now

        table = dynamodb.Table(MANDALART_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "Key": {"userId": user_id, "mandalartId": mandalart_id},
                "UpdateExpression": "SET " + ", ".join(update_expressions),
                "ExpressionAttributeValues": expr_attr_values,
                "ConditionExpression": boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                "ReturnValues": "ALL_NEW",
            }
            if expr_attr_names:
                kwargs["ExpressionAttributeNames"] = expr_attr_names
            result = table.update_item(**kwargs)
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Mandalart not found"})
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update mandalart"})

        return _response(200, result.get("Attributes", {}))

    # ── DELETE /mandalart/{mandalartId} ────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not mandalart_id:
            return _response(400, {"message": "mandalartId is required"})

        table = dynamodb.Table(MANDALART_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "mandalartId": mandalart_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Mandalart not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete mandalart"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
