"""
Public blog Lambda handler – serves published blog posts without auth.

GET /public/blog/{userId}           → list published posts for a user
GET /public/blog/{userId}/{postId}  → get a single published post
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
BLOG_TABLE = os.environ.get("BLOG_TABLE", "portfolio-blog")


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
    }


def _response(status: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **_cors_headers()},
        "body": json.dumps(body, ensure_ascii=False),
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    path_params = event.get("pathParameters") or {}
    user_id: str = path_params.get("userId", "")
    post_id: str = path_params.get("postId", "")

    if not user_id:
        return _response(400, {"message": "'userId' path parameter is required"})

    blog_table = dynamodb.Table(BLOG_TABLE)

    # ── GET /public/blog/{userId}/{postId} ─────────────────────────────────
    if post_id:
        try:
            result = blog_table.get_item(Key={"userId": user_id, "postId": post_id})
            item = result.get("Item")
        except ClientError as exc:
            logger.error("DynamoDB get_item error: %s", exc)
            return _response(500, {"message": "Failed to retrieve blog post"})

        if not item or item.get("status") != "published":
            return _response(404, {"message": "Blog post not found"})

        return _response(200, item)

    # ── GET /public/blog/{userId} ──────────────────────────────────────────
    query_params = event.get("queryStringParameters") or {}
    limit = min(int(query_params.get("limit", "20")), 100)

    try:
        result = blog_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
            FilterExpression=boto3.dynamodb.conditions.Attr("status").eq("published"),
            ScanIndexForward=False,
            Limit=limit,
        )
        items = result.get("Items", [])
    except ClientError as exc:
        logger.error("DynamoDB query error: %s", exc)
        return _response(500, {"message": "Failed to retrieve blog posts"})

    # Strip content for list view (return only metadata)
    list_items = [
        {k: v for k, v in item.items() if k != "content"}
        for item in items
    ]

    return _response(200, {"posts": list_items, "count": len(list_items)})
