"""
Stats Lambda handler – aggregates statistics for the dashboard.

GET /stats → returns diary, workout, goals and knowledge stats, plus recent activity
"""

from __future__ import annotations

import json
import logging
import os
from collections import defaultdict  # noqa: F401
from datetime import datetime, timedelta, timezone
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))

DIARY_TABLE = os.environ.get("DIARY_TABLE", "portfolio-diary")
WORKOUT_TABLE = os.environ.get("WORKOUT_TABLE", "portfolio-workout")
GOALS_TABLE = os.environ.get("GOALS_TABLE", "portfolio-goals")
KNOWLEDGE_TABLE = os.environ.get("KNOWLEDGE_TABLE", "portfolio-knowledge")
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


def _query_table(table_name: str, user_id: str, limit: int = 1000) -> list[dict[str, Any]]:
    """Query a DynamoDB table by userId."""
    try:
        table = dynamodb.Table(table_name)
        result = table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ScanIndexForward=False,
            Limit=limit,
        )
        return result.get("Items", [])
    except ClientError as exc:
        logger.error("DynamoDB query error for %s: %s", table_name, exc)
        return []


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:  # noqa: ARG001
    if event.get("httpMethod") == "OPTIONS":
        return _response(200, {})

    user_id = _get_user_id(event)
    if not user_id:
        return _response(401, {"message": "Unauthorised"})

    now_utc = datetime.now(timezone.utc)
    seven_days_ago = (now_utc - timedelta(days=7)).isoformat()
    thirty_days_ago = (now_utc - timedelta(days=30)).date()

    # ── Diary stats ────────────────────────────────────────────────────────
    diary_items = _query_table(DIARY_TABLE, user_id)
    total = len(diary_items)

    category_counts: dict[str, int] = {cat: 0 for cat in VALID_CATEGORIES}
    daily_activity: dict[str, int] = {}
    daily_set: set[str] = set()

    for i in range(31):
        day = (thirty_days_ago + timedelta(days=i)).isoformat()
        daily_activity[day] = 0

    for item in diary_items:
        cat = item.get("category", "아이디어")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        created_at = item.get("createdAt", "")
        if created_at:
            try:
                day = created_at[:10]
                if day >= thirty_days_ago.isoformat():
                    daily_activity[day] = daily_activity.get(day, 0) + 1
                daily_set.add(day)
            except (ValueError, IndexError):
                pass

    daily_list = [{"date": d, "count": c} for d, c in sorted(daily_activity.items())]
    streak = _calculate_streak(daily_set)
    most_active = max(category_counts.items(), key=lambda x: x[1])[0] if total > 0 else None
    category_breakdown = [{"category": cat, "count": category_counts[cat]} for cat in VALID_CATEGORIES]

    # ── Workout stats ──────────────────────────────────────────────────────
    workout_items = _query_table(WORKOUT_TABLE, user_id)
    workout_this_week = sum(
        1 for w in workout_items if w.get("createdAt", "") >= seven_days_ago
    )

    # ── Goals stats ────────────────────────────────────────────────────────
    goals_items = _query_table(GOALS_TABLE, user_id)
    goals_active = sum(1 for g in goals_items if g.get("status") == "진행중")
    goals_done = sum(1 for g in goals_items if g.get("status") == "완료")
    progress_values = [int(g.get("progress", 0)) for g in goals_items if goals_items]
    goals_avg_progress = int(sum(progress_values) / len(progress_values)) if progress_values else 0

    # ── Knowledge stats ────────────────────────────────────────────────────
    knowledge_items = _query_table(KNOWLEDGE_TABLE, user_id)
    knowledge_total = len(knowledge_items)

    # ── Recent activity timeline ───────────────────────────────────────────
    activity_items: list[dict[str, Any]] = []

    for item in diary_items[:3]:
        activity_items.append({
            "type": "diary",
            "title": item.get("summary") or item.get("originalContent", "")[:40],
            "createdAt": item.get("createdAt", ""),
        })
    for item in workout_items[:3]:
        activity_items.append({
            "type": "workout",
            "title": f"{item.get('workoutType', '')} {item.get('durationMin', '')}분",
            "createdAt": item.get("createdAt", ""),
        })
    for item in knowledge_items[:3]:
        activity_items.append({
            "type": "knowledge",
            "title": item.get("title", ""),
            "createdAt": item.get("createdAt", ""),
        })
    for item in goals_items[:3]:
        activity_items.append({
            "type": "goal",
            "title": item.get("title", ""),
            "createdAt": item.get("createdAt", ""),
        })

    activity_items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    recent_activity = activity_items[:10]

    return _response(200, {
        "total": total,
        "streak": streak,
        "mostActiveCategory": most_active,
        "categoryBreakdown": category_breakdown,
        "dailyActivity": daily_list,
        "workoutThisWeek": workout_this_week,
        "goalsActive": goals_active,
        "goalsDone": goals_done,
        "goalsAvgProgress": goals_avg_progress,
        "knowledgeTotal": knowledge_total,
        "recentActivity": recent_activity,
    })
