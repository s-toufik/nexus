---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-15
---

# pycraftcore - Configure a service

> Describe connectors, operations and servers in YAML driven by environment variables, and load them as typed objects.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

A service's configuration is a folder of YAML files, with values taken from environment variables (`${oc.env:NAME}`):

| Path | What it holds |
|---|---|
| `root.yml` | The environment, the log level and the list of connectors, operations and servers in use |
| `<env>/connector/*.yml` | Where things are and how to reach them: APIs, databases, files, MCP servers, A2A agents, telemetry |
| `<env>/operation/*.yml` | What you do with them: which database, tables and TTL, which endpoint, which parameters; each operation points at a connector |
| `<env>/server/*.yml` | How the service itself is served: base path, API documentation, CORS origins, and your own `parameters` |

```yaml
# <env>/connector/api.yml
connector:
  weather:
    name: weather
    type: api
    base_url: https://<api-host>
    timeout: 5
    retry: 3
    auth:
      type: token
      key_name: apikey
      key_value: ${oc.env:WEATHER_API_KEY}
```

```yaml
# <env>/operation/weather.yml
operation:
  forecast:
    name: forecast
    type: api
    connector: ${connector.weather}
    endpoint: /forecast
    method: GET
    parameters:
      days: 3
```

```yaml
# <env>/server/asgi.yml
server:
  weather-api:
    name: weather-api
    type: asgi
    base_path: ${oc.env:WEB_BASE_PATH,""}
    docs: ${oc.env:WEB_DOCS,false}
    cors_origins: ["*"]
    parameters:
      max_forecast_days: ${oc.env:MAX_FORECAST_DAYS,7}
```

```yaml
# root.yml
application_configuration:
  env: ${oc.env:APP_ENV,debug}
  run: async
  log: ${oc.env:LOG_LEVEL,INFO}
  server:
    asgi:
      weather-api: ${server.weather-api}
  connector:
    api:
      weather: ${connector.weather}
  operation:
    forecast: ${operation.forecast}
```

```python
from pathlib import Path

from pycraftcore.application_configuration.adapter import (
    LoadApplicationConfiguration,
    OmegaConfigurationReader,
)
from pycraftcore.application_configuration.enum import RunTypeEnvironment
from pycraftcore.logger.adapter import StandardLogger

reader = OmegaConfigurationReader(RunTypeEnvironment.debug, Path("config"))
config = LoadApplicationConfiguration(reader, StandardLogger()).load()

connector = config.connector.api("weather")  # ApiConnector
operation = config.operation.api("forecast")  # ApiOperation
server = config.server.asgi("weather-api")  # AsgiServer
```

`config.connector` returns typed connectors per kind (`.api()`, `.database()`, `.file()`, `.mcp()`, `.a2a()`, `.telemetry()`), `config.operation` typed operations (`.api()`, `.file()`, `.mcp()`, `.a2a()`, `.database()`) and `config.server` typed servers (`.asgi()`); the `type` field of each entry decides which fields it takes.

- `log` is a `LogLevel` (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`, upper case): pass it to `configure_logging(config.log)`.
- A server holds `base_path`, `docs` and `cors_origins`: turn them into the web toolkit's `ApiSettings` (see [[pycraftcore - Serve an HTTP API]]). Which framework serves the API is a choice made in code, not in the configuration.
- `parameters` is yours: pycraftcore passes it through untouched. `oc.env` always gives strings, so convert the values where you read them.
- A connector holds only what every operation needs to reach the system; an operation holds what one use does there:

  | Database connector | Database operation |
  |---|---|
  | `engine`, `host`, `port`, `auth` | `database`: the database, SQLite file or MongoDB database |
  | `timeout`: seconds to reach the server (default 5) | `collections`: tables or collections by role, read with `operation.collection("events")` |
  | `pool`: `min` and `max` only (default 1 and 1) | `ttl`: seconds the data is kept (optional); `parameters`: the rest |

- A database connector, its pool and a database operation refuse unknown keys: a 5.x `default_name`, `pool.timeout_ms` or `pool.ttl` fails at load and names the key to move.
- An A2A connector (`type: a2a`: `base_url`, `timeout`, `binding` `JSONRPC` / `HTTP+JSON` / `GRPC`) describes an A2A agent's endpoint, whether the service calls it or serves it; an A2A operation points at it with its `parameters`.
- `log` and `server` are required, like `connector` and `operation`. A service that serves no HTTP API writes `server: {}`.

## Why it works
- [[pycraftcore configuration]] · [[Data validation with pydantic and msgspec]]
