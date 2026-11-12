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
- Each server's tools are re-listed every 60 s (`refresh` in `connector/mcp.yml`). A server down at start-up is retried after 5 s, then 10, 20, 40 and every 60 s, and its tools join when it answers; no restart needed ([[Start order and dependencies]]).
- Two servers with the same tool name no longer collide: prefixes make names unique (start-up would otherwise fail on duplicate names).
- Read-only or read-write is decided **where the server runs**, not here ([[Homelab decisions]]).
- Too many tools crowd the model's choices and context: allowlists and Grafana's `categories` keep the catalogue small.

## Check yourself
1. Why does the published name differ from the remote name?
> [!success]- Answer
> Remote names may not be valid Python (`list-databases`), and two servers can use the same name. `<prefix>_<remote name>`, cleaned up, gives a name the sandbox can call as a function and that's unique in the catalogue; `remote_name` is kept to call the server.
2. What happens to `grafana_*` tools if Grafana's MCP server restarts while the toolbox runs?
> [!success]- Answer
> They stay listed. While it's down, a call fails with a clear message (a `ToolFailure`); once it's back, calls work again. The 60-second re-listing picks up any tool it added or removed, with no restart of the toolbox.

## Go further
- [mcp-grafana](https://github.com/grafana/mcp-grafana), [mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server), [postgres-mcp](https://github.com/crystaldba/postgres-mcp).
