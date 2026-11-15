---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-15
---

# Agent toolbox - Add or change a scope

> Choose which tools an agent sees: a scope is an MCP endpoint, `/mcp/<scope>`, holding the tools whose names match its patterns, plus its own `python_executor`.

**Where:** on your Mac, in `agent-toolbox` · **All guides:** [[Agent toolbox guides]]

## 1. The scope
1. In `config/debug/operation/scope.yml`, add (or edit) an operation:
   ```yaml
   scope_<name>:
     name: <name>
     type: mcp
     connector: ${connector.self}
     parameters:
       tools: [grafana_*, users_tables]
   ```
   `tools` are shell-style patterns of tool names; an empty list leaves only `python_executor`. `all` is built in.
2. List it under `operation:` in `config/root.yml`: `scope_<name>: ${operation.scope_<name>}`.
3. Check: `make test` — raw: `uv run pytest -q`.

## 2. Try it
1. `make run` — raw: `uv run granian --interface asgi --factory --port 8001 bootstrap.application.toolbox_application:create_toolbox_application`
2. Check the boot log: `Tools of scope '<name>' at /mcp/<name>: python_executor, …`.
3. Check: an MCP client on `http://localhost:8001/mcp/<name>` lists only those tools ([[Agent toolbox - Connect a client]]).

## 3. Give it to an agent
1. In agent-runtime, `tool_scope: <name>` in `agents/<agent>/agent.yml` ([[Agent runtime - Add an agent]]).
2. Release both, then on the homelab: [[Homelab - Run the LLM and agent]], *Add or change a tool scope*.

## Why it works
- [[Agent toolbox decisions]] — tools served by scope, one endpoint each.
- [[Agent toolbox sandbox]] — the bridge that lets `python_executor` call its scope's tools.
