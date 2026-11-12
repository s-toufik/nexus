---
type: architecture
project: "[[pycraftcore]]"
order: 2
tags: [pycraftcore, architecture, configuration]
updated: 2026-11-12
---

# pycraftcore configuration

> A service's configuration is a folder of YAML: **connectors** (where things are), **operations** (what you do with them, each pointing at a connector), **servers** (how the service itself is served), and `root.yml` listing what's in use. Values come from environment variables (`${oc.env:NAME,default}`); the loader validates everything into typed objects.

Previous: [[pycraftcore modules]] · Next: [[pycraftcore web toolkits]]

**Do it:** [[pycraftcore - Configure a service]]

## The three kinds
| Kind | Example | Read with |
|---|---|---|
| connector | an API `weather` (base URL, timeout, retry, auth), a database, an MCP server, telemetry | `config.connector.api("weather")`, `.database()`, `.mcp()`, `.file()`, `.telemetry()` |
| operation | `forecast`: GET `/forecast` on connector `weather`, `parameters: {days: 3}` | `config.operation.api("forecast")` |
| server | `weather-api`: `base_path`, `docs`, `cors_origins`, your `parameters` | `config.server.asgi("weather-api")` |

`root.yml` picks the environment (`config/<APP_ENV>/`), the log level, and which entries exist. A connector is reused by many operations through OmegaConf interpolation (`connector: ${connector.weather}`).

## Why this design
- **12-factor config** ([[The Twelve-Factor App]]): the same files everywhere, values from the environment.
- **Typed and validated at boot:** a missing or mistyped value fails at start, not at the first request ([[Data validation with pydantic and msgspec]]).
- **One vocabulary across services:** agent-runtime's `external_mcp_*` connectors and the toolbox's MCP operations are the same mechanism.

## Edge cases
- `oc.env` always yields **strings**: convert `parameters` where you read them.
- An env variable passed **empty** overrides the YAML default — e.g. Compose's `${WEB_DOCS}` with nothing set makes the service refuse to start. Don't pass optional variables empty.
- `server: {}` is required (even empty) for a service with no HTTP API (the toolbox).
- An MCP connector's optional `refresh` block (`interval`, `retry_delay`, `max_retry_delay`, in seconds; 60, 5 and 60 when left out) sets how often a client re-reads that server's tools. pycraftcore only carries and checks the numbers (`McpRefresh`: all above 0, the ceiling not below the first delay); the loop is the service's ([[Start order and dependencies]]). agent-runtime and agent-toolbox read them from `MCP_REFRESH_INTERVAL`, `MCP_RETRY_DELAY` and `MCP_MAX_RETRY_DELAY`.

## Check yourself
1. What's the difference between a connector and an operation?
> [!success]- Answer
> A connector says where something is and how to reach it (base URL, timeout, retry, auth). An operation says what you do with it (a method and path, parameters) and points at a connector; many operations can share one.
2. Why does an empty `WEB_DOCS` break a service that has a default for it?
> [!success]- Answer
> An env variable that's set, even to an empty string, wins over the YAML default. `${oc.env:WEB_DOCS,false}` then yields `""`, which isn't a valid boolean, so validation fails at start. Don't pass optional variables at all when they have no value.

## Go further
- [OmegaConf: variable interpolation and resolvers](https://omegaconf.readthedocs.io/en/latest/usage.html#variable-interpolation).
