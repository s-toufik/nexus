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
The agent's requests are traces of **one span** each (`agent-runtime-service http.request`, from 0.3 s for a model list to 20–35 s for an answer), and the toolbox's calls (`toolbox-service tools/list`, `tools/call …`) are **separate traces** at the same seconds. So a trace told you a request took 24 s, but not which step.

**Why.** `http.request` is not the request the agent *received*: it's the agent's call *to the model*, traced by pycraftcore's resilient HTTP client. agent-runtime opened no span of its own — none for the request, none per step. The MCP SDK does carry the trace into tool calls (in the JSON-RPC request's `_meta`), but with no span open in the agent there was no trace worth carrying: each call started its own. And each MCP session's `notifications/initialized` made a one-span trace in the toolbox.

### Fixed since (in the repositories; live after the next deploy)
- agent-runtime: a server span per request (the OpenTelemetry FastAPI instrumentation, `fastapi_api.py`), which continues a caller's `traceparent`; one span per step (`AgentNode.__call__` in `adapter/outbound/langgraph/node/agent_node.py`). Health checks aren't traced, and the stream's thousands of `send` events aren't spans.
- agent-toolbox: notifications get no span (`RequestSpans` in `adapter/inbound/mcp/request_spans.py`).

One message is now one trace:
```text
agent-runtime-service  POST /v1/stream                 24.1 s
  agent-runtime-service  agent understand               1.9 s
    agent-runtime-service  http.request                 1.9 s   (the model)
  agent-runtime-service  agent plan                     3.2 s
  agent-runtime-service  agent run_tools                0.4 s
    agent-runtime-service  MCP send tools/call python_executor
      toolbox-service        tools/call python_executor 0.4 s
  agent-runtime-service  agent act                     17.8 s   ← the slow step
  …
```
(times illustrative). Here is what such a waterfall looks like on the page (sample data):

![[Homelab UI - traces sample.webp]]

> [!question]- Check: two spans happen at the same second in two services but are in different traces. What's missing?
> Context propagation: the caller didn't send its trace context with the request — the `traceparent` header over HTTP, `_meta.traceparent` over MCP — or had no span open to send, so the callee started a new trace.

Back to [[Homelab UI pages]].
