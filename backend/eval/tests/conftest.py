"""
Shared pytest fixtures for the eval test suite.

Fixtures are session-scoped so the registry and service are initialised only
once per test run.  A fixed ``REFERENCE_DATE`` is used throughout to keep
scenario outcomes deterministic regardless of when the suite is executed.
"""

from __future__ import annotations

import pytest

# Importing mcp.tools is a side effect that registers all tools in default_registry.
import mcp.tools  # noqa: F401

from eval.runner import EvalRunner
from mcp.registry import default_registry
from mcp.services import MacroSignalService

REFERENCE_DATE = "2025-01-15"


@pytest.fixture(scope="session")
def registry():
    """Shared tool registry with all MCP tools registered."""
    return default_registry


@pytest.fixture(scope="session")
def service():
    """Shared MacroSignalService instance."""
    return MacroSignalService()


@pytest.fixture(scope="session")
def runner(registry, service):
    """EvalRunner wired with the shared registry, service, and reference date."""
    return EvalRunner(
        registry=registry,
        service=service,
        reference_date=REFERENCE_DATE,
    )
