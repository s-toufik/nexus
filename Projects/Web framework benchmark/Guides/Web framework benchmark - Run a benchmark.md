---
type: guide
project: "[[Web framework benchmark]]"
tags: [guide, web-framework]
updated: 2026-11-08
---

# Web framework benchmark - Run a benchmark

> Serve the shop with one framework, load it with oha, repeat for each framework, then build the comparison.

**Where:** on your Mac, in `web_framework` · **All guides:** [[Web framework benchmark guides]]

## Install

Requirements: Python 3.14, [uv](https://docs.astral.sh/uv/) and [oha](https://github.com/hatoo/oha), the load generator.

```bash
uv sync --group dev
brew install oha
```

## The shop

Every framework serves the same endpoints, with the same answers byte for byte:

| Endpoint | Kind | Work done for each request |
|---|---|---|
| `GET /v1/products/{sku}` | JSON | Product from the database, stock and tax from two APIs called in parallel, price with tax |
| `POST /v1/orders` | JSON | Validates the order, reads its products, quote from the pricing API, totals with discount and tax, stores the order |
| `GET /v1/products/{sku}/events` | stream (SSE) | Price and stock updates paced by a market feed, then an `end` event |
| `POST /v1/orders/track` | stream (SSE) | The order's stages: received, validated, priced, reserved (inventory API), confirmed (stored) |
| `GET /v1/products/{sku}/image` | binary | The product's image, read from the database |
| `POST /v1/files` | binary | Stores the uploaded bytes and answers their SHA-256 (32 bytes) |
| `GET /v1/products/{sku}/label` | text | A shelf label rendered from the product, its stock and price |
| `POST /v1/notes` | text | Normalises the text, counts lines and words, stores it, answers a summary |
| `GET /v1/about` | JSON | Which framework, version, server and Python answer (used by the benchmark) |
| `GET /actuator/health`, `/health/readiness`, `/info` | JSON | Health and version |

An unknown SKU answers `404 {"detail": "No product '…'"}`. With `WEB_DOCS=true`, the API documentation is at `/docs`.

**Everything is deterministic.** At each start the database is rebuilt and seeded from a fixed seed (500 products `SKU-00001` to `SKU-00500`, 64 KiB images). The fake APIs answer from a formula and wait a fixed time set in the configuration. Orders, files and notes are stored under a key computed from their content, so the database does not grow during a benchmark.

## Benchmark the frameworks

One framework at a time, in two terminals:

```bash
make run_litestar        # terminal 1: the shop, served by Litestar
```

```bash
make benchmark           # terminal 2: about 10 minutes with the default control panel
```

Stop the shop (Ctrl-C), then do the same with `make run_fastapi` and `make run_blacksheep`. When every framework has run:

```bash
make benchmark_report
```

`make run_<framework>` starts every framework with the same Granian settings: one worker, one runtime thread, uvloop, no access log, `WARNING` logs, on `127.0.0.1:8765` (`PORT=…` to change it, and `BASE_URL=…` for the benchmark).

What `make benchmark` does:

1. Asks `/v1/about` which framework is running: the report is named after it, so you cannot mislabel a run.
2. **Preflight**: calls every endpoint once and checks its status, media type and body. Nothing is measured if one answers wrongly.
3. For each load profile and each endpoint: a warm-up, then the measured run with oha, while the server's CPU and memory are sampled.
4. Writes `reports/benchmark/<framework>/<start time>.json` and `.md`.

Useful variables: `DURATION=5` and `WARMUP=1` (seconds, every profile), `CONNECTIONS=128`, `ENDPOINTS=get_json,post_stream`, `PROFILES=throughput`, `OUTPUT_DIR=…`, `DRY_RUN=1` (print the plan only). `make benchmark_quick` is a 3-second run of everything, to check the setup.

## The control panel

`src/shop_benchmark/control_panel.json` (`BENCH_PANEL=…` for another one):

| Key | Meaning |
|---|---|
| `target.base_url` | Where the shop answers |
| `load.profiles` | The load every endpoint receives. Without `rate_per_second`: as many requests as `connections` allow, for `duration_seconds` (**throughput**). With it: exactly that rate, latency corrected for requests that had to wait (**fixed rate**) |
| `load.warmup_seconds`, `load.pause_seconds` | Warm-up before each measured run, pause after it |
| `workload` | What requests carry: the product, the order size, the upload size, the note length |
| `probe` | CPU and memory sampling of the server process (local targets only) |
| `endpoints` | Which endpoints to run; empty runs all |
| `output_dir` | Where reports go |

## Keep the comparison fair

- Run every framework on the same machine, with the same control panel, and close what else uses the CPU.
- The load generator runs on the same machine and uses CPU too: the absolute numbers belong to that machine.
- Run each framework more than once; differences under about 5 % are noise.
- The final report says if the frameworks did not all return the same answers: then they did not do the same work.

---

## Why it works
- [[Web framework benchmark design]] · [[Benchmarking web services]]
