---
type: concept
domain: Observability
level: intermediate
tags: [concept, observability, tracing]
updated: 2026-11-08
---

# Distributed tracing and Tempo

> A **trace** follows one request through every service it touches; each step is a **span** (name, start, duration, attributes, parent). The trace ID travels in request headers so every service adds its spans to the same tree. **Tempo** stores traces and finds them by ID or search.

## Why it matters
In a system of several services, "it's slow" has no single log to read. A trace shows the whole path — UI → API → agent → LLM → tool — with the time each took. It's how you find the one slow hop.

## How it works
- **Context propagation**: the W3C `traceparent` header carries trace ID + parent span ID across HTTP calls; libraries do it automatically — but only for the span that is *current*: code that never opens a span has nothing to propagate. Over MCP, the context travels in the JSON-RPC request's `_meta` (`traceparent`, `tracestate`), not in a header.
- **Span**: `service.name`, operation, start/end, status, attributes (`http.route`, `db.statement`), events.
- **Sampling**: keep all, a percentage, or decide at the end (tail sampling: keep errors and slow ones).
- **Tempo**: stores traces by ID in object storage or disk; TraceQL search; **metrics generator** turns spans into RED metrics and a service graph.
- **Exemplars** link metric points to example trace IDs.

## In our projects
- Apps send OTLP to the collector → Tempo ([[Homelab observability]]); 7 days.
- Tempo's metrics generator: span metrics and service graphs written to Prometheus, with exemplars.
- Grafana: trace → logs and metrics of the same service; homelab-ui's Traces page shows the span tree.

## Check yourself
1. How does service B know which trace a request from service A belongs to?
> [!success]- Answer
> From the `traceparent` header A sends with the request (over MCP, from `_meta` in the JSON-RPC request): it carries the trace ID and A's current span ID. B's tracing library reads it and makes its spans children of that span, in the same trace.
2. What do span metrics give you that hand-written metrics don't?
> [!success]- Answer
> Rate, errors and duration for every service and operation, with no code to write: they're computed from spans the apps already send, with consistent labels, a service graph of who calls whom, and exemplars linking a point to an example trace.

## Go further
- [OpenTelemetry: traces](https://opentelemetry.io/docs/concepts/signals/traces/), [W3C Trace Context](https://www.w3.org/TR/trace-context/).
- [Tempo docs](https://grafana.com/docs/tempo/latest/), [TraceQL](https://grafana.com/docs/tempo/latest/traceql/).
