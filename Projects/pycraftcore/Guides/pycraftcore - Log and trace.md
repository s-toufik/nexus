---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Log and trace

> One log format with the request id on every line, and OpenTelemetry traces, metrics and logs to a collector.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

## Logging and the request id

```python
from pycraftcore.logger import configure_logging
from pycraftcore.logger.adapter import StandardLogger

configure_logging("INFO")
logger = StandardLogger()
logger.info("booted")
```

```text
2026-09-27 10:06:17.679 | INFO     | 1bddfefb-… | controller:execute:51 - stream request accepted
```

- The third column is `request_id_context`. In a web service, `RequestIDMiddleware` (`pycraftcore.web.middleware`, added for you by the web toolkits) sets it from the `X-Request-ID` header; every line logged during that request shows it, `-` otherwise. Don't write it in your messages.
- Uvicorn's and Granian's worker logs use the same format; chatty libraries (httpx, mcp, pymongo…) stay at `WARNING`.
- Calling `configure_logging` again replaces the handler rather than adding a second one.

## Telemetry

```python
from pycraftcore.application_configuration.enum import RunTypeEnvironment
from pycraftcore.telemetry.adapter import OpenTelemetryProvider

telemetry = OpenTelemetryProvider(
    service_name="my-service",
    environment=RunTypeEnvironment.debug,
    otlp_endpoint="<collector-host>:<port>",  # None: nothing is exported
)
tracer = telemetry.tracer("my-service")
```

Spans and log records carry the request id as an attribute, so logs and traces line up in Grafana.

## Why it works
- [[OpenTelemetry]] · [[Homelab observability]] · [[asyncio]] (context variables)
