"""
Life Wheel Lambda handler.

POST   /lifewheel               → save a life wheel entry
GET    /lifewheel               → list user's life wheel entries
DELETE /lifewheel/{wheelId}     → delete an entry
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
LIFEWHEEL_TABLE = os.environ.get("LIFEWHEEL_TABLE", "lifemanager-lifewheel")

DOMAINS = ["건강", "재정", "커리어", "관계", "성장", "여가", "환경", "정신/영적"]


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
    wheel_id: str | None = path_params.get("wheelId")

    # ── POST /lifewheel ────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        scores = body.get("scores", {})
        for domain in DOMAINS:
            if domain not in scores:
                return _response(400, {"message": f"Missing domain score: {domain}"})
            val = scores[domain]
            if not isinstance(val, (int, float)) or not (1 <= val <= 10):
                return _response(400, {"message": f"Score for '{domain}' must be 1-10"})

        note: str = str(body.get("note", "")).strip()[:500]
        new_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "wheelId": new_id,
            "scores": scores,
            "createdAt": now,
            "updatedAt": now,
        }
        if note:
            item["note"] = note

        table = dynamodb.Table(LIFEWHEEL_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save entry"})

        return _response(201, item)

    # ── GET /lifewheel ─────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        limit = min(int(query_params.get("limit", "50")), 200)

        table = dynamodb.Table(LIFEWHEEL_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve entries"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── DELETE /lifewheel/{wheelId} ────────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not wheel_id:
            return _response(400, {"message": "wheelId is required"})

        table = dynamodb.Table(LIFEWHEEL_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "wheelId": wheel_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Entry not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete entry"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
