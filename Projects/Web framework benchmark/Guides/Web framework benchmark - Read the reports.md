---
type: guide
project: "[[Web framework benchmark]]"
tags: [guide, web-framework]
updated: 2026-11-08
---

# Web framework benchmark - Read the reports

> What each report holds and how the scores are computed.

**Where:** on your Mac, in `web_framework` · **All guides:** [[Web framework benchmark guides]]

**Per framework** (`reports/benchmark/<framework>/<time>.md`): the service, server, machine and load; then for each profile a table per endpoint with requests per second, p50 / p90 / p99 / max latency, time to first byte, MB/s, failures, server CPU and memory; then the preflight answers. The `.json` holds the same data.

**Comparison** (`reports/benchmark/final_<time>.md`), built from the latest run of each framework:

- **Summary**: a score per framework and profile (100 = best on every endpoint), the number of endpoints each framework won, its peak memory.
- **Same work everywhere**: confirms every framework returned the same bytes for every endpoint.
- **Per profile**: requests per second (throughput) or p99 latency (fixed rate) per endpoint and framework, the best in bold, how far behind the others are.
- **Server resources** and **how to read** the numbers.

`final_<time>.json` concatenates the runs of every framework with the computed comparison.

## Why it works
- [[Benchmarking web services]] — percentiles, throughput vs fixed rate.
