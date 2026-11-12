---
type: concept
domain: Observability
level: beginner
tags: [concept, observability]
updated: 2026-11-08
---

# Observability

> Being able to answer "what is the system doing, and why?" from the outside, using the signals it emits: **metrics** (numbers over time), **logs** (events in words), **traces** (one request's path through every service).

## Why it matters
You can't fix what you can't see, and you can't predict every question in advance. Monitoring tells you *that* something is wrong; observability lets you find out *why* — including for failures nobody imagined.

## How it works
| Signal | Shape | Good for | Cost driver |
|---|---|---|---|
| Metrics | `name{labels} value @time` | Trends, alerts, dashboards: "error rate 5 %" | Number of label combinations (cardinality) |
| Logs | Timestamped text/JSON lines | Details of one event: the error message | Volume |
| Traces | Tree of **spans** with timings, sharing a **trace ID** | Where a slow or failed request spent its time, across services | Volume (often sampled) |

- **Correlation** is the superpower: a trace ID in a log line, an exemplar on a metric, the same `service_name` label everywhere.
- **Methods**: the four golden signals (latency, traffic, errors, saturation); **RED** for services (rate, errors, duration); **USE** for resources (utilisation, saturation, errors).
- **SLI / SLO**: a measured indicator and a target ("99 % of requests under 300 ms").

## In our projects
Prometheus (metrics), Loki (logs), Tempo (traces), fed by the OTel Collector and Alloy, shown in Grafana — the whole pipeline in [[Homelab observability]]. Notes: [[Prometheus and PromQL]], [[Loki and LogQL]], [[Distributed tracing and Tempo]], [[OpenTelemetry]], [[Grafana Alloy]], [[Grafana]].

## Check yourself
1. Give one question each signal answers best.
> [!success]- Answer
> Metrics: is the error rate rising, and since when? Logs: what exactly did this failing request say? Traces: where did this slow request spend its time, across the services it crossed?
2. What are the RED metrics of agent-runtime, and where would you find them?
> [!success]- Answer
> Rate (requests per second), errors (failed requests) and duration (latency) of its HTTP routes. Tempo's metrics generator computes them from its spans, as `traces_spanmetrics_calls_total` and `traces_spanmetrics_latency_bucket` in Prometheus for `service="agent-runtime"`; query them in Grafana or homelab-ui's Metrics page.

## Go further
- [OpenTelemetry: observability primer](https://opentelemetry.io/docs/concepts/observability-primer/).
- [Google SRE book: monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/).
- [The RED method](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/), [the USE method](https://www.brendangregg.com/usemethod.html).
