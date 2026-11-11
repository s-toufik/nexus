---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Control center

> **Route** `/` · **for** everyone · **reads** Prometheus (`/api/prometheus`), the Kubernetes summary and the apps' health · **code** `src/app/features/control-center/`
> The first page: *is anything wrong right now, and where do I look?* Every card opens the page behind it.

![[Homelab UI - Control center.webp]]
*The real homelab on 2026-11-11 (domain and addresses masked).*

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Menu button | Opens the side menu with every page ([[Homelab UI pages#The menu]]). |
| 2 | Assistant button | Opens the agent beside this page ([[Homelab UI page - Assistant]]). |
| 3 | Greeting and summary | Apps online, alerts firing, when it last updated. It refreshes itself **every 30 s**. |
| 4 | Refresh | Reload every card now, without waiting for the 30 s. |
| 5 | Attention banner | **All good**, or the list of what needs you (rules below). Read this first. |
| 6 | Server gauges | CPU, memory, root disk, CPU temperature, right now. Green → amber → red as they near a limit. |
| 7 | Sparklines | The same four over the last 24 h: is it a spike or a trend? |
| 8 | Footer | Network in/out, disk free, uptime since the last boot, scrape targets up. |
| 9 | Card link | Opens the page with the details: *Dashboards →*, *Kafka →*, *Models →*, *Kubernetes →*. |
| 10 | Data | PostgreSQL (size), MongoDB, Kafka (messages in, consumer lag) up or down, and when each nightly backup last ran. |
| 11 | LLM | Tokens per second over 5 min, requests running now, the models loaded in memory. |
| 12 | Kubernetes | Pods ready, restarts and warning events in the last hour. |
| 13 | Busiest containers | The six containers using the most memory, then the most CPU. |

## Use it to
- Start every session here: one glance answers *is the homelab healthy?*
- Spot a trend before it's an incident: the disk sparkline creeping up, the temperature after loading a big model.
- Jump to the right page: a warning in the Kubernetes card → [[Homelab UI page - Kubernetes]]; a red backup → the Homelab's [[Homelab - Back up and restore]] guide.

Not for digging in: the cards are summaries. For history and detail use [[Homelab UI page - Dashboards]] and [[Homelab UI page - Metrics]].

## How it works
Every number is a PromQL query run through the gateway (`/api/prometheus/api/v1/query`), defined in `infrastructure/signals.ts`, for example:
```text
cpu          100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))
memory       100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)
targets      count(up)
tokens/s     sum(rate(llamacpp:tokens_predicted_total[5m])) / sum(rate(llamacpp:tokens_predicted_seconds_total[5m]))
busiest      topk(6, sum by (container) (container_memory_working_set_bytes{namespace="homelab", …}))
```
The banner (`control-center.store.ts`) says **All good** only when Prometheus answers, no alert is firing (`ALERTS{alertstate="firing"}`) and none of these holds: disk > 85 %, memory > 90 %, CPU > 85 °C, a scrape target down, a pod not ready, a backup older than 26 h.

## What the real homelab showed (2026-11-11)
- **`13/13 targets up` here, `11 of 11` on the Metrics page.** Not a bug: this card counts `up` *series* (`count(up)`), and Alloy pushes two extra jobs to Prometheus by remote write (`integrations/unix`, `prometheus.scrape.cadvisor`). The Metrics page's Targets tab lists only what Prometheus scrapes itself ([[Homelab UI page - Metrics]]).
- **`tokens/s (5 min)` has no number.** With no request in 5 minutes the query divides 0 by 0, which PromQL answers with *NaN*, so the card shows nothing. Ask a model something and it appears.
- **`Kafka – in · lag 0`:** nothing is flowing; the broker has no topics yet ([[Homelab UI page - Kafka]]).
- **`1 warning, last hour`:** Caddy's readiness probe failing once while its pod started, after the [[2026-11-11 Caddy lost its certificate|certificate incident]].

## Try it
1. 👀 Note the CPU gauge, open [[Homelab UI page - Models]], ask a model a question, come back → CPU and the LLM card's tokens/s rise, then fall within minutes.
2. 👀 Click *More →* under Busiest containers → the Metrics page with the query behind the list.

> [!question]- Check: the banner says All good, but a container restarted 5 minutes ago. How can both be true?
> The banner checks pods **not ready** *now*, not restarts. A pod that restarted and is Ready again passes; the Kubernetes card's *restarts, last hour* shows it.

Back to [[Homelab UI pages]].
