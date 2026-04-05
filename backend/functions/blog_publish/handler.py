"""
Blog publish Lambda handler – publishes blog posts to external platforms.

POST /blog/{postId}/publish/medium   → publish to Medium (Phase 2)
POST /blog/{postId}/publish/tistory  → publish to Tistory (Phase 3)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
BLOG_TABLE = os.environ.get("BLOG_TABLE", "portfolio-blog")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
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

    user_id = _get_user_id(event)
    if not user_id:
        return _response(401, {"message": "Unauthorised"})

    path_params = event.get("pathParameters") or {}
    post_id: str = path_params.get("postId", "")
    platform: str = path_params.get("platform", "")

    if not post_id or platform not in ("medium", "tistory"):
        return _response(400, {"message": "Invalid path parameters"})

    blog_table = dynamodb.Table(BLOG_TABLE)

    # Verify post exists and belongs to user
    try:
        result = blog_table.get_item(Key={"userId": user_id, "postId": post_id})
        post = result.get("Item")
    except ClientError as exc:
        logger.error("DynamoDB get_item error: %s", exc)
        return _response(500, {"message": "Failed to retrieve blog post"})

    if not post:
        return _response(404, {"message": "Blog post not found"})

    if post.get("status") != "published":
        return _response(400, {"message": "Blog post must be published before sharing to external platforms"})

    # ── Phase 2: Medium integration (not yet implemented) ──────────────────
    if platform == "medium":
        # TODO(Phase 2): Implement Medium API integration
        # Requires: MEDIUM_INTEGRATION_TOKEN secret in AWS Secrets Manager
        # API: https://api.medium.com/v1/users/{userId}/posts
        return _response(501, {
            "message": "Medium integration is coming soon (Phase 2)",
            "platform": "medium",
        })

    # ── Phase 3: Tistory integration (not yet implemented) ─────────────────
    if platform == "tistory":
        # TODO(Phase 3): Implement Tistory API integration
        # Requires: TISTORY_ACCESS_TOKEN secret in AWS Secrets Manager
        # API: https://www.tistory.com/apis/post/write
        return _response(501, {
            "message": "Tistory integration is coming soon (Phase 3)",
            "platform": "tistory",
        })

    return _response(400, {"message": f"Unknown platform: {platform}"})
