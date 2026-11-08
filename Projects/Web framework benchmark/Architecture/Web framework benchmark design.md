---
type: architecture
project: "[[Web framework benchmark]]"
order: 1
tags: [web-framework, architecture, performance]
updated: 2026-11-08
---

# Web framework benchmark design

> Two programs. **The shop** is hexagonal: domain and use cases know no framework; each framework is wired at the edge with its own native routes and schemas, built with pycraftcore's toolkit. **The benchmark** only talks HTTP: it checks every endpoint answers correctly, then loads each with oha while sampling the server's CPU and memory, and writes reports.

Back: [[Web framework benchmark]]

**Do it:** [[Web framework benchmark - Run a benchmark]]

## The shop
| Endpoint | Work per request |
|---|---|
| `GET /v1/products/{sku}` | product from SQLite; stock and tax from two fake APIs **in parallel**; price with tax |
| `POST /v1/orders` | validate, read products, quote from the pricing API, totals, store |
| `GET /v1/products/{sku}/events` | SSE: price and stock ticks paced by a fake market |
| `POST /v1/orders/track` | SSE: order stages through to stored |
| plus binary and text GET/POST | images, uploads, notes |
Fake APIs have a fixed latency and answer from a formula — deterministic, so every framework does the same work.

```text
oha ─► Granian ─► Litestar (pycraftcore.web_litestar) ─► router (msgspec) ─► GetProduct.handle
                                                             ├─ SqliteProductRepository   SQLite
                                                             ├─ FakeInventoryApi.stock ┐ in parallel
                                                             └─ FakePricingApi.quote   ┘
```

## The benchmark
1. Ask `/v1/about` which framework runs — reports are named after it; no mislabelled runs.
2. **Preflight:** call every endpoint once, check status, media type and body. Nothing is measured if one is wrong.
3. Per load profile and endpoint: **warm-up**, then the measured oha run, CPU/memory sampled.
4. Reports per framework; `make benchmark_report` compares the latest of each.
Profiles: **throughput** (as fast as N connections allow → requests/s) and **fixed rate** (a set rate → latency, corrected for queued requests).

## What keeps it fair
- Same machine, server settings (Granian: 1 worker, 1 thread, uvloop, no access log), data, load.
- **Contract tests** start each framework's real app and require identical bytes, media types and errors.
- **Architecture tests:** the shop imports no web framework; each framework folder imports only its own; the benchmark never imports the shop.
- The scoring: geometric mean over endpoints of each framework's ratio to the best (100 = best everywhere); differences under ~5 % are noise ([[Benchmarking web services]]).

## Check yourself
1. Why do fake APIs answer with a fixed latency and a formula?
2. Why can throughput rank frameworks very differently from p99 at a fixed rate?
3. The load generator runs on the same machine. What does that mean for the numbers?

## Go further
- [oha](https://github.com/hatoo/oha) · [Granian](https://github.com/emmett-framework/granian).
- [Gil Tene: How NOT to measure latency (video)](https://www.youtube.com/watch?v=lJ8ydIuPFeU) — coordinated omission.
