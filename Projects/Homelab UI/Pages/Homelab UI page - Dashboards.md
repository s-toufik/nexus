---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Dashboards

> **Route** `/dashboards`, `/dashboards/<id>` · **for** everyone · **reads** Prometheus and Loki · **code** `src/app/features/grafana/`
> Ready-made charts: the server, its containers, Kafka, the LLM and server health — Grafana's three dashboards, rebuilt as pages.

![[Homelab UI - Dashboards.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Dashboards | **Homelab overview** (Host, Containers, Kafka, Logs — down to *days until the disk is full*), **LLM (llama.cpp)** (generation and prompt speed, requests in progress and waiting, the LLM container's memory and CPU), **Server health** (CPU and core temperatures, disk usage, CPU per core). The URL keeps your choice (`/dashboards/homelab-overview`). |
| 2 | Time range | 15 min · 1 h · 6 h · 24 h · 7 d, and ⟳ to redraw now. |
| 3 | Section | Panels are grouped: Host, Containers, Kafka, Logs. |
| 4 | Gauges | One number now: CPU, memory, root disk. |
| 5 | Stat | `Scrape targets down`: anything above 0 means a blind spot in your metrics. |
| 6 | Time series | CPU by mode (user, system, iowait, irq, softirq, steal, nice) over the range. |
| 7 | Legend | One colour per series; the series are the label values of the query. |
| 8 | Load average | Processes wanting CPU, averaged over 1, 5 and 15 min. On 16 CPUs, 1–2 means almost idle ([[Linux processes and permissions]]). |

## Use it to
- See **trends** over hours or days, where the control center only shows *now* and 24 h sparklines.
- Read a known set of charts during an incident without writing queries. Write your own on [[Homelab UI page - Metrics]].

## How it works
Each dashboard is a TypeScript definition in `domain/dashboards.ts`: sections of panels, each with a kind (gauge, stat, timeseries, bars, logs), a width and PromQL or LogQL queries. The page runs them over the chosen range and draws them with the shared charts. Grafana itself still runs, for Explore and alerting ([[Homelab UI page - Tool UIs]], [[Grafana]]).

## What the real homelab showed (2026-11-11)
The CPU *user* line jumps at the right edge (~17:36): that's when we loaded every page and a model answered. Load average stayed under 2 — the server has plenty of headroom.

> [!question]- Check: the CPU gauge says 11.5 %, the CPU by mode chart peaks near 1. Do they disagree?
> No: the gauge is a percentage of all 16 CPUs; the chart plots CPU *seconds per second* by mode, so 1 means one full CPU busy — about 6 % of 16.

Back to [[Homelab UI pages]].
