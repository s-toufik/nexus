---
type: concept
domain: Observability
level: intermediate
tags: [concept, observability]
updated: 2026-11-08
---

# OpenTelemetry

> A vendor-neutral standard for telemetry: APIs and SDKs to produce traces, metrics and logs in any language, a protocol to send them (**OTLP**), and a **Collector** that receives, processes and exports them anywhere.

## Why it matters
Before OTel, each backend had its own agent and library; switching meant re-instrumenting. Now you instrument once, and decide where data goes in config. It's the industry standard — worth learning properly.

## How it works
- **SDKs** + **auto-instrumentation** (HTTP servers, clients, DB drivers) create spans and metrics.
- **Resource attributes** describe the source: `service.name`, `service.version`, `deployment.environment`.
- **Configuration by env**: `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`…
- **OTLP** over gRPC (4317) or HTTP (4318).
- **Collector** pipelines: **receivers** (otlp) → **processors** (`memory_limiter`, `batch`, `resource`, filtering, sampling) → **exporters** (Tempo, Prometheus, Loki, vendors).

## In our projects
`observability/otel-collector/config.yml`: one OTLP receiver; processors `memory_limiter` (400 MiB), `resource` (`deployment.environment=homelab`), `batch`; three pipelines exporting traces to Tempo, metrics to Prometheus' OTLP endpoint, logs to Loki's ([[Homelab observability]]). Apps need only the two env variables. Checked by `otelcol validate` in `make validate`.

## Check yourself
1. Why put `memory_limiter` first in every pipeline?
2. What changes in your app if you move from Tempo to another tracing backend?

## Go further
- [OpenTelemetry docs](https://opentelemetry.io/docs/), [Collector](https://opentelemetry.io/docs/collector/), [semantic conventions](https://opentelemetry.io/docs/specs/semconv/).
