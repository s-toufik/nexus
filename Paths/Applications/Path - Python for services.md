---
type: path
track: Applications
time: ~8 h
projects: ["[[pycraftcore]]", "[[Agent runtime]]", "[[Agent toolbox]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Python for services

> **Goal:** be at home in a modern async Python service — toolchain, concurrency, validation, configuration, logging — through pycraftcore, the foundation of the agent and the toolbox.
> **Time:** ~8 h.
> **Before:** [[Path - Tour of pycraftcore]]. **Then:** [[Path - Design that lasts]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Reproducible environments | `pyproject.toml` + `uv.lock` in every Python repo; `make install_dev` |
| Optional dependencies | pycraftcore extras, CI's per-extra matrix |
| Async I/O | every route, model call, tool call, repository |
| Validate at the edges | msgspec request schemas (agent-runtime), pydantic tool models (toolbox) |
| Config from the environment, validated | pycraftcore `application_configuration`, `config/<env>/` |
| A request id on every log line | `RequestIDMiddleware`, `request_id_context` |

## Warm-up (optional)
1. Where does an app's configuration come from in a Kubernetes pod?
> [!success]- Answer
> Environment variables and mounted files from ConfigMaps and Secrets, set by the release's values.

## 1. The toolchain · ~1.5 h

### Learn
**Definitions**
- **Virtual environment** — an isolated set of installed packages for one project (`.venv`).
- **pyproject.toml** — the project's standard description: name, version, dependencies, extras, dev groups, tool settings ([[uv and pyproject]]).
- **Lock file** — `uv.lock`: exact versions of every package, so every install is identical.
- **Extra** — an optional dependency group: `pycraftcore[http]` ([[Python packaging]]).
- **Linter / type checker** — ruff (style and bugs), ty (types, strict).

**How it works**
`uv sync --group dev` creates `.venv` matching `uv.lock` exactly; `uv run <cmd>` runs inside it; `make check` = ruff + ty + pytest.

**Example from our projects** — how pycraftcore's extras chain (from its README):
```text
resilient_http = aiohttp, httpx + pycraftcore[circuit_breaker, http, retry, telemetry]
circuit_breaker = aiobreaker + pycraftcore[logger]
web_litestar = litestar + pycraftcore[web]
```
Installing `resilient_http` brings four other modules — but a service should still list every module it imports, in case these links change.

**Common mistake** — `pip install` into the system Python: versions drift between machines and CI. Always through the project's environment.

### Do (in `pycraftcore`)
1. `make install_dev` → a `.venv`; `make check` → green.
2. 👀 `pyproject.toml`: `[project.optional-dependencies]`, find `resilient_http`.

### Check
1. Why does CI install each extra alone and import its package?
> [!success]- Answer
> To prove no module secretly needs another module's third-party packages; with everything installed together, such a missing dependency would go unnoticed until a service installs only that extra.

## 2. Concurrency with asyncio · ~2 h

### Learn
**Definitions**
- **Coroutine** — an `async def` function; calling it creates an awaitable, `await` runs it ([[asyncio]]).
- **Event loop** — the single thread that runs coroutines, switching at every `await` that waits on I/O.
- **Blocking call** — one that doesn't `await` (e.g. `time.sleep`, a CPU loop, a sync driver): it freezes the loop.
- **Task / gather** — run coroutines concurrently: `asyncio.gather(a(), b())`, `TaskGroup`.
- **Cancellation** — a cancelled task gets `CancelledError` at its next `await`; `finally` blocks clean up.

**How it works**
Waiting for a network answer costs no CPU: while one request waits, the loop runs others. That's why one Granian worker can hold hundreds of open LLM streams.

**Example from our projects** — the benchmark shop's product endpoint calls two fake APIs in parallel ([[Web framework benchmark design]]): stock and price each take their latency once, not twice. The same idea in plain Python:
```python
import asyncio, time
async def call(name, s):
    await asyncio.sleep(s); return name
async def main():
    t = time.perf_counter()
    await call("stock", 1); await call("price", 1)
    print("sequential", round(time.perf_counter() - t, 1))
    t = time.perf_counter()
    print(await asyncio.gather(call("stock", 1), call("price", 1)), "parallel", round(time.perf_counter() - t, 1))
asyncio.run(main())
```

**Common mistake** — CPU-heavy work inside an `async` route: every other request waits. Move it to a process (the sandbox) or a thread.

### Do
Run the snippet → `sequential 2.0`, then `['stock', 'price'] parallel 1.0`. Replace `asyncio.sleep(s)` with `time.sleep(s)` → both 2 s.

### Check
1. Why did `time.sleep` make `gather` useless?
> [!success]- Answer
> It blocks the one thread the loop runs on; nothing else can run until it returns.

## 3. Validating data at the edges · ~1.5 h

### Learn
**Definitions**
- **Schema** — the declared shape of data (fields, types, constraints).
- **pydantic** — validation + JSON schema generation from typed classes; **msgspec** — a faster, stricter alternative (`Struct`) ([[Data validation with pydantic and msgspec]]).
- **Boundary** — where data enters: HTTP bodies, config, tool arguments, model outputs.

**How it works**
Validate once at the boundary, then trust the types inside. Field descriptions double as documentation: OpenAPI for HTTP APIs, JSON Schema for MCP tools.

**Example from our projects** — the toolbox's `file_reader` input:
```python
class ReadFileInput(BaseModel):
    file_path: str = Field(description="File path, including extension. When a working directory is configured, relative paths resolve inside it and paths outside it are refused.")
    start: int | None = Field(default=None, description="Line number to start reading from (0-based). Giving start or count reads raw lines.")
    count: int | None = Field(default=None, description="Maximum number of lines to read.")
```
`InvokeToolUseCase` validates the model's arguments against it; a bad field returns `Invalid arguments for 'file_reader': start: Input should be a valid integer, …` — which the model can fix.

**Common mistake** — validating deep inside business code instead of at the edge: errors surface late, far from their cause.

### Do
👀 agent-runtime `src/bootstrap/application/litestar/schema/` (msgspec); agent-toolbox `adapter/outbound/file/model/` (pydantic).

### Check
1. Where does a toolbox field description end up?
> [!success]- Answer
> In the tool's JSON schema returned by MCP `tools/list`, which the model reads to fill its arguments.

## 4. Configuration as data · ~2 h

### Learn
**Definitions**
- **Connector** — where something is (an API, a database, an MCP server, telemetry); **operation** — what you do with one; **server** — how the service itself is served ([[pycraftcore configuration]]).
- **Interpolation** — `${oc.env:NAME,default}` (from the environment), `${connector.weather}` (another entry).
- **APP_ENV** — selects `config/<APP_ENV>/`.

**How it works**
`root.yml` lists what's in use; the loader reads every file, resolves interpolations, validates into typed objects. Only the loader reads the environment.

**Example from our projects** — pycraftcore's README example, a connector and an operation pointing at it:
```yaml
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
```python
connector = config.connector.api("weather")   # ApiConnector
operation = config.operation.api("forecast")  # ApiOperation
```

**Common mistake** — `WEB_DOCS=` (empty) in a deployment: `${oc.env:WEB_DOCS,false}` uses `false` only when the variable is *unset*; empty overrides it and validation fails.

### Do
👀 agent-runtime `config/root.yml`, `config/debug/connector/api.yml`, `operation/llm.yml`; agent-toolbox `config/root.yml` (why `server: {}`?).

## 5. Logs with a request id · ~1 h

### Learn
**Definitions**
- **Context variable** — a value scoped to the current task that follows it across `await`s (`contextvars`).
- **Middleware** — code wrapping every request.

**How it works** — `RequestIDMiddleware` reads `X-Request-ID` (or makes one), stores it in `request_id_context`; the log formatter prints it as the third column; telemetry adds it as an attribute.

**Example from our projects**
```text
2026-09-27 10:47:47.785 | INFO     | my-conversation | stream_agent_controller:execute:45 - stream request accepted
```

**Common mistake** — adding the id to every message by hand: it's forgotten in the one place you need it.

### Check
1. How does every line of a request get the same id without passing it to every function?
> [!success]- Answer
> The middleware stores it in a context variable at the start of the request; the formatter reads it; context variables follow the task across `await`s.

**Milestone:** you can read any of our Python services' setup — toolchain, config, logging — and say why it's that way.
