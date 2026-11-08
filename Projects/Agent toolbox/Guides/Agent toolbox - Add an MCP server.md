---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Add an MCP server

> Republish another MCP server's tools under a prefix, or keep only some of them.

**Where:** on your Mac, in `agent-toolbox` (and homelab-infra for the server itself) · **All guides:** [[Agent toolbox guides]]

The toolbox also republishes the tools of other MCP servers, as its own: listed in `tools/list`, called the same way, and available as functions in `python_executor` code. Each server's tools carry its prefix, and names are made valid Python (`list-databases` → `mongodb_list_databases`):

| Server | Prefix | URL variable | Transport |
|---|---|---|---|
| [Grafana MCP](https://github.com/grafana/mcp-grafana) | `grafana_` | `GRAFANA_MCP_URL` | streamable HTTP |
| [MongoDB MCP Server](https://github.com/mongodb-js/mongodb-mcp-server) | `mongodb_` | `MONGODB_MCP_URL` | streamable HTTP |
| [postgres-mcp](https://github.com/crystaldba/postgres-mcp) | `postgres_` | `POSTGRES_MCP_URL` | SSE |

```python
databases = mongodb_list_databases()
rows = postgres_execute_sql(sql="SELECT schemaname, COUNT(*) FROM pg_tables GROUP BY 1")
result = {"databases": databases["result"], "tables": rows["result"]}
```

- A server whose URL is empty is skipped; one that doesn't answer at start-up is skipped with a warning, and its tools appear at the next start.
- What each server may do (read-only or read-write, which tools) is decided where it runs; the toolbox republishes what it offers.
- To keep only some of a server's tools, list their remote names under its operation's `tools` in `config/<APP_ENV>/operation/mcp.yml`.

**Add another server:** a connector named `external_mcp_<name>` in `config/<APP_ENV>/connector/mcp.yml` (its URL from an environment variable, `''` by default), an operation of the same name with its `prefix` in `config/<APP_ENV>/operation/mcp.yml`, both listed in `config/root.yml`, and the variable in `.env.example` and `devops/helm/values.yml`.

On the homelab, the servers themselves: [[Homelab - Run the LLM and agent#Give the toolbox Grafana, MongoDB and PostgreSQL (their MCP servers, first time)]].

## Why it works
- [[Agent toolbox republished tools]] · [[Model Context Protocol]]
