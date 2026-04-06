"""
Blog Lambda handler – AI-powered blog post generation from diary entries.

POST /blog        → generate blog draft from selected diary entries (auth required)
GET  /blog        → list user's blog posts (auth required)
GET  /blog/{postId} → get a single blog post (auth required)
PUT  /blog/{postId} → update blog post (auth required)
DELETE /blog/{postId} → delete blog post (auth required)
"""

from __future__ import annotations

from email.mime import text
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("BEDROCK_REGION", "us-east-1"))

BLOG_TABLE = os.environ.get("BLOG_TABLE", "portfolio-blog")
DIARY_TABLE = os.environ.get("DIARY_TABLE", "portfolio-diary")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))

BLOG_GENERATION_PROMPT = """당신은 전문 기술 블로거입니다.
사용자의 일상 기록들을 바탕으로 읽기 좋은 블로그 글을 작성해주세요.

규칙:
1. 마크다운 형식으로 작성하세요
2. 제목(h1)으로 시작하세요
3. 자연스럽고 개인적인 어조를 유지하세요
4. 핵심 인사이트와 배운 점을 강조하세요
5. 결론/마무리 섹션을 포함하세요
6. 1000~2000자 분량으로 작성하세요

반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "title": "블로그 글 제목",
  "content": "마크다운 형식의 전체 내용",
  "excerpt": "한 줄 요약 (100자 이내)",
  "tags": ["태그1", "태그2", "태그3"]
}"""


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
    """Extract userId (Cognito sub) from the JWT authorizer claims."""
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        return claims.get("sub")
    except (KeyError, TypeError):
        return None


