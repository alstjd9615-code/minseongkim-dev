"""
Portfolio Lambda handler – CRUD for portfolio data in DynamoDB.

GET  /portfolio/{sessionId}  → fetch the latest portfolio for a session
PUT  /portfolio/{sessionId}  → update portfolio sections
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
PORTFOLIOS_TABLE = os.environ.get("PORTFOLIOS_TABLE", "portfolio-data")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    }


def _response(status: int, body: Any) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **_cors_headers()},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _get_portfolio_by_session(session_id: str) -> dict[str, Any] | None:
    table = dynamodb.Table(PORTFOLIOS_TABLE)
    try:
        result = table.query(
            IndexName="sessionId-index",
            KeyConditionExpression=boto3.dynamodb.conditions.Key("sessionId").eq(session_id),
            ScanIndexForward=False,
            Limit=1,
        )
        items = result.get("Items", [])
        return items[0] if items else None
    except ClientError as exc:
        logger.error("DynamoDB query error: %s", exc)
        return None


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    http_method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    session_id: str = path_params.get("sessionId", "")

    if not session_id:
        return _response(400, {"message": "'sessionId' path parameter is required"})

    # -----------------------------------------------------------------------
    # GET /portfolio/{sessionId}
    # -----------------------------------------------------------------------
    if http_method == "GET":
        portfolio = _get_portfolio_by_session(session_id)
        if not portfolio:
            return _response(404, {"message": "Portfolio not found"})
        return _response(200, portfolio)

    # -----------------------------------------------------------------------
    # PUT /portfolio/{sessionId}
    # -----------------------------------------------------------------------
    if http_method == "PUT":
        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _response(400, {"message": "Invalid JSON body"})

        sections = body.get("sections")
        is_public = body.get("isPublic")

        if sections is not None and not isinstance(sections, list):
            return _response(400, {"message": "'sections' must be a list"})

        portfolio = _get_portfolio_by_session(session_id)
        if not portfolio:
            return _response(404, {"message": "Portfolio not found"})

        if sections is not None:
            portfolio["sections"] = sections
        if is_public is not None:
            portfolio["isPublic"] = bool(is_public)
        portfolio["updatedAt"] = _now_iso()

        table = dynamodb.Table(PORTFOLIOS_TABLE)
        try:
            table.put_item(Item=portfolio)
        except ClientError as exc:
            logger.error("DynamoDB put_item error: %s", exc)
            return _response(500, {"message": "Failed to update portfolio"})

        return _response(200, portfolio)

    return _response(405, {"message": f"Method {http_method} not allowed"})
