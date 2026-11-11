---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Traces

> **Route** `/traces` · **for** everyone · **reads** Tempo (`/api/tempo/…`) · **code** `src/app/features/tempo/`
> Find one request and see where its time went, span by span.

![[Homelab UI - Traces.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Filters | Service, operation contains, longer than (ms). |
| 2 | TraceQL | Or a query in Tempo's language: `{ status = error }`, `{ duration > 5s }` ([[Distributed tracing and Tempo]]). |
| 3 | Time · Search | The window and the button. |
| 4 | Traces | One row per trace: the root's service and operation, when, a bar for its duration, the duration. |
| 5 | Selected | The trace opened on the right. |
| 6 | Waterfall | Each span as a bar on the trace's timeline; children are indented under their parent. |
| 7 | Header | Trace id · how many spans · total time. |
| 8 | Close | Close the trace. |

## Use it to
Answer *why was that slow?* — the widest bar under the root is where the time went: the model call, a tool, the database.

## How it works
Services send spans with OpenTelemetry to the OTel Collector, which writes them to Tempo ([[Distributed tracing and Tempo]]); the page uses Tempo's search and trace-by-id APIs ([[Homelab observability]]). A trace links spans only when each service passes the `traceparent` header to the next ([[OpenTelemetry]]).

## What the real homelab showed (2026-11-11)
The agent's requests are traces of **one span** each (`agent-runtime-service http.request`, from 0.3 s for a model list to 20–35 s for an answer), and the toolbox's calls (`toolbox-service tools/list`, `tools/call …`) are **separate traces** at the same seconds. So today a trace tells you a request took 24 s, but not which step: the agent's steps aren't child spans, and the trace context isn't carried into the MCP calls. Here is what a full trace looks like (sample data):

![[Homelab UI - traces sample.webp]]

That gap is a good exercise: add spans per step in agent-runtime and propagate `traceparent` over MCP ([[Path - Seeing inside]]).

> [!question]- Check: two spans happen at the same second in two services but are in different traces. What's missing?
> Context propagation: the caller didn't send its trace id (`traceparent`) with the request, so the callee started a new trace.

Back to [[Homelab UI pages]].
