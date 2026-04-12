"""
Projects Lambda handler – stores and tracks personal projects.

POST   /projects               → create a project (requires Cognito auth)
GET    /projects               → list user's projects
PUT    /projects/{projectId}   → update a project
DELETE /projects/{projectId}   → delete a project
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

PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "lifemanager-projects")

VALID_STATUSES = {"계획중", "진행중", "완료", "보류"}


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
    project_id: str | None = path_params.get("projectId")

    # ── POST /projects ─────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        title: str = body.get("title", "").strip()
        if not title:
            return _response(400, {"message": "'title' field is required"})
        if len(title) > 200:
            return _response(400, {"message": "Title too long (max 200 characters)"})

        description: str = body.get("description", "").strip()
        status: str = body.get("status", "계획중").strip()
        if status not in VALID_STATUSES:
            return _response(400, {"message": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"})

        due_date: str = body.get("dueDate", "").strip()
        tags: list[str] = body.get("tags", [])

        new_project_id = str(uuid.uuid4())
        now = _now_iso()
        item: dict[str, Any] = {
            "userId": user_id,
            "projectId": new_project_id,
            "title": title,
            "description": description,
            "status": status,
            "progress": 0,
            "tags": tags,
            "createdAt": now,
            "updatedAt": now,
        }
        if due_date:
            item["dueDate"] = due_date

        table = dynamodb.Table(PROJECTS_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save project"})

        return _response(201, item)

    # ── GET /projects ──────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        limit = min(int(query_params.get("limit", "100")), 200)

        table = dynamodb.Table(PROJECTS_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve projects"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── PUT /projects/{projectId} ──────────────────────────────────────────
    if http_method == "PUT":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not project_id:
            return _response(400, {"message": "projectId is required"})

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

        if "description" in body:
            update_expressions.append("description = :description")
            expr_attr_values[":description"] = str(body["description"]).strip()

        if "status" in body:
            status = body["status"]
            if status not in VALID_STATUSES:
                return _response(400, {"message": "Invalid status"})
            update_expressions.append("#st = :status")
            expr_attr_names["#st"] = "status"
            expr_attr_values[":status"] = status

        if "progress" in body:
            try:
                progress = max(0, min(100, int(body["progress"])))
            except (ValueError, TypeError):
                return _response(400, {"message": "'progress' must be 0–100"})
            update_expressions.append("progress = :progress")
            expr_attr_values[":progress"] = progress

        if "dueDate" in body:
            update_expressions.append("dueDate = :dueDate")
            expr_attr_values[":dueDate"] = str(body["dueDate"]).strip()

        if "tags" in body:
            update_expressions.append("tags = :tags")
            expr_attr_values[":tags"] = body["tags"]

        if not update_expressions:
            return _response(400, {"message": "No fields to update"})

        now = _now_iso()
        update_expressions.append("updatedAt = :updatedAt")
        expr_attr_values[":updatedAt"] = now

        table = dynamodb.Table(PROJECTS_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "Key": {"userId": user_id, "projectId": project_id},
                "UpdateExpression": "SET " + ", ".join(update_expressions),
                "ExpressionAttributeValues": expr_attr_values,
                "ConditionExpression": boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                "ReturnValues": "ALL_NEW",
            }
            if expr_attr_names:
                kwargs["ExpressionAttributeNames"] = expr_attr_names
            result = table.update_item(**kwargs)
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Project not found"})
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update project"})

        return _response(200, result.get("Attributes", {}))

    # ── DELETE /projects/{projectId} ───────────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})
        if not project_id:
            return _response(400, {"message": "projectId is required"})

        table = dynamodb.Table(PROJECTS_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "projectId": project_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Project not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete project"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
