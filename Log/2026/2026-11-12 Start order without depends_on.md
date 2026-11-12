---
type: log
date: 2026-11-12
projects: ["[[Agent toolbox]]", "[[Agent runtime]]", "[[Homelab]]"]
tags: [log, kubernetes]
---

# 2026-11-12 Start order without depends_on

## What we did
- **The question:** Kubernetes has no `depends_on`; how should the toolbox, its MCP servers and the agent handle start order? Answer: each reconciles its own dependencies → [[Start order and dependencies]].
- **agent-toolbox:**
  - one live `ToolCatalog` replaces the three frozen copies of the tool list (the use case, the sandbox bridge, `python_executor`'s description);
  - `ReconcileExternalTools` re-lists each MCP server after 5 s, 10, 20, 40, then every 60 s, and `McpToolPublisher` adds or removes the tools on the running server;
  - `/actuator/health` lists each server; readiness stays about the toolbox itself;
  - a call to a server that is down says so plainly.
- **agent-runtime:** `ToolRegistry.replace` and `ToolCatalogRefresher`, the same loop for the toolbox; an unknown tool wakes it at once.
- **Bug found by the end-to-end test:** with the toolbox unreachable, the MCP client's task group cancelled the agent's own boot task (`CancelledError` isn't an `Exception`), so the agent crashed instead of starting without tools. Fixed in `StreamableHttpSessionFactory`.
- Docs: the "restart the agent / the toolbox" steps are gone from both READMEs, homelab-infra's DevOps guide and Q&A (new: *What if a service starts before the one it needs?*), and the notes here.
- Tests: agent-toolbox 154 (19 new), agent-runtime 446 (13 new, among them "a toolbox that starts after the agent gives it its tools without a restart").

## What I learned
- The MCP Python SDK's `add_tool` / `remove_tool` work on a running server, and `tools/list` reads the live list.
- `tools/list_changed` can't reach a client that opens a new session per call; polling two small servers once a minute is simpler.
- With the retry delay ceiling equal to the refresh interval, deciding the next delay from the *previous delay* resets the back-off; count failures instead.

## Next
- [ ] Release agent-toolbox and agent-runtime, bump them in homelab-infra's `versions.yaml`, deploy.
- [ ] Try it: `make restart R=grafana-mcp` while watching `make logs R=agent-toolbox` → `unavailable`, then `is back`.
- [ ] Show the toolbox's dependencies on homelab-ui's Status page.
