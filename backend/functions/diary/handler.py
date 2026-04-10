"""
Diary Lambda handler – categorises diary entries with Bedrock and stores them.

POST /diary   → classify entry and save (requires Cognito auth)
GET  /diary   → list user's diary entries, optional ?category= filter
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

DIARY_TABLE = os.environ.get("DIARY_TABLE", "portfolio-diary")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "512"))

VALID_CATEGORIES = {"독서", "운동", "프로젝트", "시사", "목표", "아이디어"}
VALID_MOODS = {"좋음", "보통", "나쁨"}

CLASSIFICATION_PROMPT = """당신은 일상 기록을 분류하는 AI입니다.
사용자의 일상 입력을 읽고 아래 6가지 카테고리 중 하나로 분류하고, 한 줄 요약과 태그를 추출하세요.

카테고리:
- 독서: 책 읽기, 독서 기록, 책 추천, 서평
- 운동: 운동, 헬스, 달리기, 스포츠, 신체 활동
- 프로젝트: 개발, 업무, 사이드 프로젝트, 코딩, 작업
- 시사: 뉴스, 사회 이슈, 정치, 경제, 시사 이야기
- 목표: 목표 설정, 계획, 다짐, 습관, 성장
- 아이디어: 아이디어, 영감, 창의적 생각, 메모

반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "category": "카테고리명",
  "summary": "한 줄 요약 (30자 이내)",
  "tags": ["태그1", "태그2", "태그3"]
}"""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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


def _classify_with_bedrock(content: str) -> dict[str, Any]:
    """Call Bedrock to classify and summarise the diary entry."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": CLASSIFICATION_PROMPT,
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

    # Validate category; default to 아이디어 if unknown
    if result.get("category") not in VALID_CATEGORIES:
        result["category"] = "아이디어"
    if not isinstance(result.get("tags"), list):
        result["tags"] = []
    result["tags"] = result["tags"][:5]  # limit tags
    return result


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")

    # ── POST /diary ────────────────────────────────────────────────────────
    if http_method == "POST":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        content: str = body.get("content", "").strip()
        if not content:
            return _response(400, {"message": "'content' field is required"})
        if len(content) > 5000:
            return _response(400, {"message": "Content too long (max 5000 characters)"})

        mood: str | None = body.get("mood")
        if mood is not None and mood not in VALID_MOODS:
            return _response(400, {"message": f"Invalid mood. Must be one of: {', '.join(VALID_MOODS)}"})

        try:
            classification = _classify_with_bedrock(content)
        except (ClientError, json.JSONDecodeError, KeyError) as exc:
            logger.error("Bedrock classification error: %s", exc)
            return _response(502, {"message": "AI classification failed. Please try again."})

        entry_id = str(uuid.uuid4())
        now = _now_iso()
        item = {
            "userId": user_id,
            "entryId": entry_id,
            "category": classification["category"],
            "summary": classification.get("summary", ""),
            "tags": classification.get("tags", []),
            "originalContent": content,
            "createdAt": now,
            "updatedAt": now,
        }
        if mood:
            item["mood"] = mood

        table = dynamodb.Table(DIARY_TABLE)
        try:
            table.put_item(Item=item)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to save diary entry"})

        return _response(201, item)

    # ── GET /diary ─────────────────────────────────────────────────────────
    if http_method == "GET":
        user_id = _get_user_id(event)
        if not user_id:
            return _response(401, {"message": "Unauthorised"})

        query_params = event.get("queryStringParameters") or {}
        category_filter: str | None = query_params.get("category")
        limit = min(int(query_params.get("limit", "50")), 100)

        table = dynamodb.Table(DIARY_TABLE)
        try:
            key_cond = boto3.dynamodb.conditions.Key("userId").eq(user_id)
            kwargs: dict[str, Any] = {
                "KeyConditionExpression": key_cond,
                "ScanIndexForward": False,  # newest first
                "Limit": limit,
            }
            if category_filter and category_filter in VALID_CATEGORIES:
                # Use the GSI for category filtering
                result = table.query(
                    IndexName="category-createdAt-index",
                    KeyConditionExpression=boto3.dynamodb.conditions.Key("category").eq(category_filter),
                    FilterExpression=boto3.dynamodb.conditions.Attr("userId").eq(user_id),
                    ScanIndexForward=False,
                    Limit=limit,
                )
            else:
                result = table.query(**kwargs)
            items = result.get("Items", [])
        except ClientError as exc:
            logger.error("DynamoDB query error: %s", exc)
            return _response(500, {"message": "Failed to retrieve diary entries"})

        return _response(200, {"entries": items, "count": len(items)})

    return _response(405, {"message": f"Method {http_method} not allowed"})
