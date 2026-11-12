---
type: architecture
project: "[[pycraftcore]]"
order: 3
tags: [pycraftcore, architecture, web]
updated: 2026-11-08
---

# pycraftcore web toolkits

> Three frameworks, one contract. `web_litestar`, `web_fastapi` and `web_blacksheep` each expose the same four functions — `create_app`, `actuator_router`, `event_stream`, `detail_handler` — in the framework's own types. You write routes the framework's way; pycraftcore does what every service would otherwise repeat.

Previous: [[pycraftcore configuration]] · Next: [[pycraftcore resilience]]

**Do it:** [[pycraftcore - Serve an HTTP API]] · [[pycraftcore - Add a web framework]]

## What every app gets
| Concern | How |
|---|---|
| Request id | `RequestIDMiddleware` first: `X-Request-ID` → a context variable on every log line and span |
| Base path | Every route, docs and actuator under `api.base_path` (for gateways that keep the prefix) |
| CORS | From `api.cors_origins` |
| Docs | Swagger UI at `{base_path}/docs` only when `api.docs` is on |
| Errors | `{"detail": "…"}` via `detail_handler(status)` |
| Health | `/actuator/health`, `/health/liveness`, `/health/readiness` (503 until `is_ready()`), `/info` — what Kubernetes probes call ([[Probes]]) |
| Streams | `event_stream(frames)`: `text/event-stream`, stops when the client leaves; `with_heartbeat` sends `: heartbeat` when quiet ([[Server-sent events]]) |

## The framework-free core: `web`
`ApiSettings`, the actuator, the middleware, SSE framing, `with_idle_ticks`, `cancel_on_disconnect` live in `pycraftcore.web` without any framework — the toolkits only translate them. That's why [[Web framework benchmark]] can compare frameworks fairly: the shop and the conventions are identical; only the framework changes.

## Framework differences it absorbs
- **Litestar:** `data: JSONBody[Model]` (msgspec), POST defaults to 201.
- **FastAPI:** pydantic, `Depends`, `EventStreamResponse` for the docs; invalid bodies 422 (others 400).
- **BlackSheep:** doesn't stop a stream when the client leaves → `cancel_on_disconnect` waits for the disconnect with one watcher task per stream; `create_app` returns the app wrapped in the middleware.

## Tested once for all
`tests/web/apps/<name>_orders.py` is the same orders app in each framework's style; shared tests check routes, request id, statuses, errors, streams and disconnect, CORS, base path, docs, actuator and lifespan against every toolkit (`EVERY_TOOLKIT`).

## Check yourself
1. Why put SSE heartbeats and disconnect handling in `web` rather than in each toolkit?
> [!success]- Answer
> They're the same logic for every framework: written once in `web`, every toolkit behaves identically and is tested the same way, and a fix lands everywhere. Each toolkit only translates it to its framework's types.
2. What would a fourth framework need to pass?
> [!success]- Answer
> The four functions (`create_app`, `actuator_router`, `event_stream`, `detail_handler`) in its own types, the same orders app written its way in `tests/web/apps/`, and every shared test in `EVERY_TOOLKIT`: routes, request id, statuses, errors, streams and disconnect, CORS, base path, docs, actuator and lifespan.

## Go further
- [Litestar](https://docs.litestar.dev/), [FastAPI](https://fastapi.tiangolo.com/), [BlackSheep](https://www.neoteroi.dev/blacksheep/).
