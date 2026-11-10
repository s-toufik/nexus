---
type: path
level: 3
module: 8
time: ~7 h
projects: ["[[pycraftcore]]", "[[Agent runtime]]", "[[Agent toolbox]]"]
tags: [path, journey]
updated: 2026-11-10
---

# Module 08 - Python for services

> **Goal:** be at home in a modern async Python service: the toolchain, concurrency, validation, configuration — through pycraftcore, the foundation of the agent and the toolbox.
> **Time:** ~7 h. Previous: [[Capstone 2 - Ship and investigate]] · Next: [[Module 09 - Design that lasts]]

## Warm-up
1. Where does an app's configuration come from in a Kubernetes pod?
> [!success]- Answer
> Environment variables and mounted files from ConfigMaps and Secrets, set by the release's values.

## 8.1 The toolchain · ~1 h
**Read:** [[uv and pyproject]] · [[Python packaging]] · [[Pre-commit hooks]]

**Do** (in `pycraftcore`):
1. `make install_dev` → `uv sync --group dev --all-extras`; a `.venv` appears.
2. `make check` → ruff, ty, pytest all green.
3. 👀 Read `pyproject.toml`: one extra (`resilient_http`) and what it pulls in.

**Check:**
1. Why does CI install each extra alone and import its package?
> [!success]- Answer
> To prove no module secretly needs another module's third-party packages. With everything installed together, such a missing dependency would go unnoticed until a service installs only that extra.

## 8.2 Concurrency with asyncio · ~2 h
**Read:** [[asyncio]]

**Do** (anywhere, `uv run python`):
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
→ `sequential 2.0`, then `['stock', 'price'] parallel 1.0`. Replace `asyncio.sleep(1)` with `time.sleep(1)` in `call` and run again → both take 2 s.

**Check:**
1. Why did `time.sleep` make `gather` useless, and what does that mean for a CPU-heavy route in an async API?
> [!success]- Answer
> `time.sleep` blocks the one thread the event loop runs on; nothing else can run until it returns. A CPU-heavy route does the same: every other request waits. Move such work to a process (the sandbox) or a thread pool.

## 8.3 Validating data at the edges · ~1 h
**Read:** [[Data validation with pydantic and msgspec]] · [[REST APIs and OpenAPI]]

**Do:**
1. 👀 In agent-runtime: `src/bootstrap/application/litestar/schema/` → the request body as a msgspec Struct.
2. 👀 In agent-toolbox: `src/agent_toolbox/adapter/outbound/file/model/` → a tool's pydantic input, and its field descriptions.

**Check:**
1. Where does a toolbox field description end up?
> [!success]- Answer
> In the tool's JSON schema returned by MCP `tools/list` — which the model reads to choose the tool and fill its arguments.

## 8.4 Configuration as data · ~1.5 h
**Read:** [[pycraftcore]] · [[pycraftcore modules]] · [[pycraftcore configuration]]

**Do:**
1. 👀 In agent-runtime: `config/root.yml`, then `config/debug/connector/api.yml` and `operation/llm.yml` → find a connector, the operations that point at it, and every `${oc.env:…}`.
2. 👀 Compare with agent-toolbox's `config/root.yml`: why `server: {}`?

**Check:**
1. A deployment sets `WEB_DOCS=` (empty). What happens, and why?
> [!success]- Answer
> The empty string overrides the YAML default (`${oc.env:WEB_DOCS,false}` only uses `false` when the variable is *unset*), the value fails validation as a boolean, and the service refuses to start.

## 8.5 Logs with a request id · ~30 min
**Read:** [[pycraftcore - Log and trace]]

**Check:**
1. How does every log line of a request get the same id without passing it to every function?
> [!success]- Answer
> `RequestIDMiddleware` stores `X-Request-ID` in a context variable (`request_id_context`) at the start of the request; the log formatter reads it. Context variables follow the request across `await`s.

**Milestone:** you can read any of our Python services' setup — toolchain, config, logging — and know why it's that way.
