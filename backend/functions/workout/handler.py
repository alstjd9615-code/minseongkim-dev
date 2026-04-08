"""
Workout Lambda handler – stores and retrieves workout records.

POST   /workout               → save a workout entry (requires Cognito auth)
GET    /workout               → list user's workout entries
DELETE /workout/{workoutId}   → delete a workout entry
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

WORKOUT_TABLE = os.environ.get("WORKOUT_TABLE", "lifemanager-workout")

VALID_WORKOUT_TYPES = {
    "달리기", "걷기", "자전거", "수영",
    "헬스", "홈트", "크로스핏",
    "요가", "필라테스", "스트레칭",
    "축구", "농구", "테니스", "배드민턴",
    "기타",
}
VALID_INTENSITIES = {"낮음", "보통", "높음"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    }


def _response(status: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **_cors_headers()},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _get_user_id(event: dict[str, Any]) -> str | None:
    """Extract userId (Cognito sub) from the JWT authorizer claims."""
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        return claims.get("sub")
    except (KeyError, TypeError):
        return None


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")

    # ── POST /workout ──────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        workout_type: str = body.get("workoutType", "").strip()
        if workout_type not in VALID_WORKOUT_TYPES:
            return _response(400, {"message": f"Invalid workoutType. Must be one of: {sorted(VALID_WORKOUT_TYPES)}"})

        try:
            duration_min = int(body.get("durationMin", 0))
        except (ValueError, TypeError):
            return _response(400, {"message": "'durationMin' must be a valid integer"})
        if duration_min <= 0:
            return _response(400, {"message": "'durationMin' must be a positive integer (> 0)"})

        intensity: str = body.get("intensity", "보통").strip()
        if intensity not in VALID_INTENSITIES:
            return _response(400, {"message": "Invalid intensity. Must be one of: 낮음, 보통, 높음"})

        notes: str = body.get("notes", "").strip()
        if len(notes) > 2000:
            return _response(400, {"message": "Notes too long (max 2000 characters)"})

        workout_id = str(uuid.uuid4())
        now = _now_iso()
        item = {
            "userId": user_id,
            "workoutId": workout_id,
            "workoutType": workout_type,
            "durationMin": duration_min,
            "intensity": intensity,
            "notes": notes,
            "createdAt": now,
            "updatedAt": now,
        }

        table = dynamodb.Table(WORKOUT_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save workout entry"})

        return _response(201, item)

    # ── GET /workout ───────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        limit = min(int(query_params.get("limit", "50")), 100)

        table = dynamodb.Table(WORKOUT_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve workout entries"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── DELETE /workout/{workoutId} ────────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        path_params = event.get("pathParameters") or {}
        workout_id: str | None = path_params.get("workoutId")
        if not workout_id:
            return _response(400, {"message": "workoutId is required"})

        table = dynamodb.Table(WORKOUT_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "workoutId": workout_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Workout entry not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete workout entry"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
