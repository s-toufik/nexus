---
type: architecture
project: "[[Agent toolbox]]"
order: 3
tags: [agent-toolbox, architecture, mcp]
updated: 2026-11-08
---

# Agent toolbox republished tools

> At start-up, every connector named `external_mcp_*` is contacted; each remote tool becomes an `McpBackedTool` — the same `Tool` type as the built-in ones — published as `<prefix>_<remote name>` (made valid Python), optionally limited to an allowlist. They then go through `ToolBinder` and the sandbox bridge like any tool.

Previous: [[Agent toolbox sandbox]] · Back: [[Agent toolbox]]

**Do it:** [[Agent toolbox - Add an MCP server]]

## Why republish
The agent gets one MCP endpoint and one tool catalogue; Grafana's, MongoDB's and PostgreSQL's tools become callable from `python_executor` code; and the toolbox's NetworkPolicy stays the only way out ([[Homelab LLM and agent]]).

## The mechanics
| Piece | Does |
|---|---|
| Connector `external_mcp_<name>` (`config/<env>/connector/mcp.yml`) | URL from an env variable, transport (streamable HTTP or SSE), timeout; an empty URL is skipped quietly |
| Operation of the same name (`operation/mcp.yml`) | `prefix`, optional `tools` allowlist (remote names) |
| `McpToolProvider(factory, prefix, allowed)` | Lists remote tools, filters, renames (`list-databases` → `mongodb_list_databases`) |
| `McpBackedTool` | `name` (published) vs `remote_name` (used in `call_tool`); a remote error becomes `ToolFailure` |

## Edge cases
- A server down at start-up is skipped with a warning; its tools appear at the next start → `make restart R=agent-toolbox` on the homelab, then agent-runtime.
- Two servers with the same tool name no longer collide: prefixes make names unique (start-up would otherwise fail on duplicate names).
- Read-only or read-write is decided **where the server runs**, not here ([[Homelab decisions]]).
- Too many tools crowd the model's choices and context: allowlists and Grafana's `categories` keep the catalogue small.

## Check yourself
1. Why does the published name differ from the remote name?
2. What happens to `grafana_*` tools if Grafana's MCP server restarts while the toolbox runs?

## Go further
- [mcp-grafana](https://github.com/grafana/mcp-grafana), [mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server), [postgres-mcp](https://github.com/crystaldba/postgres-mcp).
