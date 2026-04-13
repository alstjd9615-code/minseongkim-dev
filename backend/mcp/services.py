"""
MacroSignalService – deterministic macro-to-signal flow.

This service applies rule-based logic to aggregated user data (the "macro"
layer) and produces a list of :class:`~mcp.schemas.SignalDecision` objects
(the "signal" layer).  All logic is pure Python with no external I/O, making
it easy to unit-test and evaluate against fixture scenarios.

Signal domains
--------------
- ``goal_progress``      – goal deadlines and progress percentage
- ``task_urgency``       – Eisenhower-matrix Q1/Q2 backlog
- ``habit_consistency``  – days since last habit check
- ``workout_frequency``  – workout cadence over the past 7 days
- ``lifewheel_balance``  – life-wheel domain score distribution

Decision levels (highest → lowest priority)
--------------------------------------------
- ``action_required``  – immediate attention needed
- ``at_risk``          – trending negative, warrants monitoring
- ``on_track``         – healthy state
- ``no_data``          – no records available to evaluate
"""

from __future__ import annotations

from datetime import date
from typing import Any

from mcp.schemas import DecisionKind, MacroInput, SignalDecision


def _days_until(due_date_str: str, ref: date) -> int:
    """Return signed days from *ref* to *due_date_str* (negative = overdue)."""
    return (date.fromisoformat(due_date_str) - ref).days


