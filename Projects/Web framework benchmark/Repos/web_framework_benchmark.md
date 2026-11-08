---
type: repository
project: "[[Web framework benchmark]]"
repo: https://github.com/s-toufik/web_framework_benchmark
language: Python 3.14
status: done
tags: [repository, web-framework]
updated: 2026-11-08
---

# web_framework_benchmark

> Local folder `projects/python/web_framework`. The shop (`src/shop/`), the framework wiring (`src/bootstrap/application/<framework>/`) and the benchmark (`src/shop_benchmark/`), plus the reports in `reports/benchmark/`.

| Path | Holds |
|---|---|
| `src/shop/domain/`, `application/` | Products, orders, pricing rules; one use case per endpoint |
| `src/shop/adapter/` | SSE presenter; SQLite repositories; fake inventory, pricing, market APIs |
| `src/bootstrap/application/<framework>/` | Native routes and schemas (pydantic for FastAPI/BlackSheep, msgspec for Litestar) |
| `src/shop_benchmark/` | Benchmark: domain, application (`Benchmark`, `Preflight`, `CompareFrameworks`), oha/httpx/psutil adapters, control panel |
| `reports/benchmark/` | Per-framework runs and `final_<time>.md/.json` comparisons |

Make targets: `install install_dev test lint fix format typecheck check run_fastapi run_litestar run_blacksheep benchmark benchmark_quick benchmark_report clean build`.
