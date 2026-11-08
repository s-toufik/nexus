---
type: concept
domain: Testing
level: intermediate
tags: [concept, testing, performance]
updated: 2026-11-08
---

# Benchmarking web services

> Measuring how a service performs under a controlled load: how many requests per second it sustains (**throughput**) and how long requests take (**latency**, as percentiles), on known hardware, with a fair, repeatable method.

## Why it matters
Performance opinions are cheap and often wrong. A careful benchmark answers a specific question ("which framework, for this workload?") — and a sloppy one answers the wrong question confidently.

## How it works
- **Closed-loop / throughput:** N connections send as fast as they can → max requests/s.
- **Open-loop / fixed rate:** requests arrive at a set rate regardless of responses → realistic latency. Closed loops hide queueing (**coordinated omission**); fixed-rate tools correct for it.
- **Percentiles:** p50 (typical), p90, p99 (the slow tail users notice), max. Averages hide tails.
- **Warm-up** (JITs, caches, pools), several runs, noise (< ~5 % often meaningless).
- **Same work:** verify every candidate returns the same output, or you're comparing different jobs.
- **Measure the server** (CPU, memory) and know the load generator competes for the same CPU if it's on the same machine.

## In our projects
[[Web framework benchmark]]: oha, throughput and fixed-rate profiles, warm-up, preflight, identical bytes checked, a geometric-mean score. Result: big differences at saturation, almost none at a realistic rate.

## Check yourself
1. Why can a framework win throughput and lose p99 at a fixed rate?
2. What is coordinated omission?

## Go further
- [Gil Tene: How NOT to measure latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU).
- [Brendan Gregg: active benchmarking](https://www.brendangregg.com/activebenchmarking.html).
