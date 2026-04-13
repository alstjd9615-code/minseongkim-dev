# Eval Baseline – Scenario-Driven Regression Checks

This document explains the evaluation (eval) baseline for the deterministic
macro-to-signal flow and MCP tools.  The eval layer provides a fast, fixture-
driven way to detect regressions in decision behaviour and error semantics
**without** requiring AWS credentials, a database, or network access.

---

## Directory layout

```
backend/
├── mcp/
│   ├── schemas.py      # Shared dataclasses: SignalDecision, MCPToolResult, MacroInput
│   ├── registry.py     # ToolRegistry – dispatches named tool calls
│   ├── tools.py        # MCP tool implementations + default_registry registration
│   └── services.py     # MacroSignalService – deterministic macro→signal flow
├── eval/
│   ├── runner.py                        # EvalRunner + ScenarioResult
│   ├── scenarios/
│   │   ├── signal_decisions.yaml        # Signal-flow fixture scenarios
│   │   └── mcp_errors.yaml             # MCP error-semantics fixture scenarios
│   └── tests/
│       ├── conftest.py                  # Session-scoped registry / service / runner fixtures
│       ├── test_signal_decisions.py     # Parametrised signal tests
│       └── test_mcp_errors.py          # Parametrised MCP tool tests
├── docs/
│   └── eval_baseline.md                # ← you are here
├── pyproject.toml                       # pytest configuration
└── requirements-dev.txt                 # pytest, pyyaml
```

---

## Quick start

```bash
# From the backend/ directory
pip install -r requirements-dev.txt
pytest
```

All 45 scenarios should pass in under a second.

---

## Core concepts

### MacroInput

`MacroInput` is the aggregated snapshot of a user's current data fed into the
signal service:

| Field        | Type                   | Description                           |
|--------------|------------------------|---------------------------------------|
| `goals`      | `list[dict]`           | Goals from the GoalsTable             |
| `tasks`      | `list[dict]`           | Tasks (Eisenhower matrix)             |
| `habits`     | `list[dict]`           | Habits with `checkDates`              |
| `workouts`   | `list[dict]`           | Workouts with `date` field            |
| `lifewheel`  | `dict \| None`         | Life-wheel assessment with `scores`   |

### SignalDecision

Each signal produced by `MacroSignalService.compute_signals()` has:

| Field         | Type           | Values                                                   |
|---------------|----------------|----------------------------------------------------------|
| `signal`      | `str`          | `goal_progress`, `task_urgency`, `habit_consistency`, `workout_frequency`, `lifewheel_balance` |
| `decision`    | `DecisionKind` | `action_required` \| `at_risk` \| `on_track` \| `no_data` |
| `confidence`  | `float`        | 0.0–1.0                                                  |
| `explanation` | `str`          | Human-readable reason for the decision                   |

### MCPToolResult

Every MCP tool call returns:

| Field        | Type           | Description                                |
|--------------|----------------|--------------------------------------------|
| `tool`       | `str`          | Name of the tool that was called           |
| `success`    | `bool`         | `True` if the call succeeded               |
| `data`       | `dict \| None` | Structured output on success               |
| `error`      | `str \| None`  | Human-readable error message on failure    |
| `error_code` | `str \| None`  | Machine-readable error code on failure     |

Error codes emitted by `ToolRegistry.call()`:

| Code             | Trigger                                              |
|------------------|------------------------------------------------------|
| `TOOL_NOT_FOUND` | Tool name not registered in the registry             |
| `INVALID_ARGS`   | Handler raised `TypeError` (wrong arity / kwargs)    |
| `TOOL_ERROR`     | Any other unhandled exception inside the handler     |
| `NO_DATA`        | Tool-level sentinel for missing optional input       |

---

## Signal decision rules

### `goal_progress`

| Condition                                        | Decision           |
|--------------------------------------------------|--------------------|
| No goals                                         | `no_data`          |
| No active goals                                  | `on_track`         |
| Past due date                                    | `action_required`  |
| < 30% progress AND < 7 days until due            | `action_required`  |
| < 50% progress AND < 14 days until due           | `at_risk`          |
| No due date AND progress < 30%                   | `at_risk`          |
| Otherwise                                        | `on_track`         |

### `task_urgency`

