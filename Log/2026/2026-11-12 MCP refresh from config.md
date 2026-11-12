---
type: log
date: 2026-11-12
projects: ["[[pycraftcore]]", "[[Agent runtime]]", "[[Agent toolbox]]", "[[Homelab]]"]
tags: [log]
---

# 2026-11-12 MCP refresh from config

## What we did
- pycraftcore: `McpConnector` got an optional `refresh` block (`interval`, `retry_delay`, `max_retry_delay`, checked by `McpRefresh`) — [[pycraftcore configuration]].
- agent-toolbox and agent-runtime read it per connector (`MCP_REFRESH_INTERVAL`, `MCP_RETRY_DELAY`, `MCP_MAX_RETRY_DELAY` in their YAML), and each MCP server now has its own loop — [[Start order and dependencies]].
- Moved what was in the wrong ring ([[Hexagonal architecture]]):
  - toolbox: `DependencyHealth`, `DependencyState`, `RefreshPolicy` → domain; `CatalogChange`, `ExternalSource`, `ToolLookup` → next to their ports;
  - agent: `ToolPort`, `ToolProviderPort`, `ToolSource` → `application/port/outbound/tool_provider.py`; `RegistryChange`, `RefreshPolicy` → `domain/tool/`; `ToolRegistry`, `ToolCatalogRefresher` → `application/tool/`.

## What I learned
- One loop for several dependencies shares one failure count: one server down made the healthy ones be re-read at its back-off pace.
- A data class that crosses a port belongs to the port; one that only holds plain values can be domain.

## Next
- [ ] Release pycraftcore 5.1.0, then `uv lock --upgrade-package pycraftcore` in both services.
- [ ] Release and deploy agent-toolbox and agent-runtime.
