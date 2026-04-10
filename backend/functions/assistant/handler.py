"""
Assistant Lambda handler – general-purpose AI life manager assistant.

POST /assistant
Body: { "sessionId": "optional-uuid", "message": "...", "context": "optional page context" }
Response: { "sessionId": "...", "message": { ... } }
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

SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE", "portfolio-sessions")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))
MAX_MESSAGE_HISTORY = 20

SYSTEM_PROMPT = """당신은 사용자의 개인 AI 라이프 매니저 어시스턴트입니다.
목표 관리, 운동 기록, 일상 기록(다이어리), 지식 관리, 학습 계획 등 삶의 다양한 영역에서 사용자를 도와줍니다.

역할:
- 사용자의 목표 설정과 진행 상황 분석을 도와줍니다
- 운동 계획 및 건강 관련 조언을 제공합니다
- 일상 기록과 감정 정리를 도와줍니다
- 책, 아티클, 강의 등 학습 내용 정리를 도와줍니다
- 전반적인 생산성과 자기계발을 위한 조언을 제공합니다

항상 한국어로 친근하고 격려하는 톤으로 응답하세요.
구체적이고 실용적인 조언을 제공하며, 사용자의 상황에 맞춤화된 도움을 드리세요."""


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


def _get_session(session_id: str) -> dict[str, Any] | None:
    table = dynamodb.Table(SESSIONS_TABLE)
    try:
        return table.get_item(Key={"sessionId": session_id}).get("Item")
    except ClientError as exc:
        logger.error("DynamoDB get_item error: %s", exc)
        return None


def _save_session(session: dict[str, Any]) -> None:
    table = dynamodb.Table(SESSIONS_TABLE)
    try:
        table.put_item(Item=session)
    except ClientError as exc:
        logger.error("DynamoDB put_item error: %s", exc)


def _call_bedrock(messages: list[dict[str, Any]], system_prompt: str) -> str:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": system_prompt,
        "messages": messages,
    }
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"message": "Invalid JSON body"})

    user_message_text: str = body.get("message", "").strip()
    if not user_message_text:
        return _response(400, {"message": "'message' field is required"})

    session_id: str = body.get("sessionId") or str(uuid.uuid4())
    page_context: str = body.get("context", "").strip()
    now = _now_iso()

    # Build system prompt, optionally injecting page context
    system_prompt = SYSTEM_PROMPT
    if page_context:
        system_prompt = f"{SYSTEM_PROMPT}\n\n현재 컨텍스트: {page_context}"

    # Load or create session
    session = _get_session(session_id) or {
        "sessionId": session_id,
        "messages": [],
        "createdAt": now,
        "updatedAt": now,
    }

    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": user_message_text,
        "timestamp": now,
    }
    session["messages"].append(user_msg)

    bedrock_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in session["messages"][-MAX_MESSAGE_HISTORY:]
    ]

    try:
        reply_text = _call_bedrock(bedrock_messages, system_prompt)
    except ClientError as exc:
        logger.error("Bedrock invocation error: %s", exc)
        return _response(502, {"message": "AI service error. Please try again."})

    assistant_msg = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": reply_text,
        "timestamp": _now_iso(),
    }
    session["messages"].append(assistant_msg)
    session["updatedAt"] = assistant_msg["timestamp"]
    _save_session(session)

    return _response(200, {
        "sessionId": session_id,
        "message": assistant_msg,
    })
