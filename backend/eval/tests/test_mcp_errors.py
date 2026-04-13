"""
Tests for MCP tool-call error semantics.

Each YAML scenario in ``eval/scenarios/mcp_errors.yaml`` is run as an
individual parametrised test case that calls the tool registry directly and
asserts the resulting :class:`~mcp.schemas.MCPToolResult` shape.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from eval.runner import EvalRunner

SCENARIOS_PATH = Path(__file__).parent.parent / "scenarios" / "mcp_errors.yaml"


def _load_scenarios():
    from mcp.registry import ToolRegistry
    from mcp.services import MacroSignalService

    tmp = EvalRunner(ToolRegistry(), MacroSignalService())
    return tmp.load_scenarios(SCENARIOS_PATH)


@pytest.mark.parametrize(
    "scenario",
    _load_scenarios(),
    ids=lambda s: s["id"],
)
def test_mcp_error_semantics(runner: EvalRunner, scenario: dict) -> None:
    """
    Assert that the MCP registry returns the expected success flag, error code,
    and data keys for a given tool-call fixture.
    """
    result = runner.run_mcp_scenario(scenario)
    assert result.passed, result.details
