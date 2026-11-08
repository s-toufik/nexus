---
type: architecture
project: "[[Homelab]]"
order: 5
tags: [homelab, architecture, observability]
updated: 2026-11-08
---

# Homelab observability

> Three kinds of signal — metrics, logs, traces — each with its own store (Prometheus, Loki, Tempo), two collectors feeding them (OTel Collector for your apps, Alloy for the server and every pod), and Grafana showing all three linked.

Previous: [[Homelab data]] · Next: [[Homelab LLM and agent]]

**Do it:** [[Homelab - Use observability]] · [[Homelab - Check the homelab]]

Start with [[Observability]] if "metric, log, trace" isn't yet clear.

## The pipeline
```text
YOUR APPS (agent-runtime, agent-toolbox, …)            THE SERVER AND EVERY POD
  OTLP (gRPC :4317 / HTTP :4318)                          Alloy
        │                                                  ├─ host metrics (/proc, /sys)   ─┐
        ▼                                                  ├─ cAdvisor: every container's   │ remote_write
  otel-collector                                           │  CPU, memory, network          ├──────► Prometheus
   memory_limiter → resource → batch                       └─ every pod's stdout logs ──────┼──────► Loki
        ├─ traces ──► Tempo ── span metrics, service graph ─────────────────────────────────┘
        ├─ metrics ─► Prometheus (/api/v1/otlp)            Prometheus also SCRAPES pods annotated
        └─ logs ────► Loki (/otlp)                         prometheus.io/scrape, and the LLM per model

                         Grafana ── Prometheus · Loki · Tempo, linked by trace_id and exemplars
```

## Each piece, and why it's there
| Piece | Kind | Why |
|---|---|---|
| **[[Prometheus and PromQL\|Prometheus]]** | Metrics database | Numbers over time: CPU, request rates, `cnpg_collector_up`. 30 days / 50 GB. Receives pushes (remote write, OTLP) *and* scrapes. |
| **[[Loki and LogQL\|Loki]]** | Log database | Indexes only labels (`namespace`, `pod`, `service_name`), not the text: cheap. 30 days. |
| **[[Distributed tracing and Tempo\|Tempo]]** | Trace database | One trace = one request across services. 7 days. Also *generates* metrics from spans (rate, errors, duration per service) and a service graph. |
| **[[OpenTelemetry\|OTel Collector]]** | Receiver / router | Your apps speak one protocol, OTLP; the collector batches, protects itself (`memory_limiter`), tags (`deployment.environment=homelab`) and fans out. Apps don't know where data ends up. |
| **[[Grafana Alloy\|Alloy]]** | Agent on the node | Collects what apps don't send themselves: the server's metrics, every container's metrics, every pod's logs. Runs with `hostNetwork` and a service account allowed to read nodes and pods. |
| **kafka-exporter, mongodb-exporter** | Exporters | Translate Kafka's and MongoDB's internals into Prometheus metrics. PostgreSQL has one built into CloudNativePG (port 9187). |
| **llm-sd** | Tiny Python service | Tells Prometheus which LLM models are loaded right now ([[Homelab LLM and agent]]). |
| **[[Grafana]]** | UI | Dashboards (as JSON files in git), Explore, and the links between signals. |

## How a pod gets scraped
The `app` chart's `metrics: { port, path }` adds the annotations `prometheus.io/scrape: "true"`, `prometheus.io/port`, `prometheus.io/path` to the pod. Prometheus' `pods` job uses **Kubernetes service discovery**: it lists pods in `homelab`, keeps the annotated, Running ones, and rewrites the address to the annotated port. Labels `job` (from `app.kubernetes.io/name`), `namespace`, `pod` are added by relabelling. No list of targets to maintain by hand.

## How the three signals link
- **Log → trace**: Loki's *derived field* finds `trace_id=…` in a log line and makes it a link to Tempo.
- **Trace → logs / metrics**: Tempo's data source links a span to the logs and metrics of the same service and time.
- **Metric → trace**: *exemplars* — a sample trace ID attached to a histogram bucket. On a latency spike in a graph, click the dot, open the slow trace.

That's the senior skill here: you don't search three tools, you *pivot* from symptom (metric) to example (trace) to detail (log).

## Instrumenting a new app
Set two variables and the app's telemetry appears:
```yaml
env:
  OTEL_SERVICE_NAME: myapi
  OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
```
Its stdout logs are collected anyway by Alloy. Pods annotated `homelab.io/logs: otlp` are skipped by Alloy, because they already send logs through OTLP — otherwise every line would be stored twice.

## Edge cases
- **Out-of-order samples**: pushes can arrive late; Prometheus accepts samples up to 30 min old (`out_of_order_time_window`).
- **Scraping keeps a model awake**: llama-swap unloads a model after `ttl` seconds idle, but a scrape counts as activity. llm-sd lists an on-demand model only during its first `ttl` seconds. A monitoring system that changes what it monitors — a classic trap.
- **High cardinality kills Prometheus**: a label with unbounded values (user ID, request ID) creates a new time series per value. Put those in logs or traces, never in metric labels.
- **Alloy listens on the node address `10.250.0.1:12346`**, not on every address: with `hostNetwork` it would otherwise be reachable from the LAN.
- **A target is down** in `make targets`: usually the pod's `metrics.port` isn't the port its metrics are on.

## Check yourself
1. Your API is slow since 10:00. Which signal do you open first, and how do you get to a log line of one slow request?
2. Why does Loki index labels but not the log text? What does that cost you when searching?
3. Why do apps send to the OTel Collector instead of straight to Tempo/Prometheus/Loki?
4. You add `user_id` as a label on a request counter. What happens after a month?

## Go further
- [OpenTelemetry: observability primer](https://opentelemetry.io/docs/concepts/observability-primer/).
- [Google SRE book: monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/) — the four golden signals.
- [Prometheus: configuration, kubernetes_sd_config](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config).
- [Grafana: exemplars](https://grafana.com/docs/grafana/latest/fundamentals/exemplars/).
