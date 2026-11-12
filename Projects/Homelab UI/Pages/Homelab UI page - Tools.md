---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Tools

> **Route** `/tools` · **for** everyone · **reads** agent-toolbox over MCP (`/api/toolbox/mcp`) · **code** `src/app/features/mcp-inspector/`
> Every tool the agent can call — the toolbox's own and those it republishes from Grafana's, MongoDB's and PostgreSQL's MCP servers — and a form to run any of them by hand.

![[Homelab UI - Tools.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Count | `55 tools the agent can use`: `file_reader`, `file_writer`, `python_executor`, `users_tables`, plus `grafana_*`, `mongodb_*`, `postgres_*`. |
| 2 | Filter | Type `postgres_` or `loki` to narrow the list. |
| 3 | Tool | Its name and description. **The description is what the model reads** to decide when and how to call it. |
| 4 | Selected tool | Name, full description, return type. |
| 5 | Run tool | Calls it with the form's arguments (this one takes none). |
| 6 | Result status | `ok`, the time it took (0.08 s), **Raw** to see the MCP response as is. |
| 7 | Result | What the tool returned — exactly what the agent would get. |
| 8 | Reconnect | Starts a new MCP session (after the toolbox restarted, or to refresh the list). |

## Use it to
- **Debug the agent:** run the tool it called with the same arguments. Same result → the tool is fine, look at the model. Different → look at the tool.
- Learn what the agent can see: `postgres_list_schemas` returned `information_schema`, `pg_catalog`, `pg_toast`, `public` and `tasker`.
- Check a new tool after a toolbox release ([[Agent toolbox - Add a tool]]).

## How it works
The page is a small [[Model Context Protocol|MCP]] client: `initialize` → `tools/list` → `tools/call` over Streamable HTTP to the toolbox ([[Agent toolbox]]). The republished tools are proxies: `postgres_list_schemas` → the toolbox → `postgres-mcp` → PostgreSQL with the read-only `mcp` role ([[Agent toolbox republished tools]]).

## What the real homelab showed (2026-11-11)
The agent's three-sentence answer used **15.5 k input tokens** ([[Homelab UI page - Agent]]). Part of what goes into a model call is the tool catalogue; 55 descriptions are many tokens. More tools make every call costlier and the choice harder. That's what the toolbox's per-server `tools` allowlist is for (`config/<env>/operation/mcp.yml`); today it's empty for all three servers, which means *every* tool.

## Try it
1. 👀 `postgres_list_schemas` → Run → five schemas.
2. 👀 `file_reader` with `file_path` = a file the agent wrote → its content; with `../etc/passwd` → refused: paths stay in the working directory ([[Agent toolbox sandbox]]).

> [!question]- Check: a tool works here but the agent says it failed. Name two causes outside the tool.
> The model filled the arguments differently (wrong name, wrong type — compare in the agent's trace or logs); or the tool is less than a minute old and the agent hasn't re-read the toolbox yet (it does every 60 s, and at once when a model asks for a tool it doesn't know).

Back to [[Homelab UI pages]].
