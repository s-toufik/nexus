---
type: path
level: 2
module: 7
time: ~7 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]"]
tags: [path, journey]
updated: 2026-11-10
---

# Module 07 - Seeing inside

> **Goal:** answer "what is the system doing, and why?" with metrics, logs and traces — and pivot between them.
> **Time:** ~7 h. Previous: [[Module 06 - Data]] · Next: [[Capstone 2 - Ship and investigate]]

## Warm-up
1. Which signal answers "how many requests failed in the last hour", and which "why did this one fail"?
> [!success]- Answer
> A metric (a rate of errors); a log line or trace of that request.

## 7.1 Three signals · ~1 h
**Read:** [[Observability]] · [[Homelab observability]] · source: [[Site Reliability Engineering]] (*Monitoring distributed systems*)

**Check:**
1. Name the four golden signals and one metric for each on the homelab.
> [!success]- Answer
> Latency (request duration histograms, e.g. Tempo's span metrics), traffic (requests per second), errors (5xx rate, failed spans), saturation (container memory vs limit, CPU, disk fill).

## 7.2 Metrics and PromQL · ~2 h
**Read:** [[Prometheus and PromQL]]

**Do** (homelab-ui's **Metrics** page, or Grafana Explore):
1. `up == 0` → targets down (ideally none).
2. `sum by (container) (container_memory_working_set_bytes{namespace="homelab", container!=""})` → memory per container.
3. `rate(container_cpu_usage_seconds_total{namespace="homelab", container="caddy"}[5m])` → Caddy's CPU in cores.
4. 👀 `make targets` → what Prometheus scrapes, and how (`prometheus.io/scrape` annotations).

**Check:**
1. Why `rate()` and not the raw counter?
> [!success]- Answer
> A counter only grows (and resets on restart); its raw value says "total since start". `rate()` gives the per-second increase over a window, which is what you compare and alert on, and it handles resets.

## 7.3 Logs and LogQL · ~1.5 h
**Read:** [[Loki and LogQL]] · [[Grafana Alloy]]

**Do** (homelab-ui **Logs** page):
1. `{service_name="caddy"} |= "error"`.
2. `sum by (service_name) (count_over_time({namespace="homelab"} |= "error" [1h]))` → error lines per service.

**Check:**
1. Why is `user_id` a bad Loki label?
> [!success]- Answer
> Each label combination is a stream; unbounded values create huge numbers of tiny streams, which kills Loki's index and performance. Put it in the log line and filter with `|=` or a parser.

## 7.4 Traces and the pivot · ~2 h
**Read:** [[Distributed tracing and Tempo]] · [[OpenTelemetry]] · [[Grafana]]

**Do:**
1. Ask the agent something that needs a tool (homelab-ui's Agent page, with auto-approve on).
2. homelab-ui **Traces** page: find the agent-runtime trace of that request; open the waterfall; find the slowest span and its duration.
3. In Grafana Explore → Loki, find a log line of that request with `trace_id`, and follow the link to the same trace.
4. 👀 `make logs R=agent-toolbox` → the toolbox's lines for the same request carry the same request id (third column) as the agent's.

**Check:**
1. How do you tie the agent's and the toolbox's records of one request together?
> [!success]- Answer
> By the request id: the agent sends it as `X-Request-ID` on its MCP calls, and both services print it as the third column of every log line (and as an attribute on telemetry). When trace context (`traceparent`) also travels with the call, the toolbox's spans join the agent's trace; otherwise you match them by request id and time.

**Milestone:** given "the agent was slow at 10:00", you can find the slow step in under 5 minutes.
