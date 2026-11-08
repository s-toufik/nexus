---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Use observability

> Dashboards, log search, Prometheus targets, scraping a new service, changing a dashboard or the retention.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## Dashboards
- `https://<HOMELAB_DOMAIN>:3000` → **Dashboards → Homelab**: Homelab Overview, Server Health, LLM (llama.cpp).

## Search the logs
- Grafana → **Explore** → Loki → `{namespace="homelab", service_name="<release>"}`.

## See what Prometheus scrapes
- `make targets` — raw: `kubectl -n homelab exec deploy/caddy -c caddy -- wget -q -O - http://prometheus:9090/api/v1/targets`
- or `https://<HOMELAB_DOMAIN>:9090/targets`

## Scrape a new service
- In its values: `metrics: { port: <port>, path: /metrics }`, then `make apply R=<release>`; Prometheus finds it within a minute.

## Change a dashboard
1. Edit it in Grafana, **Save**; **Export → Export as JSON**.
2. Replace the file in `observability/grafana/dashboards/`, commit, push.
3. On the server: `git pull`, `make apply R=grafana`.

## Change how long metrics are kept
1. `prometheus.retentionTime` / `retentionSize` in `environments/default.yaml`.
2. `make apply R=prometheus`

## If it goes wrong
- A Prometheus target is down: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab observability]] — the whole pipeline.
- [[Prometheus and PromQL]] · [[Loki and LogQL]] · [[Grafana]]
