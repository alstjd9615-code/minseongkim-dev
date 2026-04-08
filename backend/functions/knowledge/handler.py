"""
Knowledge Lambda handler – stores books, articles, and study notes with AI summarisation.

POST   /knowledge               → save a knowledge entry (requires Cognito auth)
GET    /knowledge               → list user's knowledge entries
DELETE /knowledge/{knowledgeId} → delete a knowledge entry
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
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("BEDROCK_REGION", "us-east-1"))

KNOWLEDGE_TABLE = os.environ.get("KNOWLEDGE_TABLE", "lifemanager-knowledge")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "512"))

VALID_KNOWLEDGE_TYPES = {"책", "아티클", "강의", "영상", "기타"}

SUMMARY_PROMPT = """당신은 학습 기록을 정리하는 AI입니다.
사용자가 책, 아티클, 강의 등에서 정리한 노트를 읽고 핵심 요약과 태그를 추출하세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "summary": "핵심 내용 3줄 이내 요약",
  "tags": ["태그1", "태그2", "태그3"]
}"""


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
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        return claims.get("sub")
    except (KeyError, TypeError):
        return None


def _summarise_with_bedrock(title: str, notes: str) -> dict[str, Any]:
    """Call Bedrock to summarise the knowledge entry."""
    content = f"제목: {title}\n\n노트:\n{notes}"
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": SUMMARY_PROMPT,
        "messages": [{"role": "user", "content": content}],
    }
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    text = json.loads(response["body"].read())["content"][0]["text"].strip()
    result = json.loads(text)
    if not isinstance(result.get("tags"), list):
        result["tags"] = []
    result["tags"] = result["tags"][:5]
    return result


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")

    # ── POST /knowledge ────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        knowledge_type: str = body.get("knowledgeType", "").strip()
        if knowledge_type not in VALID_KNOWLEDGE_TYPES:
            return _response(400, {"message": "Invalid knowledgeType"})

        title: str = body.get("title", "").strip()
        if not title:
            return _response(400, {"message": "'title' field is required"})
        if len(title) > 200:
            return _response(400, {"message": "Title too long (max 200 characters)"})

        notes: str = body.get("notes", "").strip()
        if not notes:
            return _response(400, {"message": "'notes' field is required"})
        if len(notes) > 5000:
            return _response(400, {"message": "Notes too long (max 5000 characters)"})

        author: str = body.get("author", "").strip()

        try:
            ai_result = _summarise_with_bedrock(title, notes)
        except (ClientError, json.JSONDecodeError, KeyError) as exc:
            logger.error("Bedrock summarisation error: %s", exc)
            ai_result = {"summary": "", "tags": []}

        knowledge_id = str(uuid.uuid4())
        now = _now_iso()
        item = {
            "userId": user_id,
            "knowledgeId": knowledge_id,
            "knowledgeType": knowledge_type,
            "title": title,
            "author": author,
            "notes": notes,
            "tags": ai_result.get("tags", []),
            "aiSummary": ai_result.get("summary", ""),
            "createdAt": now,
            "updatedAt": now,
        }

        table = dynamodb.Table(KNOWLEDGE_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save knowledge entry"})

        return _response(201, item)

    # ── GET /knowledge ─────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        limit = min(int(query_params.get("limit", "50")), 100)

        table = dynamodb.Table(KNOWLEDGE_TABLE)
        try:
            result = table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve knowledge entries"})

        return _response(200, {"entries": items, "count": len(items)})

    # ── DELETE /knowledge/{knowledgeId} ───────────────────────────────────
    if http_method == "DELETE":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        path_params = event.get("pathParameters") or {}
        knowledge_id: str | None = path_params.get("knowledgeId")
        if not knowledge_id:
            return _response(400, {"message": "knowledgeId is required"})

        table = dynamodb.Table(KNOWLEDGE_TABLE)
        try:
            table.delete_item(
                Key={"userId": user_id, "knowledgeId": knowledge_id},
                ConditionExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Knowledge entry not found"})
        except ClientError as exc:
            logger.error("DynamoDB delete_item error: %s", exc)
            return _response(500, {"message": "Failed to delete knowledge entry"})

        return _response(200, {"message": "Deleted"})

    return _response(405, {"message": f"Method {http_method} not allowed"})
