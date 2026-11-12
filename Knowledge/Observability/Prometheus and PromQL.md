---
type: concept
domain: Observability
level: intermediate
tags: [concept, observability, metrics]
updated: 2026-11-08
---

# Prometheus and PromQL

> Prometheus is a time-series database that **scrapes** metrics from targets over HTTP every few seconds and stores them as series identified by a name and labels. **PromQL** is its query language.

## Why it matters
It's the de-facto standard for metrics in the Kubernetes world: every serious component exposes `/metrics` in its format. PromQL is a skill you'll use in every job with infrastructure.

## How it works
- **Exposition format**: `http_requests_total{method="GET",code="200"} 1027`.
- **Types**: counter (only goes up), gauge (up and down), histogram (buckets of durations), summary.
- **Pull**: Prometheus scrapes targets found by **service discovery** (Kubernetes pods, HTTP SD…), with **relabelling** to shape labels. Also accepts pushes: remote write, OTLP.
- **PromQL essentials**:
  - `rate(http_requests_total[5m])` — per-second rate of a counter;
  - `sum by (service) (…)` — aggregate;
  - `histogram_quantile(0.95, sum by (le) (rate(x_bucket[5m])))` — p95 latency;
  - `up == 0` — targets down.
- **Recording and alerting rules**; **TSDB** with retention by time and size.
- **Cardinality**: each unique label set is a series; unbounded labels explode memory.

## In our projects
- Scrapes pods annotated `prometheus.io/scrape` (the chart's `metrics:`), itself, and the LLM per model via `llm-sd`'s HTTP service discovery ([[Homelab observability]]).
- Receives Alloy's remote write (host + cAdvisor metrics) and the OTel Collector's OTLP; promotes `service.name` etc. to labels.
- 30 days / 50 GB; `:9090` UI; homelab-ui's Metrics page and Status page query `/api/prometheus/api/v1/query`.
- Useful series: `cnpg_collector_up`, `mongodb_up`, `kafka_brokers`, `container_memory_working_set_bytes`.

## Check yourself
1. Why `rate()` on a counter rather than the raw value?
> [!success]- Answer
> A counter only goes up, so its raw value is a total since the process started, and drops to 0 on a restart. `rate()` gives the per-second speed over a window and handles those resets.
2. Write the query: memory per container in namespace `homelab`.
> [!success]- Answer
> `sum by (pod, container) (container_memory_working_set_bytes{namespace="homelab", container!=""})` (the `container!=""` drops the pod-level total series).
3. What makes a label "high cardinality"?
> [!success]- Answer
> A label whose values are unbounded or very many: user ids, request ids, full URLs, timestamps. Each distinct value creates a new series, so memory and query time explode.

## Go further
- [Prometheus overview](https://prometheus.io/docs/introduction/overview/), [querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/), [metric naming](https://prometheus.io/docs/practices/naming/).
- [PromLabs: PromQL cheat sheet](https://promlabs.com/promql-cheat-sheet/).