| Condition                          | Decision          |
|------------------------------------|-------------------|
| No tasks                           | `no_data`         |
| Any pending Q1 task (urgent + important) | `action_required` |
| Any pending Q2 task (important, not urgent) | `at_risk`    |
| All Q1/Q2 tasks completed          | `on_track`        |

### `habit_consistency`

| Condition                          | Decision   |
|------------------------------------|------------|
| No habits                          | `no_data`  |
| Any habit unchecked for ≥ 3 days   | `at_risk`  |
| All habits checked within 3 days   | `on_track` |

### `workout_frequency`

| Condition                          | Decision          |
|------------------------------------|-------------------|
| No workout records                 | `no_data`         |
| 0 workouts in last 7 days          | `action_required` |
| 1 workout in last 7 days           | `at_risk`         |
| ≥ 2 workouts in last 7 days        | `on_track`        |

### `lifewheel_balance`

| Condition                          | Decision          |
|------------------------------------|-------------------|
| No life-wheel data                 | `no_data`         |
| Any domain score < 4               | `action_required` |
| Average score < 6                  | `at_risk`         |
| Average score ≥ 6                  | `on_track`        |

---

## Adding a new signal scenario

1. Open `eval/scenarios/signal_decisions.yaml`.
2. Append a new entry following the schema below:

```yaml
- id: my_new_scenario          # unique, snake_case identifier
  description: >
    Human-readable description of what is being tested.
  input:
    goals:                     # any MacroInput fields; omit or leave empty if unused
      - id: g1
        title: "Example goal"
        status: "진행중"
        progress: 25
        dueDate: "2025-01-20"  # relative to reference_date 2025-01-15
    tasks: []
    habits: []
    workouts: []
    lifewheel: null
  expected_signals:
    - signal: goal_progress    # signal domain to check
      decision: action_required
      confidence_min: 0.8      # optional: minimum confidence threshold
      explanation_contains: "25%"  # optional: substring check on explanation
```

3. Run `pytest` – the new scenario is automatically picked up by
   `test_signal_decisions.py` via `@pytest.mark.parametrize`.

> **Reference date**: all absolute `dueDate` and `checkDates` values in
> scenarios are interpreted relative to `2025-01-15`.  The `EvalRunner` passes
> this fixed date to `MacroSignalService.compute_signals()` so results are
> always deterministic.

---

## Adding a new MCP error scenario

1. Open `eval/scenarios/mcp_errors.yaml`.
2. Append a new entry:

```yaml
- id: my_tool_scenario
  description: What this scenario verifies.
  tool_call:
    tool: "get_goal_status"    # registered tool name
    args:
      goals: []                # keyword arguments passed to the handler
  expected_result:
    success: true              # optional
    error_code: "NO_DATA"      # optional; omit for success paths
    data_keys:                 # optional; keys that must be present in result.data
      - total
      - active
```

3. Run `pytest` – the new scenario is automatically included in
   `test_mcp_errors.py`.

---

## Registering a new MCP tool

1. Add the implementation function to `mcp/tools.py`:

```python
def get_my_new_tool(items: list[dict]) -> MCPToolResult:
    # pure logic, no I/O
    return MCPToolResult(tool="get_my_new_tool", success=True, data={"count": len(items)})
```

2. Register it at the bottom of `mcp/tools.py`:

```python
default_registry.register("get_my_new_tool", lambda items: get_my_new_tool(items))
```

3. Write scenarios in `eval/scenarios/mcp_errors.yaml` to cover success and
   error paths.
4. Run `pytest` to verify.

---

## Running a subset of scenarios

```bash
# Run only signal-decision tests
pytest eval/tests/test_signal_decisions.py -v

# Run only MCP error tests
pytest eval/tests/test_mcp_errors.py -v

# Run a specific scenario by ID
pytest -k "goal_action_required_overdue"
```

---

## Detecting regressions

Any change to the decision rules in `mcp/services.py` or to the error handling
in `mcp/registry.py` that alters existing fixture expectations will cause one
or more parametrised tests to fail with a clear message:

```
FAILED eval/tests/test_signal_decisions.py::test_signal_decision[goal_action_required_overdue]
  AssertionError: Signal 'goal_progress': expected decision 'action_required', got 'at_risk'.
  Explanation: 'Finish report' has 40% progress with -5 days left.
```

This makes it easy to see *which* scenario broke, *what* changed, and *why*.
