"""
Journal Lambda handler.

POST   /journal                → create a journal entry
GET    /journal                → list user's journal entries (optional ?type=weekly|monthly|kpt)
PUT    /journal/{journalId}    → update a journal entry
DELETE /journal/{journalId}   → delete a journal entry
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
JOURNAL_TABLE = os.environ.get("JOURNAL_TABLE", "lifemanager-journal")

VALID_TYPES = {"weekly", "monthly", "quarterly", "kpt"}


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


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    journal_id: str | None = path_params.get("journalId")

    # ── POST /journal ──────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        journal_type: str = str(body.get("journalType", "")).strip()
        if journal_type not in VALID_TYPES:
            return _response(400, {"message": f"journalType must be one of {VALID_TYPES}"})

        title: str = str(body.get("title", "")).strip()
        if not title:
            return _response(400, {"message": "'title' is required"})
        if len(title) > 300:
            return _response(400, {"message": "Title too long (max 300)"})

        content: str = str(body.get("content", "")).strip()
        period_start: str = str(body.get("periodStart", "")).strip()
        period_end: str = str(body.get("periodEnd", "")).strip()

        kpt_raw = body.get("kpt")
        kpt = None
        if journal_type == "kpt" and kpt_raw:
            if isinstance(kpt_raw, dict):
                kpt = {
                    "keep": str(kpt_raw.get("keep", "")).strip(),
                    "problem": str(kpt_raw.get("problem", "")).strip(),
                    "tryNext": str(kpt_raw.get("tryNext", "")).strip(),
                }

        new_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "journalId": new_id,
            "journalType": journal_type,
            "title": title,
            "content": content,
            "createdAt": now,
            "updatedAt": now,
        }
        if kpt:
            item["kpt"] = kpt
        if period_start:
            item["periodStart"] = period_start
        if period_end:
            item["periodEnd"] = period_end

        table = dynamodb.Table(JOURNAL_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save journal entry"})

        return _response(201, item)

    # ── GET /journal ───────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        filter_type = query_params.get("type", "").strip()

        table = dynamodb.Table(JOURNAL_TABLE)
        try:
            if filter_type and filter_type in VALID_TYPES:
                result = table.query(
                    IndexName="userId-journalType-index",
                    KeyConditionExpression=(
                        boto3.dynamodb.conditions.Key("userId").eq(user_id)
                        & boto3.dynamodb.conditions.Key("journalType").eq(filter_type)
                    ),
                    ScanIndexForward=False,
                )
            else:
                result = table.query(
                    KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                    ScanIndexForward=False,
                )
            items = result.get("Items", [])
            # Sort by createdAt descending since GSI range key is journalType
            items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve journal entries"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── PUT /journal/{journalId} ───────────────────────────────────────────
    if http_method == "PUT":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not journal_id:
            return _response(400, {"message": "journalId is required"})

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

        if "content" in body:
            update_expressions.append("content = :content")
            expr_attr_values[":content"] = str(body["content"]).strip()

        if "kpt" in body and isinstance(body["kpt"], dict):
            kpt = {
                "keep": str(body["kpt"].get("keep", "")).strip(),
                "problem": str(body["kpt"].get("problem", "")).strip(),
                "tryNext": str(body["kpt"].get("tryNext", "")).strip(),
            }
            update_expressions.append("kpt = :kpt")
            expr_attr_values[":kpt"] = kpt

        if not update_expressions:
            return _response(400, {"message": "No fields to update"})

        now = _now_iso()
        update_expressions.append("updatedAt = :updatedAt")
        expr_attr_values[":updatedAt"] = now

        table = dynamodb.Table(JOURNAL_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "Key": {"userId": user_id, "journalId": journal_id},
                "UpdateExpression": "SET " + ", ".join(update_expressions),
                "ExpressionAttributeValues": expr_attr_values,
                "ConditionExpression": boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                "ReturnValues": "ALL_NEW",
            }
            if expr_attr_names:
                kwargs["ExpressionAttributeNames"] = expr_attr_names
            result = table.update_item(**kwargs)
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Journal entry not found"})
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update journal entry"})

        return _response(200, result.get("Attributes", {}))

    # ── DELETE /journal/{journalId} ────────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not journal_id:
            return _response(400, {"message": "journalId is required"})

        table = dynamodb.Table(JOURNAL_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "journalId": journal_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Journal entry not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete journal entry"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
