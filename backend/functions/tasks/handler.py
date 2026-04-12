"""
Tasks (Eisenhower Matrix) Lambda handler.

POST   /tasks               → create a task
GET    /tasks               → list user's tasks
PUT    /tasks/{taskId}      → update a task
DELETE /tasks/{taskId}      → delete a task
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
TASKS_TABLE = os.environ.get("TASKS_TABLE", "lifemanager-tasks")


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


def _calc_quadrant(urgent: bool, important: bool) -> str:
    if urgent and important:
        return "Q1"
    if not urgent and important:
        return "Q2"
    if urgent and not important:
        return "Q3"
    return "Q4"


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    task_id: str | None = path_params.get("taskId")

    # ── POST /tasks ────────────────────────────────────────────────────────
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
        if len(title) > 300:
            return _response(400, {"message": "Title too long (max 300)"})

        if "urgent" not in body or "important" not in body:
            return _response(400, {"message": "'urgent' and 'important' are required"})

        urgent: bool = bool(body["urgent"])
        important: bool = bool(body["important"])
        quadrant = _calc_quadrant(urgent, important)
        due_date: str = str(body.get("dueDate", "")).strip()

        new_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "taskId": new_id,
            "title": title,
            "urgent": urgent,
            "important": important,
            "quadrant": quadrant,
            "completed": False,
            "createdAt": now,
            "updatedAt": now,
        }
        if due_date:
            item["dueDate"] = due_date

        table = dynamodb.Table(TASKS_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save task"})

        return _response(201, item)

    # ── GET /tasks ─────────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        table = dynamodb.Table(TASKS_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve tasks"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── PUT /tasks/{taskId} ────────────────────────────────────────────────
    if http_method == "PUT":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not task_id:
            return _response(400, {"message": "taskId is required"})

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

        if "completed" in body:
            update_expressions.append("completed = :completed")
            expr_attr_values[":completed"] = bool(body["completed"])

        if "dueDate" in body:
            update_expressions.append("dueDate = :dueDate")
            expr_attr_values[":dueDate"] = str(body["dueDate"]).strip()

        # Recalc quadrant if urgency/importance changed
        urgent_new = body.get("urgent")
        important_new = body.get("important")
        if urgent_new is not None:
            update_expressions.append("urgent = :urgent")
            expr_attr_values[":urgent"] = bool(urgent_new)
        if important_new is not None:
            update_expressions.append("important = :important")
            expr_attr_values[":important"] = bool(important_new)
        if urgent_new is not None or important_new is not None:
            # Need current values to compute quadrant correctly
            table_obj = dynamodb.Table(TASKS_TABLE)
            try:
                resp = table_obj.get_item(Key={"userId": user_id, "taskId": task_id})
                current = resp.get("Item", {})
            except ClientError:
                current = {}
            urg = bool(urgent_new) if urgent_new is not None else bool(current.get("urgent", False))
            imp = bool(important_new) if important_new is not None else bool(current.get("important", False))
            update_expressions.append("quadrant = :quadrant")
            expr_attr_values[":quadrant"] = _calc_quadrant(urg, imp)

        if not update_expressions:
            return _response(400, {"message": "No fields to update"})

        now = _now_iso()
        update_expressions.append("updatedAt = :updatedAt")
        expr_attr_values[":updatedAt"] = now

        table = dynamodb.Table(TASKS_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "Key": {"userId": user_id, "taskId": task_id},
                "UpdateExpression": "SET " + ", ".join(update_expressions),
                "ExpressionAttributeValues": expr_attr_values,
                "ConditionExpression": boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                "ReturnValues": "ALL_NEW",
            }
            if expr_attr_names:
                kwargs["ExpressionAttributeNames"] = expr_attr_names
            result = table.update_item(**kwargs)
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Task not found"})
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update task"})

        return _response(200, result.get("Attributes", {}))

    # ── DELETE /tasks/{taskId} ─────────────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not task_id:
            return _response(400, {"message": "taskId is required"})

        table = dynamodb.Table(TASKS_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "taskId": task_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Task not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete task"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
