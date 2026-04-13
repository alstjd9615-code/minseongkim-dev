"""
Tests for the deterministic macro-to-signal flow.

Each YAML scenario in ``eval/scenarios/signal_decisions.yaml`` is run as an
individual parametrised test case.  The test ID matches the scenario ``id``
field so failures point directly at the broken scenario.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from eval.runner import EvalRunner

SCENARIOS_PATH = Path(__file__).parent.parent / "scenarios" / "signal_decisions.yaml"


def _load_scenarios():
    """Load scenarios once at collection time (no fixture needed)."""
    # EvalRunner.load_scenarios is a static utility; instantiate a bare runner.
    from mcp.registry import ToolRegistry
    from mcp.services import MacroSignalService

    tmp = EvalRunner(ToolRegistry(), MacroSignalService())
    return tmp.load_scenarios(SCENARIOS_PATH)


@pytest.mark.parametrize(
    "scenario",
    _load_scenarios(),
    ids=lambda s: s["id"],
)
def test_signal_decision(runner: EvalRunner, scenario: dict) -> None:
    """
    Assert that the signal service produces the expected decision, confidence,
    and explanation for a given MacroInput fixture.
    """
    result = runner.run_signal_scenario(scenario)
    assert result.passed, result.details
