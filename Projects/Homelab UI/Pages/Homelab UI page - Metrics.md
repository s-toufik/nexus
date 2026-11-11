---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Metrics

> **Route** `/metrics` · **for** everyone · **reads** Prometheus (`/api/prometheus/…`) · **code** `src/app/features/prometheus/`
> Ask Prometheus anything in PromQL, see what it scrapes, read the alert rules.

![[Homelab UI - Metrics query.webp]]

## Query
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Tabs | **Query**, **Targets**, **Alerts and rules**. |
| 2 | PromQL | The query. Here: memory of each container in `homelab` ([[Prometheus and PromQL]]). |
| 3 | Run | Run it (or Enter; Shift+Enter adds a line). |
| 4 | Time range | Over the last 15 min to 7 d; ⟳ re-runs. |
| 5 | Graph / Table | A chart over time, or a table of the values now. |
| 6 | Chart | One line per series. The top line here is `llm`, the model in memory (~5.5 GiB). |
| 7 | Legend | Each series' labels: `{container="caddy"}`… A query that returns 30 series draws 30 lines. |
| 8 | Summary | Targets up, out of all targets Prometheus scrapes. |

![[Homelab UI - Metrics targets.webp]]

## Targets
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | State | `up` if the last scrape worked, `down` with an error otherwise. |
| 2 | Job | The scrape job from Prometheus' config: one per exporter or service. |
| 3 | Instance | The address scraped (pod addresses masked). `alloy` is scraped on the node's address because it runs with the host's network. |
| 4 | Last scrape · Took | When, and how long it took. Slow scrapes (tens of ms) are fine; seconds are a problem. |
| 5 | Error | Why a target is down: connection refused, timeout, 401… |
| 6 | Refresh | Read the list again. |

## Use it to
- Answer a precise question: *how much memory did agent-runtime use during that slow answer?* `container_memory_working_set_bytes{container="agent-runtime"}` over 1 h.
- Find a blind spot: a target down means its dashboards and alerts are silently empty.

## How it works
`/api/v1/query_range` for the graph, `/api/v1/query` for the table, `/api/v1/targets` and `/api/v1/rules` for the other tabs — Prometheus' HTTP API through the gateway, read-only.

## What the real homelab showed (2026-11-11)
**11 targets here, 13 on the control center.** `sum by (job) (up)` lists 13 jobs: the 11 scraped by Prometheus plus `integrations/unix` and `prometheus.scrape.cadvisor`, which [[Grafana Alloy|Alloy]] scrapes itself and pushes by remote write ([[Homelab UI page - Pipeline]]). They have an `up` series but aren't Prometheus targets.

## Try it
1. 👀 `sum by (job) (up)` → Table → 13 rows of `1`.
2. 👀 `rate(container_cpu_usage_seconds_total{namespace="homelab", container="llm"}[5m])` over 1 h, then ask a model something on [[Homelab UI page - Models]] → the line rises.

> [!question]- Check: why `rate(…[5m])` and not the counter itself?
> `container_cpu_usage_seconds_total` only ever grows; its slope is what's useful. `rate` turns it into CPU seconds per second, averaged over 5 minutes.

Back to [[Homelab UI pages]].
