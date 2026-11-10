---
type: path
level: 3
module: 10
time: ~7 h
projects: ["[[pycraftcore]]", "[[Agent runtime]]"]
tags: [path, journey]
updated: 2026-11-10
---

# Module 10 - Serving HTTP well

> **Goal:** build APIs that behave in production: the server/framework split, streaming that survives proxies and disconnects, conventions every service shares, and calls to other services that fail gracefully.
> **Time:** ~7 h. Previous: [[Module 09 - Design that lasts]] · Next: [[Module 11 - The frontend]]

## Warm-up
1. What does an outbound port look like in Python here?
> [!success]- Answer
> A `typing.Protocol` in `application/port/outbound/`, implemented structurally by an adapter.

## 10.1 Servers and frameworks · ~1.5 h
**Read:** [[ASGI]] · [[Python web frameworks]] · [[Web framework benchmark]] (the result section)

**Do:**
1. 👀 agent-runtime's `make run` line in its `Makefile`: `granian --interface asgi --factory … bootstrap.application.agent_application:create_agent_application` → the server (Granian) imports a factory that returns the app (Litestar).

**Check:**
1. The three frameworks tie at a fixed realistic rate but differ by 30 % at saturation. What should decide your choice?
> [!success]- Answer
> Developer experience, ecosystem, validation and DI style, docs — unless the service is truly CPU-bound at the HTTP layer. At realistic load, I/O (database, APIs, models) dominates.

## 10.2 Streaming · ~1.5 h
**Read:** [[Server-sent events]] · [[Agent runtime - Call the API]]

**Do** (from your Mac, on the tailnet):
1. `curl -N http://<HOMELAB_DOMAIN>:8000/v1/stream -H 'Content-Type: application/json' -d '{"message":"What is a KV cache? Two sentences.","model_name":"<a name from /v1/models>","request_id":"journey-10-2"}'` → `status` frames, `token` frames, `final` with `metadata`, `complete`.
2. Same without `-N` → nothing until the end: curl buffered it. That's what a buffering proxy does to users.

**Check:**
1. Why does the agent send `: heartbeat` every 15 s during long model calls?
> [!success]- Answer
> Proxies and load balancers close connections that stay silent too long. A comment line keeps bytes flowing; SSE clients ignore lines starting with `:`.

## 10.3 One toolkit, three frameworks · ~1.5 h
**Read:** [[pycraftcore web toolkits]] · [[pycraftcore - Serve an HTTP API]]

**Do:**
1. 👀 `curl -s http://<HOMELAB_DOMAIN>:8000/actuator/health` and `/health/readiness` → what Kubernetes probes call.
2. 👀 In pycraftcore: `ls src/pycraftcore/web_litestar src/pycraftcore/web_fastapi src/pycraftcore/web_blacksheep` → the same four modules each.

**Check:**
1. Why does readiness answer 503 until boot is done, and who relies on it?
> [!success]- Answer
> So no traffic arrives before the agent has discovered its MCP tools and models. Kubernetes' readiness probe keeps the pod out of its Service until then, and helmfile's `wait` treats the deploy as unfinished.

## 10.4 Calls that fail gracefully · ~1.5 h
**Read:** [[Retry and backoff]] · [[Circuit breaker]] · [[pycraftcore resilience]]

**Do:**
1. In pycraftcore: `uv run pytest tests/circuit_breaker tests/retry -q` → green; open one test that opens the breaker and read how.

**Check:**
1. A backend returns 503 for 5 minutes. Describe what a client with retries *and* a breaker (threshold 3, recovery 30 s) does.
> [!success]- Answer
> The first calls retry with growing delays and fail; after 3 failures the breaker opens, and calls fail immediately without reaching the backend. Every 30 s it lets one test call through (half-open); it closes again when one succeeds after the backend recovers.

## 10.5 Run the agent yourself · ~1 h
**Read:** [[Agent runtime - Run it locally]] · [[Agent runtime - Configure it]]

**Do:** follow the guide with a `.env` pointing at the homelab: `LLM_BASE_URL=https://<HOMELAB_DOMAIN>:8090/v1`, `LLM_API_KEY=` the `llm-gateway` key ([[Homelab - Manage secrets#Read one]]), `TOOLBOX_URL=http://<HOMELAB_DOMAIN>:8001/mcp`, `DB_MONGO_CHECKPOINT_HOST=localhost` (no MongoDB on your Mac → it falls back to SQLite), `OTEL_HOST=` empty. `make run` → it listens on `:8001`; the boot log lists the toolbox's tools. Send 10.2's request to `http://localhost:8001`.

**Milestone:** you can serve, stream, protect and debug an HTTP API with the same conventions as our services.
