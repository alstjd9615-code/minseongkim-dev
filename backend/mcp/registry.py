"""
MCP tool registry.

Tools are callables registered by name.  The registry dispatches ``call()``
requests and normalises any error into a :class:`~mcp.schemas.MCPToolResult`
so callers never have to handle raw exceptions.

Error codes emitted by :meth:`ToolRegistry.call`:
  - ``TOOL_NOT_FOUND``  – the requested tool name is not registered.
  - ``INVALID_ARGS``    – the handler raised :class:`TypeError` (wrong arity / type).
  - ``TOOL_ERROR``      – any other unhandled exception inside the handler.
"""

from __future__ import annotations

from typing import Any, Callable

from mcp.schemas import MCPToolResult


class ToolRegistry:
    """Lightweight registry that maps tool names to handler callables."""

    def __init__(self) -> None:
        self._tools: dict[str, Callable[..., MCPToolResult]] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, name: str, handler: Callable[..., MCPToolResult]) -> None:
        """Register *handler* under *name*, overwriting any existing entry."""
        self._tools[name] = handler

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------

    def get(self, name: str) -> Callable[..., MCPToolResult] | None:
        """Return the handler for *name*, or ``None`` if not registered."""
        return self._tools.get(name)

    def list_tools(self) -> list[str]:
        """Return sorted list of all registered tool names."""
        return sorted(self._tools.keys())

    # ------------------------------------------------------------------
    # Dispatch
    # ------------------------------------------------------------------

    def call(self, name: str, args: dict[str, Any]) -> MCPToolResult:
        """
        Dispatch a tool call by name.

        Returns a :class:`~mcp.schemas.MCPToolResult` in all cases –
        errors are encoded in the result rather than raised.
        """
        handler = self._tools.get(name)
        if handler is None:
            return MCPToolResult(
                tool=name,
                success=False,
                error=f"Tool '{name}' is not registered.",
                error_code="TOOL_NOT_FOUND",
            )
        try:
            return handler(**args)
        except TypeError as exc:
            return MCPToolResult(
                tool=name,
                success=False,
                error=str(exc),
                error_code="INVALID_ARGS",
            )
        except Exception as exc:  # noqa: BLE001
            return MCPToolResult(
                tool=name,
                success=False,
                error=str(exc),
                error_code="TOOL_ERROR",
            )


# Shared registry instance used by default.
# Tests can create isolated ``ToolRegistry()`` instances to avoid pollution.
default_registry: ToolRegistry = ToolRegistry()
