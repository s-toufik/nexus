---
type: path
track: Applications
time: ~8 h
projects: ["[[pycraftcore]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Serving HTTP well

> **Goal:** build APIs that behave in production: the server/framework split, streaming that survives proxies and disconnects, conventions every service shares, and calls to other services that fail gracefully.
> **Time:** ~8 h.
> **Before:** [[Path - Design that lasts]] · [[Path - Networks you can reason about]]. **Then:** [[Path - The frontend]] · [[Project - Build a service]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Server vs application (ASGI) | Granian serving Litestar in agent-runtime; the toolbox's ASGI app |
| Framework choice on evidence | the web framework benchmark's result |
| Streaming over HTTP | agent-runtime `/v1/stream`; pycraftcore `event_stream`, `with_heartbeat` |
| Health endpoints for orchestration | `/actuator/health`, `/health/readiness` (503 until boot) |
| One contract over three frameworks | pycraftcore `web_litestar`, `web_fastapi`, `web_blacksheep` |
| Retries and circuit breakers | pycraftcore `resilient_http`; agent-runtime's model calls |

## Warm-up (optional)
1. What does an outbound port look like in agent-runtime?
> [!success]- Answer
> A `typing.Protocol` in `application/port/outbound/`, implemented structurally by an adapter.

## 1. Servers and frameworks · ~1.5 h

### Learn
**Definitions**
- **ASGI** — the async interface between a Python web *server* and an *application*: `app(scope, receive, send)` ([[ASGI]]).
- **Server** — Granian: sockets, HTTP parsing, workers. **Framework** — Litestar / FastAPI / BlackSheep: routing, validation, DI, docs ([[Python web frameworks]]).
- **Worker** — a server process with its own copy of the app.
- **Factory** — a function returning the app, called by the server at start (`--factory`).

**How it works** — Granian accepts connections and calls the ASGI app; middleware wraps the app; the framework routes to your handler.

**Example from our projects** — agent-runtime's `make run`:
```bash
uv run granian --interface asgi --factory --host 0.0.0.0 --port 8001 --access-log \
  bootstrap.application.agent_application:create_agent_application
```
In the image, `GRANIAN_*` variables configure the same server (`GRANIAN_WORKERS=2` → two processes, double memory).

**Common mistake** — choosing a framework on a "hello world" benchmark. Our realistic benchmark: up to 30 % apart at saturation, a few % at a realistic rate ([[Web framework benchmark]]).

### Check
1. If all three frameworks tie at a realistic rate, what should decide?
> [!success]- Answer
> Developer experience, validation and DI style, ecosystem, docs — unless the service is truly CPU-bound at the HTTP layer.

## 2. Streaming · ~2 h

### Learn
**Definitions**
- **Server-sent events** — a `text/event-stream` response of `event:`/`data:` frames separated by blank lines ([[Server-sent events]]).
- **Heartbeat** — a comment line (`: heartbeat`) sent when the stream is quiet, so proxies don't close it.
- **Disconnect** — the client leaves; the server should stop the work.
- **Buffering** — a proxy or client collecting the whole response before passing it on (Caddy: `flush_interval -1` disables it).

**How it works**
The controller starts the work in the background and returns the stream at once; a presenter turns domain events into frames; `with_heartbeat` interleaves comments when nothing arrived for 15 s; when the client leaves, the stream stops and the generator's `finally` runs.

**Example from our projects** — a stream route with pycraftcore (README example):
```python
@get("/v1/orders/updates", media_type=EVENT_STREAM_MEDIA_TYPE)
async def updates() -> Stream:
    return event_stream(with_heartbeat(orders.updates(), every=15.0))
```

**Common mistake** — testing a stream with `curl` without `-N`: curl buffers and you see everything at the end.

### Do (from your Mac)
1. `curl -N http://<HOMELAB_DOMAIN>:8000/v1/stream -H 'Content-Type: application/json' -d '{"message":"What is a KV cache? Two sentences.","model_name":"<from /v1/models>","request_id":"path-http-2"}'` → status, tokens, final, complete.
2. Same without `-N` → nothing until the end.

### Check
1. Why the `: heartbeat` every 15 s during long model calls?
> [!success]- Answer
> Proxies close connections silent for too long; a comment keeps bytes flowing and SSE clients ignore it.

## 3. One toolkit, three frameworks · ~1.5 h

### Learn
**Definitions**
- **Actuator** — health and info endpoints: `/actuator/health`, `/health/liveness`, `/health/readiness`, `/actuator/info`.
- **Base path** — a prefix for every route, for gateways that keep it.
- **Lifespan** — start-up/shutdown hook (open pools, discover tools).

**How it works** — each toolkit exposes `create_app`, `actuator_router`, `event_stream`, `detail_handler` in its framework's own types; shared tests run the same orders app against all three ([[pycraftcore web toolkits]]).

**Example from our projects** — agent-runtime builds its app (`litestar_api.py`):
```python
return create_app(
    api,
    routes=[AgentRouter, actuator_router(actuator)],
    lifespan=lifespan,
    exception_handlers={ServerAtCapacityException: detail_handler(503)},
    dependencies={"agent": Provide(agent, sync_to_thread=False), "models": Provide(models, sync_to_thread=False)},
)
```
`create_app` adds the request-id middleware, CORS, docs and the base path; over `MAX_CONCURRENT_STREAMS` the controller raises and the client gets `503 {"detail": …}`.

**Common mistake** — readiness that says "ready" before the app can serve: Kubernetes sends traffic too early.

### Do
👀 `curl -s http://<HOMELAB_DOMAIN>:8000/actuator/health`, `/health/readiness`; `ls src/pycraftcore/web_litestar src/pycraftcore/web_fastapi src/pycraftcore/web_blacksheep` in pycraftcore.

### Check
1. Why does readiness answer 503 until boot is done?
> [!success]- Answer
> So no traffic arrives before the agent has discovered its tools and models; Kubernetes keeps the pod out of its Service and helmfile waits.

## 4. Calls that fail gracefully · ~2 h

### Learn
**Definitions**
- **Timeout** — the longest a call may take.
- **Retry with backoff** — try again after growing delays, only for retryable errors ([[Retry and backoff]]).
- **Circuit breaker** — after N failures, fail fast for a while, then test once ([[Circuit breaker]]).
- **Idempotent** — safe to repeat (GET, PUT, DELETE); POST usually isn't.

**How it works** — `resilient_http` wraps an httpx transport: timeout → retry retryable errors (connection, timeout, 5xx, 429) with backoff → a breaker that excludes business errors.

**Example from our projects**
```python
settings = ResilientHttpSettings(
    http=HttpClientSettings(limits=LimitsSettings(timeout=10)),
    retry=RetrySettings(retry_count=3, retry_delay=1, max_retry_delay=20, should_retry=is_retryable),
    circuit_breaker=CircuitBreakerSettings(failure_threshold=3, recovery_timeout=30, is_excluded=is_business_error, name="weather"),
)
```
agent-runtime: model calls retry after 5xx, 429 or connection failures — never a silent model, whose request may still be running.

**Common mistake** — retrying everything, forever: an outage becomes a stampede.

### Do
pycraftcore: `uv run pytest tests/circuit_breaker tests/retry -q`; read a test that opens the breaker.

### Check
1. A backend returns 503 for 5 minutes. What does a client with retries and a breaker (3, 30 s) do?
> [!success]- Answer
> Retries with growing delays and fails; after 3 failures the breaker opens and calls fail at once; every 30 s one test call goes through; it closes when one succeeds.

## 5. Run the agent yourself · ~1 h

### Do
Follow [[Agent runtime - Run it locally]] with a `.env` pointing at the homelab: `LLM_BASE_URL=https://<HOMELAB_DOMAIN>:8090/v1`, `LLM_API_KEY=` the `llm-gateway` key ([[Homelab - Manage secrets#Read one]]), `TOOLBOX_URL=http://<HOMELAB_DOMAIN>:8001/mcp`, `DB_MONGO_CHECKPOINT_HOST=localhost` (no MongoDB locally → SQLite fallback), `OTEL_HOST=` empty. `make run` → `:8001`; the boot log lists the toolbox's tools. Send lesson 2's request to `http://localhost:8001`.

**Milestone:** you can serve, stream, protect and debug an HTTP API with the same conventions as our services.
