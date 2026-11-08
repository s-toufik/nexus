---
type: project
status: active
started: 2026-09
repos: [agent-toolbox]
tags: [project, agent-toolbox, ai, mcp]
updated: 2026-11-08
---

# Agent toolbox

> An MCP server that gives an agent hands: tools to query data, read and write files, and run Python for analysis in a sandbox where every other tool is callable as a plain function. It also republishes the tools of other MCP servers (Grafana, MongoDB, PostgreSQL) as its own.

## In one picture
![[Agent toolbox.canvas]]

## Why it exists
- **Tools are separate from the brain.** [[Agent runtime]] decides; the toolbox acts. Any MCP client can use it, and tools change without touching the agent (it discovers them at start).
- **Code instead of many tool calls.** With `python_executor` and tool access inside the sandbox, the model writes one small program (query, pandas, write a file) instead of ten round trips.
- **Safety in one place.** The sandbox, the working directory, read-only SQL and the homelab's NetworkPolicy fence all live around the toolbox ([[Homelab LLM and agent]]).

## The tools
| Tool | Does |
|---|---|
| `users_tables` | Read-only SQL on the service database; writes and schema changes refused before the database |
| `file_reader`, `file_writer` | Files in the working directory (yml, yaml, json, csv parsed; md, txt as text) |
| `python_executor` | Runs Python in a sandbox; returns `result` and what it printed; on failure, the traceback of its own lines |
| `grafana_*`, `mongodb_*`, `postgres_*` | Republished from Grafana's, MongoDB's and PostgreSQL's MCP servers |

Endpoints: `/mcp` (streamable HTTP), `/actuator/health`, `/health/liveness`, `/health/readiness` (503 until tools are registered), `/actuator/info`.

## Read it in this order
1. [[Agent toolbox layers]] — one use case, two doors (MCP and the sandbox).
2. [[Agent toolbox sandbox]] — how untrusted Python runs and calls tools back.
3. [[Agent toolbox republished tools]] — other MCP servers' tools, prefixed and allow-listed.

Then [[Agent toolbox decisions]] and [[Agent toolbox guides]].

## Knowledge it uses
[[Model Context Protocol]] · [[AI agents and sandboxing]] · [[Hexagonal architecture]] · [[Dependency injection]] · [[Architecture tests]] · [[Data validation with pydantic and msgspec]] · [[ASGI]] · [[asyncio]] · [[NetworkPolicy]] · [[pycraftcore]]

## Where it stands (2026-11-08)
- **Released:** v1.1.0 with external MCP tools; the homelab rolls out grafana-mcp, mongodb-mcp, postgres-mcp.
