---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-12
---

# pycraftcore - Install it

> Add pycraftcore to a service with only the extras it needs, or try a development build.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

Requires Python 3.14. Each module's third-party dependencies sit behind an extra of the same name, so a service installs only what it uses:

```bash
uv add "pycraftcore[http,repository]"     # or: pip install "pycraftcore[http,repository]"
uv add "pycraftcore[all]"                 # every module
```

A bare `pycraftcore` installs no third-party packages: only `authentication`, `context` and `logger` work without an extra. For any other module, importing its adapters without the extra fails with `ModuleNotFoundError`.

| Extra | Third-party packages | Also brings in |
|---|---|---|
| `authentication`, `context`, `logger` | none | — |
| `profiler` | pyinstrument | — |
| `query_language` | sqlglot | — |
| `computation_engine` | numpy, scipy | — |
| `serializer` | orjson, msgpack, pydantic | — |
| `file_handler` | orjson, pyyaml | — |
| `runtime` | pydantic | — |
| `runtime-sandbox` | pandas, numpy, matplotlib, python-dateutil | `runtime` |
| `circuit_breaker` | aiobreaker | `logger` |
| `retry` | tenacity | `logger` |
| `http` | aiohttp, httpx, orjson | `context`, `logger` |
| `web` | none | `context` |
| `web_fastapi`, `web_litestar`, `web_blacksheep` | fastapi, litestar, blacksheep (one each) | `web` |
| `application_configuration` | omegaconf, pydantic, python-dotenv | `http`, `logger`, `authentication` |
| `telemetry` | opentelemetry (api, sdk, otlp exporter, logging instrumentation) | `application_configuration`, `context` |
| `resilient_http` | aiohttp, httpx | `circuit_breaker`, `http`, `retry`, `telemetry` |
| `repository` | aiosqlite, pymongo, psycopg, psycopg-pool, sqlalchemy, orjson, pydantic | `application_configuration`, `authentication` |

List every module your code imports, even when one extra already brings in another. That way your service stays correct if these links change. For the Python sandbox, use `runtime-sandbox` rather than `runtime`: the sandboxed code runs on your service's interpreter, so the libraries it may import (pandas, numpy, matplotlib, dateutil) must be installed there.

Development builds (tags on `develop`, such as `v5.1.0-rc.1`, published as `5.1.0rc1`) are published to TestPyPI; use them for testing only. Their dependencies come from PyPI, so add it as an extra index, and name the version, since pip skips pre-releases otherwise:

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ "pycraftcore[http]==5.1.0rc1"
```

## Why it works
- [[pycraftcore modules]] — why extras, and how modules depend on each other.
- [[uv and pyproject]] · [[Python packaging]]
