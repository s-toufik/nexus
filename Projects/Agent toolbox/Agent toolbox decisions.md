---
type: decisions
project: "[[Agent toolbox]]"
tags: [agent-toolbox, decisions]
updated: 2026-11-08
---

# Agent toolbox decisions

Newest first.

## 2026-11-08 — Republish other MCP servers, prefixed and allow-listed
- **Context:** the agent should use Grafana, MongoDB and PostgreSQL, also from Python code.
- **Decision:** `external_mcp_*` connectors; tools wrapped as `McpBackedTool`, published `<prefix>_<name>`, with an optional allowlist. Prometheus' MCP server left out: Grafana's covers PromQL.
- **Why:** one catalogue, one network exit, sandbox access for free.
- **Alternatives:** the agent connects to each server itself (no sandbox access, more network paths); write our own Grafana/Mongo/Postgres tools (duplicate work).

## Tools callable from the sandbox
- **Decision:** `SandboxToolBridge` routes sandboxed calls through the same `InvokeToolUseCase`; a contract test checks parity.
- **Why:** one validation and logging path; the model can compose tools in code.
- **Consequences:** a sandbox escape would reach only what tools reach — hence read-only accounts and the NetworkPolicy fence.

## Tools independent of MCP
- **Decision:** `Tool[Input, Output]` with pydantic models; MCP is an inbound adapter.
- **Why:** tools are testable alone; another transport would be another adapter.

## Read-only SQL checked before the database
- **Decision:** `users_tables` parses and transpiles the statement (pycraftcore `query_language`, sqlglot) and refuses anything that writes or changes the schema.
- **Why:** defence in depth with a read-only database account.

## Allowed hosts
- **Decision:** only the host in `TOOLBOX_URL` (+ `TOOLBOX_EXTRA_ALLOWED_HOSTS`) is accepted.
- **Why:** DNS-rebinding protection: a web page can't make your browser call a local MCP server.
