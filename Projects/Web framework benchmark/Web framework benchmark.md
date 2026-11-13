---
type: project
status: done
started: 2026-10
repos: [web_framework_benchmark]
tags: [project, web-framework, python, performance]
updated: 2026-11-08
---

# Web framework benchmark

> One small shop service served by **FastAPI**, **Litestar** or **BlackSheep**, and a benchmark that loads each one exactly the same way and compares them. The shop does real work per request — SQLite, parallel calls to fake APIs, prices, streams — so the result reflects a realistic service, not "hello world".

## In one picture
![[Web framework benchmark.canvas]]

## Why it exists
- **To choose a framework on evidence.** pycraftcore supports three; which is fastest, and does it matter?
- **To learn measurement.** Throughput vs latency, percentiles, warm-up, noise, fairness — skills that apply to any performance question.

## The result (2026-10-27, Apple M5 Pro, Granian 1 worker, oha)
| Framework | Throughput score | Fixed-rate score | Peak memory |
|---|---:|---:|---:|
| BlackSheep 2.6.4 | **100.0** (won 8/8) | 93.2 | 215 MB |
| Litestar 2.25.0 | 88.3 | 93.6 (won 5) | 235 MB |
| FastAPI 0.162.0 | 74.4 | **95.0** | 234 MB |
- **Under maximum load**, BlackSheep is fastest everywhere; FastAPI is 20–35 % behind on most endpoints.
- **At a fixed, realistic rate**, all three are within a few percent on p99 latency: the framework barely matters once the server isn't saturated — the database and API calls dominate.
- Every framework returned the same bytes for every endpoint: the comparison is fair.
Lesson: pick a framework for its developer experience and ecosystem unless you're CPU-bound at the edge. agent-runtime used Litestar (msgspec, DI, speed close to the top), then moved to FastAPI in November 2026 for the official A2A SDK, which mounts on it.

## Read it
1. [[Web framework benchmark design]] — the shop, the benchmark, and what keeps it fair.
Then [[Web framework benchmark decisions]] and [[Web framework benchmark guides]].

## Knowledge it uses
[[Benchmarking web services]] · [[Python web frameworks]] · [[ASGI]] · [[Server-sent events]] · [[Hexagonal architecture]] · [[Architecture tests]] · [[pycraftcore]] · [[asyncio]]
