---
type: decisions
project: "[[Agent toolbox]]"
tags: [agent-toolbox, decisions]
updated: 2026-11-15
---

# Agent toolbox decisions

Newest first.

## 2026-11-15 — Tools served by scope, one endpoint each
- **Decision:** a scope is an `mcp` operation on the `self` connector (`config/debug/operation/scope.yml`): a name and shell-style patterns of tool names. Each scope gets its own MCP server at `/mcp/<scope>` (`all` stays at `/mcp`), its own publisher filtering catalog changes by scope, and its own `python_executor` built over the scope's view, so its description and its sandbox bridge cover only that scope's tools.
- **Why:** each agent should discover only the tools meant for it ([[Agent runtime agents]]); an endpoint per scope enforces it on the toolbox's side: a tool outside the scope can't be listed or called there, even by a model that invents its name.
- **Alternatives:** scopes as tags in `_meta`, filtered by each client (the toolbox would still serve every tool to anyone); one toolbox per scope (eight deployments for one catalog).
- **Consequences:** a new tool must be added to the patterns of the scopes that should offer it; tools from other MCP servers join or leave the matching scopes live. One Starlette app runs every scope's session manager; only the main server boots the toolbox.

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