def _generate_blog_with_bedrock(diary_entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Call Bedrock to generate a blog post from diary entries."""
    entries_text = "\n\n".join(
        f"[{e.get('category', '')}] {e.get('summary', '')}\n{e.get('originalContent', '')}"
        for e in diary_entries
    )
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": BLOG_GENERATION_PROMPT,
        "messages": [{"role": "user", "content": f"다음 일상 기록들을 바탕으로 블로그 글을 작성해주세요:\n\n{entries_text}"}],
    }
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    
    import re
    text = json.loads(response["body"].read())["content"][0]["text"].strip()

    # Strip markdown code fences that the model may wrap the JSON in.
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```\s*$', '', text, flags=re.MULTILINE)
    text = text.strip()

    # Remove control characters that are not valid inside JSON strings
    # (\x00-\x08, \x0b, \x0c, \x0e-\x1f, \x7f) while preserving \t, \n, \r.
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # strict=False allows literal tab/newline characters inside JSON strings,
    # which avoids "Invalid control character" errors from model-generated content.
    result = json.loads(text, strict=False)
    if not isinstance(result.get("tags"), list):
        result["tags"] = []
    result["tags"] = result["tags"][:10]
    return result


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    post_id: str = path_params.get("postId", "")

    # ── POST /blog ─────────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        entry_ids: list[str] = body.get("entryIds", [])
        if not entry_ids:
            return _response(400, {"message": "'entryIds' field is required"})
        if len(entry_ids) > 10:
            return _response(400, {"message": "Maximum 10 diary entries per blog post"})

        diary_table = dynamodb.Table(DIARY_TABLE)
        diary_entries: list[dict[str, Any]] = []
        for entry_id in entry_ids:
            try:
                result = diary_table.get_item(Key={"userId": user_id, "entryId": entry_id})
                item = result.get("Item")
                if item:
                    diary_entries.append(item)
            except ClientError as exc:
                logger.error("DynamoDB get_item error: %s", exc)

        if not diary_entries:
            return _response(404, {"message": "No diary entries found"})

        try:
            generated = _generate_blog_with_bedrock(diary_entries)
        except (ClientError, json.JSONDecodeError, KeyError) as exc:
            logger.error("Bedrock blog generation error: %s", exc)
            return _response(502, {"message": "AI blog generation failed. Please try again."})

        new_post_id = str(uuid.uuid4())
        now = _now_iso()
        item = {
            "userId": user_id,
            "postId": new_post_id,
            "title": generated.get("title", "블로그 글"),
            "content": generated.get("content", ""),
            "excerpt": generated.get("excerpt", ""),
            "tags": generated.get("tags", []),
            "status": "draft",
            "sourceEntryIds": entry_ids,
            "createdAt": now,
            "updatedAt": now,
        }

        blog_table = dynamodb.Table(BLOG_TABLE)
        try:
            blog_table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save blog post"})

        return _response(201, item)

    # ── GET /blog (list) ────────────────────────────────────────────────────
    if http_method == "GET" and not post_id:
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        status_filter: str | None = query_params.get("status")
        limit = min(int(query_params.get("limit", "50")), 100)

        blog_table = dynamodb.Table(BLOG_TABLE)
        try:
            kwargs: dict[str, Any] = {
                "KeyConditionExpression": boto3.dynamodb.conditions.Key("userId").eq(user_id),
                "ScanIndexForward": False,
            }
            if status_filter in ("draft", "published"):
                kwargs["FilterExpression"] = boto3.dynamodb.conditions.Attr("status").eq(status_filter)
                kwargs["Limit"] = limit

                items: list[dict[str, Any]] = []
                exclusive_start_key: dict[str, Any] | None = None
                while len(items) < limit:
                    page_kwargs = dict(kwargs)
                    if exclusive_start_key:
                        page_kwargs["ExclusiveStartKey"] = exclusive_start_key
                    result = blog_table.query(**page_kwargs)
                    items.extend(result.get("Items", []))
                    if len(items) >= limit:
                        items = items[:limit]
                        break
                    exclusive_start_key = result.get("LastEvaluatedKey")
                    if not exclusive_start_key:
                        break
            else:
                kwargs["Limit"] = limit
                result = blog_table.query(**kwargs)
                items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve blog posts"})

        return _response(200, {"posts": items, "count": len(items)})

    # ── GET /blog/{postId} ──────────────────────────────────────────────────
    if http_method == "GET" and post_id:
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        blog_table = dynamodb.Table(BLOG_TABLE)
        try:
            result = blog_table.get_item(Key={"userId": user_id, "postId": post_id})
            item = result.get("Item")
        except ClientError as exc:
            logger.error("DynamoDB get_item error: %s", exc)
            return _response(500, {"message": "Failed to retrieve blog post"})

        if not item:
            return _response(404, {"message": "Blog post not found"})

        return _response(200, item)

    # ── PUT /blog/{postId} ──────────────────────────────────────────────────
    if http_method == "PUT" and post_id:
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        blog_table = dynamodb.Table(BLOG_TABLE)

        # Verify ownership
        try:
            existing = blog_table.get_item(Key={"userId": user_id, "postId": post_id})
            if not existing.get("Item"):
                return _response(404, {"message": "Blog post not found"})
        except ClientError as exc:
            logger.error("DynamoDB get_item error: %s", exc)
            return _response(500, {"message": "Failed to retrieve blog post"})

        now = _now_iso()
        update_parts = []
        expr_names: dict[str, str] = {}
        expr_values: dict[str, Any] = {":updatedAt": now}

        allowed_fields = {"title", "content", "excerpt", "tags", "status"}
        for field in allowed_fields:
            if field in body:
                safe_key = f"#{field}"
                update_parts.append(f"{safe_key} = :{field}")
                expr_names[safe_key] = field
                expr_values[f":{field}"] = body[field]

        if not update_parts:
            return _response(400, {"message": "No updatable fields provided"})

        # Handle publishing: set publishedAt timestamp
        if body.get("status") == "published" and not existing["Item"].get("publishedAt"):
            update_parts.append("#publishedAt = :publishedAt")
            expr_names["#publishedAt"] = "publishedAt"
            expr_values[":publishedAt"] = now

        update_parts.append("#updatedAt = :updatedAt")
        expr_names["#updatedAt"] = "updatedAt"

        try:
            result = blog_table.update_item(
                Key={"userId": user_id, "postId": post_id},
                UpdateExpression="SET " + ", ".join(update_parts),
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values,
                ReturnValues="ALL_NEW",
            )
            return _response(200, result.get("Attributes", {}))
        except ClientError as exc:
            logger.error("DynamoDB update_item error: %s", exc)
            return _response(500, {"message": "Failed to update blog post"})

    # ── DELETE /blog/{postId} ───────────────────────────────────────────────
    if http_method == "DELETE" and post_id:
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        blog_table = dynamodb.Table(BLOG_TABLE)
        try:
            existing = blog_table.get_item(Key={"userId": user_id, "postId": post_id})
            if not existing.get("Item"):
                return _response(404, {"message": "Blog post not found"})
            blog_table.delete_item(Key={"userId": user_id, "postId": post_id})
        except ClientError as exc:
            logger.error("DynamoDB error: %s", exc)
            return _response(500, {"message": "Failed to delete blog post"})

        return _response(200, {"message": "Blog post deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
