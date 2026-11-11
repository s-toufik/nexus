---
type: path
track: Platform
time: ~8 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Seeing inside

> **Goal:** answer "what is the system doing, and why?" with metrics, logs and traces — and pivot between them.
> **Time:** ~8 h.
> **Before:** [[Path - Containers and Kubernetes]]. **Then:** [[Project - Ship and investigate]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Three signals | Prometheus (metrics), Loki (logs), Tempo (traces) |
| One protocol for apps | OTLP to the OTel Collector; `OTEL_*` env in agent-runtime, agent-toolbox |
| An agent for what apps don't send | Alloy: host metrics, cAdvisor, pod logs |
| Discovery, not target lists | Prometheus' `kubernetes_sd_configs` + `prometheus.io/*` annotations |
| Correlation | `trace_id` in logs, exemplars, the request id in every log line |
| Dashboards as code | `observability/grafana/dashboards/*.json` |

## Warm-up (optional, from the paths before)
1. Which signal answers "how many requests failed in the last hour", and which "why did this one fail"?
> [!success]- Answer
> A metric (an error rate); a log line or trace of that request.

## 1. Three signals · ~1 h

### Learn
**Definitions**
- **Metric** — a number over time, `name{labels} value` ([[Prometheus and PromQL]]).
- **Log** — a timestamped line describing one event ([[Loki and LogQL]]).
- **Trace** — a tree of **spans** (timed operations) for one request, linked by a **trace id** ([[Distributed tracing and Tempo]]).
- **Cardinality** — the number of distinct label combinations; each is a separate series or stream.
- **Golden signals** — latency, traffic, errors, saturation ([[Observability]]).

**How it works**
```text
apps ── OTLP ──► otel-collector ─┬─ traces ─► Tempo ── span metrics ─► Prometheus
                                 ├─ metrics ► Prometheus
                                 └─ logs ───► Loki
Alloy ── host + cAdvisor metrics ─► Prometheus;  every pod's stdout ─► Loki
Grafana / homelab-ui ─► all three, linked
```

**Example from our projects** — what makes a pod scraped: the chart's `metrics:` becomes annotations Prometheus discovers (`prometheus.yml`, excerpt):
```yaml
- job_name: pods
  kubernetes_sd_configs:
    - role: pod
      namespaces: { names: [homelab] }
  relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      regex: "true"
      action: keep
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      regex: '([^:]+)(?::\d+)?;(\d+)'
      replacement: "$1:$2"
      target_label: __address__
```
1. Prometheus lists pods in `homelab` from the Kubernetes API.
2. `keep` only those annotated `prometheus.io/scrape: "true"`.
3. Rewrite the address to the pod IP + the annotated port. No list of targets to maintain.

**Common mistake** — a user id as a metric label: millions of series.

### Check
1. Name the four golden signals and one metric for each here.
> [!success]- Answer
> Latency (Tempo's span-duration histograms), traffic (requests per second), errors (5xx or failed spans), saturation (container memory vs limit, CPU, disk).

## 2. Metrics and PromQL · ~2 h

### Learn
**Definitions**
- **Counter / gauge / histogram** — only goes up / goes up and down / counts values into buckets.
- **`rate(x[5m])`** — per-second increase of a counter over 5 minutes, handling restarts.
- **Aggregation** — `sum by (label) (…)`.
- **`histogram_quantile(0.95, …)`** — the 95th-percentile from histogram buckets.

**How it works** — Prometheus stores samples every 15 s; PromQL selects series by labels and computes over time windows.

**Example from our projects** — queries you'll use, and what they mean:
```promql
up == 0
sum by (container) (container_memory_working_set_bytes{namespace="homelab", container!=""})
rate(container_cpu_usage_seconds_total{namespace="homelab", container="caddy"}[5m])
changes(container_start_time_seconds{namespace="homelab"}[24h])
```
1. targets that failed their last scrape;
2. memory per container (cAdvisor, via Alloy);
3. Caddy's CPU in cores;
4. how many times each container started in 24 h — restarts.

**Common mistake** — graphing a raw counter: it only says "total since start" and drops at every restart.

### Do
homelab-ui's **Metrics** page: run the four queries; `make targets`.

## 3. Logs and LogQL · ~1.5 h

### Learn
**Definitions**
- **Stream** — the lines sharing one label set; Loki indexes labels only.
- **Filter** — `|= "text"`, `!=`, `|~ "regex"`; **parser** — `| json`, `| logfmt`.

**Example from our projects** — how Alloy labels pod logs (`observability/alloy/config.alloy`, excerpt):
```text
rule {
  source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"]
  target_label  = "service_name"
}
```
So `{service_name="caddy"} |= "error"` works for every app — and pods annotated `homelab.io/logs: otlp` are skipped, because they already send logs over OTLP.

**Common mistake** — a query over all streams for 30 days with a regex: Loki must read every chunk.

### Do
**Logs** page: `{service_name="caddy"} |= "error"`; `sum by (service_name) (count_over_time({namespace="homelab"} |= "error" [1h]))`.

## 4. Traces and the pivot · ~2 h

### Learn
**Definitions**
- **Span** — name, start, duration, attributes, parent; **context propagation** — the `traceparent` header carrying the trace id between services.
- **Exemplar** — a trace id attached to a metric sample: click a latency spike, open the trace.
- **Request id** — our `X-Request-ID`, in the third column of every log line of every service.

**Example from our projects** — a log line from agent-runtime, with the request id in the third column:
```text
2026-09-27 10:47:52.310 | INFO     | my-conversation | handle_message:handle:42 - turn finished: answered, 1/20 steps in 4.5s
```

**Example from our projects** — where the trace context comes from in agent-runtime (`agent_node.py`): every step opens a span, so the model call and the tool calls made during that step become its children:
```python
async def __call__(self, state: GraphState) -> GraphState:
    conversation, turn = self._codec.decode(state)
    with _tracer.start_as_current_span(f"agent {self.name}") as span:
        span.set_attribute("agent.step", self.name)
        await self._events.publish(TurnEvent.entering(self.step, turn))
        await self.work(conversation, turn)
    return self._codec.encode(conversation, turn)
```
The parent is the request's server span; the MCP SDK then puts the current span's context in each tool call's `_meta.traceparent`, and the toolbox continues it. Before this, the agent opened no span: every tool call and every model call was its own trace ([[Homelab UI page - Traces]]).

**Common mistake** — searching three tools separately. Start from the symptom (metric), jump to an example (trace), then the detail (log). And a second one: believing propagation is "automatic". Libraries carry the *current* span — if your code never opens one, there is nothing to carry.

### Do
1. Agent page (auto-approve on): ask for something that needs a tool.
2. **Traces** page: that request's agent-runtime trace; its slowest span.
3. Grafana Explore → Loki: a line with `trace_id` → the same trace.
4. 👀 `make logs R=agent-toolbox` → the toolbox's lines carry the same request id.

### Check
1. How do you tie the agent's and the toolbox's records of one request together?
> [!success]- Answer
> By the trace: the agent's step spans are open during the call, the MCP SDK sends their context in `_meta.traceparent`, and the toolbox's `tools/call` span joins the agent's trace. Also by the request id: the agent sends `X-Request-ID` on its MCP calls and both services print it in every log line (and as a telemetry attribute).

**Milestone:** given "the agent was slow at 10:00", you can find the slow step in under 5 minutes. Deep dive: [[Homelab observability]].
