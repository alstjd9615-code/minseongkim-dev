"""
Chat Lambda handler – integrates with AWS Bedrock (Claude) and DynamoDB.

POST /chat
Body: { "sessionId": "optional-uuid", "message": "user message" }
Response: { "sessionId": "...", "message": { ... }, "portfolio": { ... } }
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

# ---------------------------------------------------------------------------
# AWS clients (initialised outside the handler for Lambda warm-start reuse)
# ---------------------------------------------------------------------------
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("BEDROCK_REGION", "us-east-1"))

SESSIONS_TABLE = os.environ.get("SESSIONS_TABLE", "portfolio-sessions")
PORTFOLIOS_TABLE = os.environ.get("PORTFOLIOS_TABLE", "portfolio-data")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4096"))
# Maximum number of conversation turns sent to Bedrock to stay within context limits
MAX_MESSAGE_HISTORY = 20

SYSTEM_PROMPT = """
You are an AI assistant that helps users build a professional portfolio.
Based on the conversation, extract and organise information into the following
portfolio sections (only include sections for which you have data):

- intro   : Short personal introduction / bio
- experience : Work history and professional experience
- skills  : Technical and soft skills
- projects : Notable projects with descriptions
- education : Academic background
- contact : Contact details / social links

After answering the user naturally in Korean, append a JSON block wrapped in
<portfolio> tags at the very end of your response, like this:

<portfolio>
{
  "sections": [
    {
      "type": "intro",
      "title": "소개",
      "content": "markdown content here"
    }
  ]
}
</portfolio>

The content field should be formatted in Markdown.
Respond to the user in Korean.
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }


def _response(status: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **_cors_headers()},
        "body": json.dumps(body, ensure_ascii=False),
    }


# ---------------------------------------------------------------------------
# DynamoDB helpers
# ---------------------------------------------------------------------------


def _get_session(session_id: str) -> dict[str, Any] | None:
    table = dynamodb.Table(SESSIONS_TABLE)
    try:
        item = table.get_item(Key={"sessionId": session_id}).get("Item")
        return item
    except ClientError as exc:
        logger.error("DynamoDB get_item error: %s", exc)
        return None


def _save_session(session: dict[str, Any]) -> None:
    table = dynamodb.Table(SESSIONS_TABLE)
    try:
        table.put_item(Item=session)
    except ClientError as exc:
        logger.error("DynamoDB put_item error: %s", exc)


def _save_portfolio(portfolio: dict[str, Any]) -> None:
    table = dynamodb.Table(PORTFOLIOS_TABLE)
    try:
        table.put_item(Item=portfolio)
    except ClientError as exc:
        logger.error("DynamoDB put_item (portfolio) error: %s", exc)


# ---------------------------------------------------------------------------
# Bedrock helpers
# ---------------------------------------------------------------------------


def _call_bedrock(messages: list[dict[str, Any]]) -> str:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": SYSTEM_PROMPT,
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


def _extract_portfolio_json(raw_text: str) -> tuple[str, list[dict[str, Any]]]:
    """Split assistant reply into human-visible text and portfolio JSON."""
    import re

    match = re.search(r"<portfolio>(.*?)</portfolio>", raw_text, re.DOTALL)
    if not match:
        return raw_text.strip(), []

    try:
        portfolio_data = json.loads(match.group(1).strip())
        sections = portfolio_data.get("sections", [])
    except json.JSONDecodeError:
        sections = []

    clean_text = raw_text[: match.start()].strip()
    return clean_text, sections


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    # Handle CORS pre-flight
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
    now = _now_iso()

    # Load or create session
    session = _get_session(session_id) or {
        "sessionId": session_id,
        "messages": [],
        "createdAt": now,
        "updatedAt": now,
    }

    # Append user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": user_message_text,
        "timestamp": now,
    }
    session["messages"].append(user_msg)

    # Build Bedrock message history (keep last 20 turns to stay within limits)
    bedrock_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in session["messages"][-MAX_MESSAGE_HISTORY:]
    ]

    # Call Bedrock
    try:
        raw_reply = _call_bedrock(bedrock_messages)
    except ClientError as exc:
        logger.error("Bedrock invocation error: %s", exc)
        return _response(502, {"message": "AI service error. Please try again."})

    clean_reply, sections = _extract_portfolio_json(raw_reply)

    assistant_msg = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": clean_reply,
        "timestamp": _now_iso(),
    }
    reply_time = assistant_msg["timestamp"]
    session["messages"].append(assistant_msg)
    session["updatedAt"] = reply_time
    _save_session(session)

    # Build / update portfolio
    portfolio_id = str(uuid.uuid4())
    portfolio = {
        "id": portfolio_id,
        "sessionId": session_id,
        "sections": [
            {"id": str(uuid.uuid4()), **s} for s in sections
        ],
        "createdAt": now,
        "updatedAt": reply_time,
    }
    if sections:
        _save_portfolio(portfolio)

    return _response(
        200,
        {
            "sessionId": session_id,
            "message": assistant_msg,
            "portfolio": portfolio,
        },
    )
