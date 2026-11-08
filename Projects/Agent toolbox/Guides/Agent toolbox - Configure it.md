---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Configure it

> The environment variables and configuration files: URL and allowed hosts, working directory, sandbox tool access, other MCP servers, telemetry.

**Where:** on your Mac (`.env`, `config/`), or the deployment's values · **All guides:** [[Agent toolbox guides]]

| Variable | Meaning |
|---|---|
| `APP_ENV` | Which `config/<APP_ENV>/` folder is read (`debug` by default) |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`, in upper case; read by `root.yml` (`log`), `INFO` when unset |
| `CONFIGURATION_DIR` | Where `config/` is (`./config` by default) |
| `DEPLOYMENT_ENVIRONMENT` | Label shown by `/actuator/info` and on telemetry |
| `TOOLBOX_URL` | The URL clients use, e.g. `http://<host>:<port>/mcp`. Sets the MCP path and the allowed host; the listening address comes from Granian (`--host`/`--port`, or `GRANIAN_HOST`/`GRANIAN_PORT` in Docker) |
| `TOOLBOX_EXTRA_ALLOWED_HOSTS` | Other `host:port` values clients may use, comma-separated |
| `WORKING_DIRECTORY` | The folder file tools and the sandbox are confined to; unset = no working directory |
| `SANDBOX_TOOL_ACCESS` | `true` to make the tools callable from `python_executor` code |
| `GRAFANA_MCP_URL`, `MONGODB_MCP_URL`, `POSTGRES_MCP_URL` | Other MCP servers whose tools are republished (see [[Agent toolbox - Add an MCP server]]); empty = skipped |
| `OTEL_HOST`, `OTEL_PORT` | OpenTelemetry collector (gRPC); an empty host turns telemetry off |

Tools that reach a backend add their own settings, read through a connector in `config/<APP_ENV>/connector/`. Today the SQL tool reads its SQLite database from `USER_DB_HOST` (folder) and `USER_DB_NAME` (file). `.env.example` is the reference for the full list.

Configuration files are in `config/`: `root.yml` sets the log level and lists what exists, and `config/<APP_ENV>/connector/` defines the MCP server itself, telemetry, and each backend a tool uses. `root.yml` keeps `server: {}`: the MCP endpoint is not one of the web servers `server/*.yml` describes.

## Why it works
- [[pycraftcore configuration]] · [[Agent toolbox sandbox]]