class MacroSignalService:
    """
    Stateless service that converts a :class:`~mcp.schemas.MacroInput` into
    a list of :class:`~mcp.schemas.SignalDecision` objects.

    Pass *reference_date* (ISO-8601) to :meth:`compute_signals` to fix "today"
    for deterministic evaluation.  When omitted, :func:`date.today` is used.
    """

    def compute_signals(
        self,
        macro: MacroInput,
        reference_date: str | None = None,
    ) -> list[SignalDecision]:
        """Run all signal computations and return the combined list."""
        ref = date.fromisoformat(reference_date) if reference_date else date.today()
        signals: list[SignalDecision] = []
        signals.extend(self._goal_signals(macro.goals, ref))
        signals.extend(self._task_signals(macro.tasks))
        signals.extend(self._habit_signals(macro.habits, ref))
        signals.extend(self._workout_signals(macro.workouts, ref))
        signals.extend(self._lifewheel_signals(macro.lifewheel))
        return signals

    # ------------------------------------------------------------------
    # Goal signals
    # ------------------------------------------------------------------

    def _goal_signals(
        self, goals: list[dict[str, Any]], ref: date
    ) -> list[SignalDecision]:
        if not goals:
            return [self._signal("goal_progress", "no_data", 1.0, "No goals recorded.")]

        active = [g for g in goals if g.get("status") == "진행중"]
        if not active:
            return [
                self._signal("goal_progress", "on_track", 1.0, "No active goals.")
            ]

        results: list[SignalDecision] = []
        for goal in active:
            progress: int = goal.get("progress", 0)
            due = goal.get("dueDate")
            name: str = goal.get("title", "Goal")

            if due:
                days_left = _days_until(due, ref)
                if days_left < 0:
                    results.append(
                        self._signal(
                            "goal_progress",
                            "action_required",
                            1.0,
                            f"'{name}' is past due with {progress}% progress.",
                        )
                    )
                elif progress < 30 and days_left < 7:
                    results.append(
                        self._signal(
                            "goal_progress",
                            "action_required",
                            0.9,
                            f"'{name}' has {progress}% progress with {days_left} days left.",
                        )
                    )
                elif progress < 50 and days_left < 14:
                    results.append(
                        self._signal(
                            "goal_progress",
                            "at_risk",
                            0.8,
                            f"'{name}' has {progress}% progress with {days_left} days left.",
                        )
                    )
                else:
                    results.append(
                        self._signal(
                            "goal_progress",
                            "on_track",
                            0.9,
                            f"'{name}' is progressing at {progress}%.",
                        )
                    )
            else:
                # No deadline: judge by raw progress alone.
                if progress >= 70:
                    decision: DecisionKind = "on_track"
                    conf = 0.9
                    explanation = f"'{name}' is at {progress}% — strong progress."
                elif progress >= 30:
                    decision = "on_track"
                    conf = 0.7
                    explanation = f"'{name}' is at {progress}% — moderate progress."
                else:
                    decision = "at_risk"
                    conf = 0.7
                    explanation = (
                        f"'{name}' has only {progress}% progress with no due date set."
                    )
                results.append(self._signal("goal_progress", decision, conf, explanation))

        return results

    # ------------------------------------------------------------------
    # Task signals (Eisenhower matrix)
    # ------------------------------------------------------------------

    def _task_signals(self, tasks: list[dict[str, Any]]) -> list[SignalDecision]:
        if not tasks:
            return [self._signal("task_urgency", "no_data", 1.0, "No tasks recorded.")]

        q1_pending = [
            t for t in tasks if t.get("quadrant") == "Q1" and not t.get("completed")
        ]
        q2_pending = [
            t for t in tasks if t.get("quadrant") == "Q2" and not t.get("completed")
        ]

        if q1_pending:
            return [
                self._signal(
                    "task_urgency",
                    "action_required",
                    1.0,
                    f"{len(q1_pending)} Q1 task(s) pending (urgent + important).",
                )
            ]
        if q2_pending:
            return [
                self._signal(
                    "task_urgency",
                    "at_risk",
                    0.8,
                    f"{len(q2_pending)} Q2 task(s) pending (important, not urgent).",
                )
            ]
        return [
            self._signal(
                "task_urgency", "on_track", 1.0, "No urgent tasks pending."
            )
        ]

    # ------------------------------------------------------------------
    # Habit signals
    # ------------------------------------------------------------------

    def _habit_signals(
        self, habits: list[dict[str, Any]], ref: date
    ) -> list[SignalDecision]:
        if not habits:
            return [
                self._signal(
                    "habit_consistency", "no_data", 1.0, "No habits recorded."
                )
            ]

        stale: list[str] = []
        for habit in habits:
            check_dates = habit.get("checkDates", [])
            if not check_dates:
                stale.append(habit.get("name", "Habit"))
                continue
            last_check = max(date.fromisoformat(d) for d in check_dates)
            if (ref - last_check).days >= 3:
                stale.append(habit.get("name", "Habit"))

        if stale:
            return [
                self._signal(
                    "habit_consistency",
                    "at_risk",
                    0.85,
                    f"Habits lagging: {', '.join(stale)}.",
                )
            ]
        return [
            self._signal(
                "habit_consistency",
                "on_track",
                0.95,
                "All habits checked within 3 days.",
            )
        ]

    # ------------------------------------------------------------------
    # Workout signals
    # ------------------------------------------------------------------

    def _workout_signals(
        self, workouts: list[dict[str, Any]], ref: date
    ) -> list[SignalDecision]:
        if not workouts:
            return [
                self._signal(
                    "workout_frequency", "no_data", 1.0, "No workout data recorded."
                )
            ]

        recent = [
            w
            for w in workouts
            # Inclusive 7-day window: a workout from exactly 7 days ago is counted.
            if (ref - date.fromisoformat(w.get("date", "1970-01-01"))).days <= 7
        ]

        if len(recent) == 0:
            return [
                self._signal(
                    "workout_frequency",
                    "action_required",
                    0.9,
                    "No workouts in the past 7 days.",
                )
            ]
        if len(recent) < 2:
            return [
                self._signal(
                    "workout_frequency",
                    "at_risk",
                    0.8,
                    f"Only {len(recent)} workout(s) in the past 7 days.",
                )
            ]
        return [
            self._signal(
                "workout_frequency",
                "on_track",
                0.9,
                f"{len(recent)} workout(s) in the past 7 days — good pace.",
            )
        ]

    # ------------------------------------------------------------------
    # Life-wheel signals
    # ------------------------------------------------------------------

    def _lifewheel_signals(
        self, lifewheel: dict[str, Any] | None
    ) -> list[SignalDecision]:
        if not lifewheel:
            return [
                self._signal(
                    "lifewheel_balance",
                    "no_data",
                    1.0,
                    "No life wheel assessment recorded.",
                )
            ]

        scores: dict[str, int] = lifewheel.get("scores", {})
        low_domains = {k: v for k, v in scores.items() if v < 4}

        if low_domains:
            domains_str = ", ".join(f"{k}({v})" for k, v in low_domains.items())
            return [
                self._signal(
                    "lifewheel_balance",
                    "action_required",
                    0.95,
                    f"Low-scoring life domains: {domains_str}.",
                )
            ]

        avg = sum(scores.values()) / len(scores) if scores else 0.0
        if avg < 6:
            return [
                self._signal(
                    "lifewheel_balance",
                    "at_risk",
                    0.8,
                    f"Average life wheel score is {avg:.1f}/10.",
                )
            ]
        return [
            self._signal(
                "lifewheel_balance",
                "on_track",
                0.9,
                f"Life wheel average is {avg:.1f}/10.",
            )
        ]

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------

    @staticmethod
    def _signal(
        signal: str,
        decision: DecisionKind,
        confidence: float,
        explanation: str,
    ) -> SignalDecision:
        return SignalDecision(
            signal=signal,
            decision=decision,
            confidence=confidence,
            explanation=explanation,
        )
