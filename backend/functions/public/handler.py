"""
Public portfolio Lambda handler – serves publicly shared portfolios without auth.

GET /public/{portfolioId} → returns portfolio if isPublic is true
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
PORTFOLIOS_TABLE = os.environ.get("PORTFOLIOS_TABLE", "portfolio-data")


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
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
    portfolio_id: str = path_params.get("portfolioId", "")

    if not portfolio_id:
        return _response(400, {"message": "'portfolioId' path parameter is required"})

    table = dynamodb.Table(PORTFOLIOS_TABLE)
    try:
        result = table.get_item(Key={"id": portfolio_id})
        item = result.get("Item")
    except ClientError as exc:
        logger.error("DynamoDB get_item error: %s", exc)
        return _response(500, {"message": "Failed to retrieve portfolio"})

    if not item:
        return _response(404, {"message": "Portfolio not found"})

    # Only return portfolios that have been explicitly made public
    if not item.get("isPublic", False):
        return _response(404, {"message": "Portfolio not found"})

    # Strip internal fields before returning
    public_item = {k: v for k, v in item.items() if k != "sessionId"}
    return _response(200, public_item)
