---
type: path
track: Tours
time: ~4 h
projects: ["[[pycraftcore]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of pycraftcore

> **Goal:** know the foundation every Python service here stands on — its modules, its shape, how our services use it — and the principles it packages.
> **Time:** ~4 h. **Before:** [[Path - Tour of the agent toolbox]] helps (you've seen it used). **Then:** [[Path - Python for services]] · [[Path - Design that lasts]]. **All paths:** [[Paths]]

How each lesson works: **Learn** → **Do** (👀 looks, ✋ changes) → **Check** → **You can now**.

## 1. What it is, and why · ~30 min

### Learn
**Definitions**
- **Library vs framework** — a library is called by your code; a framework calls your code and owns the lifecycle. pycraftcore is a library of building blocks.
- **Module** — one capability (`logger`, `http`, `repository`, `runtime`…), usable alone.
- **Extra** — an optional group of third-party dependencies, installed with `pycraftcore[<module>]` ([[Python packaging]]).

**How it works**
Every Python service needs configuration, logs with a request id, telemetry, resilient HTTP, an HTTP API, databases. pycraftcore writes and tests these once; agent-runtime, agent-toolbox and the benchmark import them, so their own code is only their logic.

**Example from our projects** — which modules our services actually import (`grep "from pycraftcore." src`):
| Module | agent-runtime | agent-toolbox |
|---|---:|---:|
| `logger` | 24 | 8 |
| `application_configuration` | 17 | 14 |
| `web`, `web_litestar` | 7 + 2 | 1 |
| `http`, `resilient_http`, `retry`, `circuit_breaker` | 4 + 2 + 1 + 1 | 1 |
| `repository` | 3 | 4 |
| `telemetry`, `context`, `authentication` | 2, 2, 4 | 2, 2, 1 |
| `runtime`, `query_language`, `file_handler` | — | 7, 3, 4 |
The agent leans on the web toolkit and resilient HTTP; the toolbox on the sandbox, safe SQL and files.

**Common mistake** — installing `pycraftcore[all]` "to be safe": larger images, more vulnerabilities, and you won't notice which modules you really depend on.

### Check
1. Why a library of building blocks rather than a framework?
> [!success]- Answer
> Services keep control of their own structure and pick only the modules they need; any block can be replaced. A framework would own the app's lifecycle and be harder to leave ([[pycraftcore decisions]]).

## 2. Its shape · ~45 min

### Learn
**Definitions**
- **Port** — the interface services depend on, in `<module>/port/` (often a `typing.Protocol`).
- **Adapter** — an implementation around a library, in `<module>/adapter/`.
- **Settings** — pydantic models in `<module>/configuration/`; **schema** — data crossing the port, in `<module>/schema/`.

**How it works**
Every module has the same folders, so you always know where to look, and a new backend is a new adapter behind the same port — services don't change.

**Example from our projects** — the repository port (`repository/port/repository.py`):
```python
@runtime_checkable
class AsyncRepository(Protocol):
    async def execute(
        self,
        query: str,
        parameters: tuple[Any, ...] = (),
    ) -> list[dict[str, Any]]: ...
```
SQLite, PostgreSQL and MongoDB adapters all satisfy it; `@runtime_checkable` lets code check `isinstance(x, AsyncRepository)` at runtime.

**Common mistake** — letting a library type leak into a port (returning a psycopg cursor): every service is then tied to psycopg.

### Do
👀 `ls src/pycraftcore/repository src/pycraftcore/runtime src/pycraftcore/web_litestar`.

## 3. The four big modules · ~2 h

### Learn
| Module | What it gives | Example |
|---|---|---|
| `application_configuration` | YAML connectors, operations, servers from env, validated | `config.connector.api("weather")` ([[pycraftcore configuration]]) |
| `web` + toolkits | `create_app`, `actuator_router`, `event_stream`, `detail_handler` per framework | agent-runtime's `create_app(api, routes=[…], …)` ([[pycraftcore web toolkits]]) |
| `resilient_http` | httpx client with timeout, retries, circuit breaker | `ResilientTransportFactory(...).create_async_client()` ([[pycraftcore resilience]]) |
| `runtime` | Python sandbox with a host bridge | the toolbox's `python_executor` ([[pycraftcore runtime sandbox]]) |

**Example from our projects** — a resilient client, from pycraftcore's README:
```python
settings = ResilientHttpSettings(
    http=HttpClientSettings(limits=LimitsSettings(timeout=10)),
    retry=RetrySettings(retry_count=3, retry_delay=1, max_retry_delay=20, should_retry=is_retryable),
    circuit_breaker=CircuitBreakerSettings(failure_threshold=3, recovery_timeout=30, is_excluded=is_business_error, name="weather"),
)
client = ResilientTransportFactory(settings=settings, trace_manager=tracer, logger=logger).create_async_client()
```
Timeout → retries for retryable errors only → after 3 failures, fail fast for 30 s; business errors (a 404 that's a real answer) don't count.

**Common mistake** — passing an optional env variable empty (`WEB_DOCS=`): it overrides the YAML default and validation fails at start.

### Do
👀 Read one of the four architecture notes in full — the one closest to what you'll work on next.

### Check
1. Name what agent-runtime and agent-toolbox each take from pycraftcore.
> [!success]- Answer
> Both: configuration, logging with the request id, telemetry, context, authentication, repository, HTTP. agent-runtime also the web toolkit (`web`, `web_litestar`) and resilient HTTP with retry and circuit breaker. agent-toolbox also `runtime` (sandbox and host bridge), `query_language` (read-only SQL) and `file_handler`.

## 4. The principles inside · ~30 min
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Ports and adapters in a library | [[Hexagonal architecture]] | `<module>/port/`, `<module>/adapter/` | [[Path - Design that lasts]] |
| Optional dependencies | [[Python packaging]] | extras, the CI per-extra matrix | [[Path - Python for services]] |
| Config from env, validated | [[pycraftcore configuration]] | `application_configuration` | [[Path - Python for services]] |
| One API contract, many frameworks | [[ASGI]], [[Python web frameworks]] | `web`, `web_litestar/fastapi/blacksheep` | [[Path - Serving HTTP well]] |
| Retries and circuit breakers | [[Retry and backoff]], [[Circuit breaker]] | `resilient_http` | [[Path - Serving HTTP well]] |
| Data access behind an interface | [[Repository pattern]] | `repository` | [[Path - Design that lasts]] |
| Request-scoped context | [[asyncio]] | `context`, `RequestIDMiddleware` | [[Path - Python for services]] |
| Sandboxing untrusted code | [[AI agents and sandboxing]] | `runtime` | [[Path - Tools and safety]] |

**Milestone:** you can say, for any line of setup code in our services, which pycraftcore module it comes from and why it exists.
