---
type: repository
project: "[[pycraftcore]]"
repo: https://github.com/s-toufik/pycraftcore
language: Python 3.14
status: active
tags: [repository, pycraftcore]
updated: 2026-11-08
---

# pycraftcore

> The library: `src/pycraftcore/<module>/` with `port/`, `adapter/`, `configuration/`, `schema/`, `enum/`; tests per module; extras in `pyproject.toml`.

## Layout
| Path | Holds |
|---|---|
| `src/pycraftcore/<module>/` | One module: application_configuration, authentication, circuit_breaker, computation_engine, context, file_handler, http, logger, profiler, query_language, repository, resilient_http, retry, runtime, serializer, telemetry, web, web_blacksheep, web_fastapi, web_litestar |
| `tests/<module>/` | Its tests; `tests/web/apps/` the same orders app per framework |
| `pyproject.toml` | Version, extras, `all` |
| `.github/workflows/cicd.yml` | Checks, the per-extra import matrix, publishing |

## Make targets
`venv clean_dependency_cache clear_dependency_cache install update_dependency install_dev test lint fix typecheck format check git_init clean build publish_dev publish`

## Used by
[[Agent runtime]] · [[Agent toolbox]] · [[Web framework benchmark]]
