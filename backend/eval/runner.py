"""
Lightweight scenario runner for the eval baseline.

Two kinds of scenarios are supported:

1. **Signal scenarios** – exercise :class:`~mcp.services.MacroSignalService`
   with ``MacroInput`` fixtures and assert :class:`~mcp.schemas.SignalDecision`
   outputs.

2. **MCP scenarios** – call named tools through :class:`~mcp.registry.ToolRegistry`
   and assert :class:`~mcp.schemas.MCPToolResult` error semantics.

All assertions return a :class:`ScenarioResult` so test failures can report
precise, human-readable detail messages.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from mcp.registry import ToolRegistry
from mcp.schemas import MacroInput
from mcp.services import MacroSignalService


@dataclass
class ScenarioResult:
    """Outcome of a single scenario run."""

    scenario_id: str
    passed: bool
    details: str = ""

    def __str__(self) -> str:
        status = "PASS" if self.passed else "FAIL"
        return (
            f"[{status}] {self.scenario_id}"
            + (f" — {self.details}" if self.details else "")
        )


class EvalRunner:
    """
    Runs eval scenarios against the MCP registry and signal service.

    Parameters
    ----------
    registry:
        :class:`~mcp.registry.ToolRegistry` instance with tools registered.
    service:
        :class:`~mcp.services.MacroSignalService` instance.
    reference_date:
        ISO-8601 date string used as "today" for all deterministic evaluations.
        Defaults to ``"2025-01-15"``.
    """

    def __init__(
        self,
        registry: ToolRegistry,
        service: MacroSignalService,
        reference_date: str = "2025-01-15",
    ) -> None:
        self._registry = registry
        self._service = service
        self.reference_date = reference_date

    # ------------------------------------------------------------------
    # Scenario loading
    # ------------------------------------------------------------------

    def load_scenarios(self, path: str | Path) -> list[dict[str, Any]]:
        """Load and return a list of scenario dicts from a YAML file."""
        with open(path, encoding="utf-8") as fh:
            return yaml.safe_load(fh) or []

    # ------------------------------------------------------------------
    # Signal scenario runner
    # ------------------------------------------------------------------

    def run_signal_scenario(self, scenario: dict[str, Any]) -> ScenarioResult:
        """
        Execute one signal scenario.

        The scenario dict must have:
        - ``id``                – unique string identifier
        - ``input``             – keys matching :class:`~mcp.schemas.MacroInput` fields
        - ``expected_signals``  – list of signal assertion dicts

        Each assertion dict supports:
        - ``signal``                 – signal name to look up (required)
        - ``decision``               – expected :data:`~mcp.schemas.DecisionKind` (required)
        - ``confidence_min``         – minimum acceptable confidence (optional)
        - ``explanation_contains``   – substring expected in explanation (optional)
        """
        scenario_id: str = scenario.get("id", "<unknown>")
        macro_data = scenario.get("input", {})
        macro = MacroInput(
            goals=macro_data.get("goals", []),
            tasks=macro_data.get("tasks", []),
            habits=macro_data.get("habits", []),
            workouts=macro_data.get("workouts", []),
            lifewheel=macro_data.get("lifewheel"),
        )
        signals = self._service.compute_signals(macro, self.reference_date)
        signals_by_name = {s.signal: s for s in signals}

        for exp in scenario.get("expected_signals", []):
            sig_name: str = exp["signal"]
            if sig_name not in signals_by_name:
                return ScenarioResult(
                    scenario_id,
                    False,
                    f"Expected signal '{sig_name}' not present in output "
                    f"(got: {list(signals_by_name)}).",
                )
            sig = signals_by_name[sig_name]

            if sig.decision != exp["decision"]:
                return ScenarioResult(
                    scenario_id,
                    False,
                    f"Signal '{sig_name}': expected decision '{exp['decision']}', "
                    f"got '{sig.decision}'. Explanation: {sig.explanation}",
                )
            if "confidence_min" in exp and sig.confidence < exp["confidence_min"]:
                return ScenarioResult(
                    scenario_id,
                    False,
                    f"Signal '{sig_name}': confidence {sig.confidence:.2f} < "
                    f"minimum {exp['confidence_min']:.2f}.",
                )
            if "explanation_contains" in exp:
                needle: str = exp["explanation_contains"]
                if needle not in sig.explanation:
                    return ScenarioResult(
                        scenario_id,
                        False,
                        f"Signal '{sig_name}': explanation does not contain '{needle}'. "
                        f"Got: {sig.explanation!r}",
                    )

        return ScenarioResult(scenario_id, True)

    # ------------------------------------------------------------------
    # MCP error-semantics scenario runner
    # ------------------------------------------------------------------

    def run_mcp_scenario(self, scenario: dict[str, Any]) -> ScenarioResult:
        """
        Execute one MCP tool-call scenario.

        The scenario dict must have:
        - ``id``               – unique string identifier
        - ``tool_call``        – ``{tool: str, args: dict}``
        - ``expected_result``  – assertion dict

        The assertion dict supports:
        - ``success``    – expected boolean (optional)
        - ``error_code`` – expected error code string (optional)
        - ``data_keys``  – list of keys that must be present in ``result.data`` (optional)
        """
        scenario_id: str = scenario.get("id", "<unknown>")
        tool_call = scenario.get("tool_call", {})
        result = self._registry.call(
            tool_call.get("tool", ""),
            tool_call.get("args") or {},
        )
        expected = scenario.get("expected_result", {})

        if "success" in expected and result.success != expected["success"]:
            return ScenarioResult(
                scenario_id,
                False,
                f"Expected success={expected['success']}, got {result.success}. "
                f"error_code={result.error_code!r}, error={result.error!r}",
            )
        if "error_code" in expected and result.error_code != expected["error_code"]:
            return ScenarioResult(
                scenario_id,
                False,
                f"Expected error_code='{expected['error_code']}', "
                f"got '{result.error_code}'.",
            )
        if "data_keys" in expected:
            for key in expected["data_keys"]:
                if not result.data or key not in result.data:
                    return ScenarioResult(
                        scenario_id,
                        False,
                        f"Expected data key '{key}' not found in result.data "
                        f"(got: {list(result.data or {})}).",
                    )

        return ScenarioResult(scenario_id, True)
