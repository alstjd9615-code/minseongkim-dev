"""
Data-class schemas shared by the MCP tool layer and the macro-to-signal service.

All types are plain dataclasses so no additional runtime dependencies are required
beyond the Python standard library.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

# Possible outcomes from the deterministic signal computation.
DecisionKind = Literal["action_required", "at_risk", "on_track", "no_data"]


@dataclass
class SignalDecision:
    """One signal emitted by the macro-to-signal service for a specific domain."""

    signal: str
    decision: DecisionKind
    confidence: float  # 0.0–1.0
    explanation: str


@dataclass
class MCPToolResult:
    """Standardised return value from every MCP tool call."""

    tool: str
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    error_code: str | None = None


@dataclass
class MacroInput:
    """Aggregated user data consumed by :class:`MacroSignalService`."""

    goals: list[dict[str, Any]] = field(default_factory=list)
    tasks: list[dict[str, Any]] = field(default_factory=list)
    habits: list[dict[str, Any]] = field(default_factory=list)
    workouts: list[dict[str, Any]] = field(default_factory=list)
    lifewheel: dict[str, Any] | None = None
