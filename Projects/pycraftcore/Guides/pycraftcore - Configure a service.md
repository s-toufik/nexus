---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Configure a service

> Describe connectors, operations and servers in YAML driven by environment variables, and load them as typed objects.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

A service's configuration is a folder of YAML files, with values taken from environment variables (`${oc.env:NAME}`):

| Path | What it holds |
|---|---|
| `root.yml` | The environment, the log level and the list of connectors, operations and servers in use |
| `<env>/connector/*.yml` | Where things are: APIs, databases, files, MCP servers, telemetry |
| `<env>/operation/*.yml` | What you do with them; each operation points at a connector |
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

`config.connector` returns typed connectors per kind (`.api()`, `.database()`, `.file()`, `.mcp()`, `.telemetry()`), `config.operation` typed operations (`.api()`, `.file()`) and `config.server` typed servers (`.asgi()`); the `type` field of each entry decides which fields it takes.

- `log` is a `LogLevel` (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`, upper case): pass it to `configure_logging(config.log)`.
- A server holds `base_path`, `docs` and `cors_origins`: turn them into the web toolkit's `ApiSettings` (see [[pycraftcore - Serve an HTTP API]]). Which framework serves the API is a choice made in code, not in the configuration.
- `parameters` is yours: pycraftcore passes it through untouched. `oc.env` always gives strings, so convert the values where you read them.
- `log` and `server` are required, like `connector` and `operation`. A service that serves no HTTP API writes `server: {}`.

## Why it works
- [[pycraftcore configuration]] · [[Data validation with pydantic and msgspec]]
