---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Run it locally

> Start the MCP server on your Mac, see its tools, read its logs.

**Where:** on your Mac, in `agent-toolbox` · **All guides:** [[Agent toolbox guides]]

## Start it

Requirements: Python 3.14 and [uv](https://docs.astral.sh/uv/).

```bash
uv sync --group dev
cp .env.example .env      # fill in the paths and the URL clients will use
make run
```

| | Endpoint |
|---|---|
| MCP (streamable HTTP) | `http://<host>:<port>/mcp` |
| Health | `GET http://<host>:<port>/actuator/health` (also `/health/liveness`, `/health/readiness`) |
| Version | `GET http://<host>:<port>/actuator/info` |

`/health/readiness` answers `503` until the server has tools registered.

With Docker: `make docker_build` builds the image.

## Read the logs

One format for every line the service writes; the third column is the request id sent by the client in `X-Request-ID`. Tool calls made from sandboxed code keep the id of the request that started them.

```text
2026-09-27 10:47:47.785 | INFO     | my-conversation | invoke_tool_usecase:invoke:23 - tool 'file_reader' invoked
```

With `OTEL_HOST` set, the same lines also go to the OpenTelemetry collector. Granian's own start and stop lines (`[INFO] Starting granian…`) keep Granian's format; access-log lines carry no request id.

---

## Why it works
- [[Agent toolbox layers]] · [[Model Context Protocol]]
