"""
Habits Lambda handler.

POST   /habits               → create a habit
GET    /habits               → list user's habits
PUT    /habits/{habitId}     → update habit (name/icon/color or toggle checkDate)
DELETE /habits/{habitId}     → delete a habit
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
HABITS_TABLE = os.environ.get("HABITS_TABLE", "lifemanager-habits")

DEFAULT_ICON = "💪"
DEFAULT_COLOR = "#3B82F6"


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
    habit_id: str | None = path_params.get("habitId")

    # ── POST /habits ───────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        name: str = str(body.get("name", "")).strip()
        if not name:
            return _response(400, {"message": "'name' is required"})
        if len(name) > 100:
            return _response(400, {"message": "Name too long (max 100)"})

        icon: str = str(body.get("icon", DEFAULT_ICON)).strip() or DEFAULT_ICON
        color: str = str(body.get("color", DEFAULT_COLOR)).strip() or DEFAULT_COLOR

        new_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "habitId": new_id,
            "name": name,
            "icon": icon,
            "color": color,
            "checkDates": [],
            "createdAt": now,
            "updatedAt": now,
        }

        table = dynamodb.Table(HABITS_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save habit"})

        return _response(201, item)

    # ── GET /habits ────────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        table = dynamodb.Table(HABITS_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve habits"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── PUT /habits/{habitId} ──────────────────────────────────────────────
    if http_method == "PUT":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not habit_id:
            return _response(400, {"message": "habitId is required"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        update_expressions = []
        expr_attr_names: dict[str, str] = {}
        expr_attr_values: dict[str, Any] = {}

        if "name" in body:
            name = str(body["name"]).strip()
            if not name:
                return _response(400, {"message": "'name' cannot be empty"})
            update_expressions.append("#nm = :name")
            expr_attr_names["#nm"] = "name"
            expr_attr_values[":name"] = name

        if "icon" in body:
            update_expressions.append("icon = :icon")
            expr_attr_values[":icon"] = str(body["icon"]).strip() or DEFAULT_ICON

        if "color" in body:
            update_expressions.append("color = :color")
            expr_attr_values[":color"] = str(body["color"]).strip() or DEFAULT_COLOR

        now = _now_iso()

        # Toggle a checkDate
        if "checkDate" in body:
            check_date = str(body["checkDate"]).strip()
            # Fetch current item to toggle
            table = dynamodb.Table(HABITS_TABLE)
            try:
                resp = table.get_item(Key={"userId": user_id, "habitId": habit_id})
                current = resp.get("Item")
            except ClientError as exc:
                logger.error("DynamoDB get_item error: %s", exc)
                return _response(500, {"message": "Failed to fetch habit"})

            if not current or current.get("userId") != user_id:
                return _response(404, {"message": "Habit not found"})

            dates: list[str] = list(current.get("checkDates", []))
            if check_date in dates:
                dates.remove(check_date)
            else:
                dates.append(check_date)

            update_expressions.append("checkDates = :checkDates")
            expr_attr_values[":checkDates"] = dates

        if not update_expressions:
            return _response(400, {"message": "No fields to update"})

        update_expressions.append("updatedAt = :updatedAt")
        expr_attr_values[":updatedAt"] = now

        table = dynamodb.Table(HABITS_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "Key": {"userId": user_id, "habitId": habit_id},
                "UpdateExpression": "SET " + ", ".join(update_expressions),
                "ExpressionAttributeValues": expr_attr_values,
                "ConditionExpression": boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                "ReturnValues": "ALL_NEW",
            }
            if expr_attr_names:
                kwargs["ExpressionAttributeNames"] = expr_attr_names
            result = table.update_item(**kwargs)
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Habit not found"})
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update habit"})

        return _response(200, result.get("Attributes", {}))

    # ── DELETE /habits/{habitId} ───────────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not habit_id:
            return _response(400, {"message": "habitId is required"})

        table = dynamodb.Table(HABITS_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "habitId": habit_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Habit not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete habit"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
