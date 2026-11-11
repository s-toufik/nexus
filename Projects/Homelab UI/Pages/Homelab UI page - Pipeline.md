---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Pipeline

> **Route** `/pipeline` · **for** everyone · **reads** Alloy's API (`/api/alloy/…`) · **code** `src/app/features/alloy/`
> What [[Grafana Alloy|Alloy]] collects — its components, their health, and what feeds what.

![[Homelab UI - Pipeline.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Count | Components in Alloy's config (11), and how many aren't healthy. |
| 2 | Group | By kind: **Discovery** (find targets), **Loki** (logs), **Prometheus** (metrics). |
| 3 | Health | `healthy`, `unhealthy`, `exited`, `unknown` — from Alloy itself. |
| 4 | Selected | The component opened on the right. |
| 5 | Sends to | Components it references: its inputs' sources and its outputs' destinations. |
| 6 | Debug JSON | Its arguments, exports, data-flow edges and health, as Alloy reports them. |
| 7 | Refresh | Read again. |
| 8 | Close | Close the component. |

## Read the pipeline
```text
logs     discovery.kubernetes.pods → discovery.relabel.pods → loki.source.kubernetes.pods → loki.write.default → Loki
metrics  prometheus.exporter.unix.host → prometheus.scrape.host ┐
         discovery.kubernetes.nodes → discovery.relabel.cadvisor → prometheus.scrape.cadvisor ┴→ prometheus.relabel.instance → prometheus.remote_write.default → Prometheus
```
Discovery asks Kubernetes what pods and nodes exist; relabel turns their metadata into labels (`namespace`, `pod`, `service_name`); sources read logs or scrape metrics; write and remote_write send them on.

## Use it to
Answer *why are a pod's logs missing?* — an unhealthy `loki.source.kubernetes.pods` or `loki.write.default` means nothing reaches Loki.

## How it works
Alloy's HTTP API (`/api/v0/web/components`) lists components with their health and links; the page groups them by the first word of their name. Alloy's own graph is on [[Homelab UI page - Tool UIs]] (`:12345`).

> [!question]- Check: `loki.source.kubernetes.pods` *sends to* `discovery.relabel.pods`. Isn't data flowing the other way?
> *Sends to* lists every component it references. It reads its **targets** from `discovery.relabel.pods` (an input) and forwards lines to `loki.write.default` (the output). The data-flow edges in the JSON show only the latter.

Back to [[Homelab UI pages]].
