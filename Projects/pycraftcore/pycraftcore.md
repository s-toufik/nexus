---
type: project
status: active
started: 2025
repos: [pycraftcore]
tags: [project, pycraftcore, python, library]
updated: 2026-11-08
---

# pycraftcore

> A shared technical foundation for Python services: configuration, logging, telemetry, resilient HTTP, HTTP APIs on Litestar, FastAPI or BlackSheep, database repositories, safe SQL and a sandbox for untrusted Python. Small swappable building blocks — each a port plus adapters — not a framework.

## In one picture
![[pycraftcore.canvas]]

## Why it exists
Every service needs the same plumbing: read config, log with a request id, trace, call APIs that fail, serve HTTP, talk to a database. Written once, tested once, used by [[Agent runtime]], [[Agent toolbox]] and [[Web framework benchmark]] — so those services contain only their own logic.

## What's inside
| Area | Modules |
|---|---|
| Set up | `application_configuration`, `logger`, `telemetry`, `context`, `authentication` |
| Talk out | `http`, `resilient_http` (with `retry`, `circuit_breaker`) |
| Serve | `web` + `web_litestar`, `web_fastapi`, `web_blacksheep` |
| Store | `repository` (SQLite, PostgreSQL, MongoDB) |
| Run safely | `query_language` (read-only SQL), `runtime` (Python sandbox) |
| Utilities | `file_handler`, `serializer`, `computation_engine`, `profiler` |

## Read it in this order
1. [[pycraftcore modules]] — the port/adapter shape, extras, design rules.
2. [[pycraftcore configuration]] — connectors, operations, servers.
3. [[pycraftcore web toolkits]] — one API contract over three frameworks.
4. [[pycraftcore resilience]] — retries, circuit breaker, timeouts.
5. [[pycraftcore runtime sandbox]] — how untrusted code runs and calls back.

Then [[pycraftcore decisions]] and [[pycraftcore guides]].

## Knowledge it uses
[[Hexagonal architecture]] · [[Dependency injection]] · [[Repository pattern]] · [[Retry and backoff]] · [[Circuit breaker]] · [[ASGI]] · [[Python web frameworks]] · [[Server-sent events]] · [[Data validation with pydantic and msgspec]] · [[asyncio]] · [[OpenTelemetry]] · [[Python packaging]] · [[uv and pyproject]] · [[AI agents and sandboxing]]

## Where it stands (2026-11-08)
- Published on PyPI (development builds on TestPyPI); Python 3.14, `ty` strict.
- Work in progress on `develop`: circuit breaker and sandbox runner changes.
