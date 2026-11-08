---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-08
---

# Agent runtime - Run it locally

> Start the agent on your Mac against a model server, optionally a toolbox and MongoDB, and read its logs.

**Where:** on your Mac, in `agent-runtime` · **All guides:** [[Agent runtime guides]]

## Start it

You need:

- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- an OpenAI-compatible model server
- optionally, an MCP server for tools (the agent starts without one)
- optionally, MongoDB for conversations (a local SQLite file is used when MongoDB is unreachable)

```bash
uv sync --group dev
cp .env.example .env      # fill in the model server, MCP server and storage
make run
```

| | Endpoint |
|---|---|
| Chat (SSE) | `POST http://<host>:<port>/v1/stream` |
| Models | `GET http://<host>:<port>/v1/models` |
| Health | `GET http://<host>:<port>/actuator/health` (also `/health/liveness`, `/health/readiness`) |
| Version | `GET http://<host>:<port>/actuator/info` |
| API documentation | `http://<host>:<port>/docs` (Swagger UI) and `/docs/openapi.json`, with `WEB_DOCS=true` |

`/health/readiness` answers `503` until the agent has booted, then `200`. The boot log lists the tools found on each MCP server; a server that is down is skipped with a warning.

With Docker, `make docker_build` builds the image (see [[Agent runtime - Release a version]]).

## Read the logs

One format for every line; the third column is the request id (the conversation id on `/v1/stream`), `-` outside a request:

```text
2026-09-27 10:47:47.785 | INFO     | my-conversation | stream_agent_controller:execute:45 - stream request accepted
2026-09-27 10:47:52.310 | INFO     | my-conversation | handle_message:handle:42 - turn finished: answered, 1/20 steps in 4.5s
```

Every message ends with a `turn finished` line (outcome, steps, duration), or a `turn cancelled after …` warning when the client left first. With `OTEL_HOST` set, the same lines also go to the OpenTelemetry collector, with `request_id` as an attribute.

---

## Why it works
- [[Agent runtime layers]] — what boots, and why it starts without a toolbox.
- [[OpenAI-compatible API]] · [[Model Context Protocol]] · [[MongoDB]]
