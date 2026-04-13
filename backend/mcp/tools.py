"""
MCP tool implementations.

Each public function in this module is a pure, side-effect-free tool that
takes structured Python data and returns a :class:`~mcp.schemas.MCPToolResult`.
Importing this module also registers every tool in :data:`~mcp.registry.default_registry`.

Available tools
---------------
- ``get_goal_status``       – goal count and active-goal list
- ``get_task_urgency``      – Eisenhower-matrix urgency breakdown
- ``get_habit_streak``      – days since last check per habit
- ``get_workout_frequency`` – workout count in the last 7 days
- ``get_lifewheel_scores``  – domain scores and low-scoring domains
"""

from __future__ import annotations

from datetime import date
from typing import Any

from mcp.registry import default_registry
from mcp.schemas import MCPToolResult


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------


def get_goal_status(goals: list[dict[str, Any]]) -> MCPToolResult:
    """Return a summary of goal counts and the list of active goals."""
    active = [g for g in goals if g.get("status") == "진행중"]
    completed = [g for g in goals if g.get("status") == "완료"]
    return MCPToolResult(
        tool="get_goal_status",
        success=True,
        data={
            "total": len(goals),
            "active": len(active),
            "completed": len(completed),
            "active_goals": active,
        },
    )


def get_task_urgency(tasks: list[dict[str, Any]]) -> MCPToolResult:
    """Return pending task counts per Eisenhower quadrant (Q1 and Q2)."""
    q1 = [t for t in tasks if t.get("quadrant") == "Q1" and not t.get("completed")]
    q2 = [t for t in tasks if t.get("quadrant") == "Q2" and not t.get("completed")]
    return MCPToolResult(
        tool="get_task_urgency",
        success=True,
        data={
            "pending_q1": len(q1),
            "pending_q2": len(q2),
            "q1_tasks": q1,
            "q2_tasks": q2,
        },
    )


def get_habit_streak(
    habits: list[dict[str, Any]], reference_date: str
) -> MCPToolResult:
    """
    Return the number of days since each habit was last checked.

    Parameters
    ----------
    habits:
        List of habit records.  Each record may contain a ``checkDates`` list
        of ISO-8601 date strings.
    reference_date:
        ISO-8601 date string used as "today" so results are deterministic in
        tests and eval scenarios.
    """
    ref = date.fromisoformat(reference_date)
    results: list[dict[str, Any]] = []
    for habit in habits:
        check_dates = habit.get("checkDates", [])
        if check_dates:
            last_check = max(date.fromisoformat(d) for d in check_dates)
            days_since: int | None = (ref - last_check).days
        else:
            days_since = None
        results.append(
            {
                "id": habit.get("id"),
                "name": habit.get("name"),
                "days_since_last_check": days_since,
            }
        )
    return MCPToolResult(
        tool="get_habit_streak",
        success=True,
        data={"habits": results},
    )


def get_workout_frequency(
    workouts: list[dict[str, Any]], reference_date: str
) -> MCPToolResult:
    """
    Return the number of workouts recorded within the past 7 days.

    The 7-day window is inclusive: a workout dated exactly 7 days before
    *reference_date* is counted (difference == 7 days).
    """
    ref = date.fromisoformat(reference_date)
    recent = [
        w
        for w in workouts
        if (ref - date.fromisoformat(w.get("date", "1970-01-01"))).days <= 7
    ]
    return MCPToolResult(
        tool="get_workout_frequency",
        success=True,
        data={
            "last_7_days": len(recent),
            "workouts": recent,
        },
    )


def get_lifewheel_scores(
    lifewheel: dict[str, Any] | None = None,
) -> MCPToolResult:
    """
    Return life-wheel domain scores with low-scoring domain detection.

    Returns a ``NO_DATA`` error when *lifewheel* is ``None``.
    """
    if not lifewheel:
        return MCPToolResult(
            tool="get_lifewheel_scores",
            success=False,
            error="No life wheel data available.",
            error_code="NO_DATA",
        )
    scores: dict[str, int] = lifewheel.get("scores", {})
    low_domains = {k: v for k, v in scores.items() if v < 4}
    average = sum(scores.values()) / len(scores) if scores else 0.0
    return MCPToolResult(
        tool="get_lifewheel_scores",
        success=True,
        data={
            "scores": scores,
            "low_domains": low_domains,
            "average": average,
        },
    )


# ---------------------------------------------------------------------------
# Register all tools in the shared default registry
# ---------------------------------------------------------------------------

default_registry.register("get_goal_status", lambda goals: get_goal_status(goals))
default_registry.register("get_task_urgency", lambda tasks: get_task_urgency(tasks))
default_registry.register("get_habit_streak", get_habit_streak)
default_registry.register("get_workout_frequency", get_workout_frequency)
default_registry.register(
    "get_lifewheel_scores",
    lambda lifewheel=None: get_lifewheel_scores(lifewheel),
)
