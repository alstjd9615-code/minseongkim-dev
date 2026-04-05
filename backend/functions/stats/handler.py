"""
Stats Lambda handler – aggregates diary statistics for the dashboard.

GET /stats → returns category counts, daily activity (last 30 days), streak
"""

from __future__ import annotations

import json
import logging
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))

DIARY_TABLE = os.environ.get("DIARY_TABLE", "portfolio-diary")
VALID_CATEGORIES = ["독서", "운동", "프로젝트", "시사", "목표", "아이디어"]


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
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


def _calculate_streak(daily_set: set[str]) -> int:
    """Calculate the current consecutive day streak."""
    today = datetime.now(timezone.utc).date()
    streak = 0
    current = today
    while current.isoformat() in daily_set:
        streak += 1
        current -= timedelta(days=1)
    return streak


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    user_id = _get_user_id(event)
    if not user_id:
        return _response(401, {"message": "Unauthorised"})

    table = dynamodb.Table(DIARY_TABLE)

    # Fetch all entries for this user (up to 1000 for stats)
    try:
        result = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id),
            ScanIndexForward=False,
            Limit=1000,
        )
        items = result.get("Items", [])
    except ClientError as exc:
        logger.error("DynamoDB query error: %s", exc)
        return _response(500, {"message": "Failed to retrieve stats"})

    total = len(items)

    # Category counts
    category_counts: dict[str, int] = defaultdict(int)
    for cat in VALID_CATEGORIES:
        category_counts[cat] = 0
    for item in items:
        cat = item.get("category", "아이디어")
        category_counts[cat] += 1

    # Daily activity for the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).date()
    daily_activity: dict[str, int] = {}
    daily_set: set[str] = set()

    # Initialise all 30 days with 0
    for i in range(31):
        day = (thirty_days_ago + timedelta(days=i)).isoformat()
        daily_activity[day] = 0

    for item in items:
        created_at = item.get("createdAt", "")
        if created_at:
            try:
                day = created_at[:10]  # YYYY-MM-DD
                if day >= thirty_days_ago.isoformat():
                    daily_activity[day] = daily_activity.get(day, 0) + 1
                daily_set.add(day)
            except (ValueError, IndexError):
                pass

    daily_list = [{"date": d, "count": c} for d, c in sorted(daily_activity.items())]

    # Streak
    streak = _calculate_streak(daily_set)

    # Most active category
    most_active = max(category_counts.items(), key=lambda x: x[1])[0] if total > 0 else None

    # Category breakdown for charts
    category_breakdown = [
        {"category": cat, "count": category_counts[cat]}
        for cat in VALID_CATEGORIES
    ]

    return _response(200, {
        "total": total,
        "streak": streak,
        "mostActiveCategory": most_active,
        "categoryBreakdown": category_breakdown,
        "dailyActivity": daily_list,
    })
