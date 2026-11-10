---
type: path
track: Projects
time: ~4 h
projects: ["[[Homelab]]"]
tags: [path, project]
updated: 2026-11-10
---

# Project - Ship and investigate

> **Goal:** ship a real change through the whole platform, then use the signals to prove it works.
> **Before:** [[Path - Shipping changes]] · [[Path - Seeing inside]]. **Then:** [[Project - Build a service]]. **All paths:** [[Paths]]

## The task
Add a panel to Grafana's *Homelab overview* dashboard: **restarts per pod in the last 24 h** (`increase(kube_pod_container_status_restarts_total[24h])` is not available here — use cAdvisor's restarts or `changes(container_start_time_seconds{namespace="homelab"}[24h])`).
1. Build the panel in Grafana; check the numbers against `make status` (RESTARTS column).
2. Export the dashboard JSON, replace `observability/grafana/dashboards/homelab-overview.json`, commit, push.
3. On the server: `git pull`, `make diff R=grafana` (read it), `make apply R=grafana`.
4. Prove it: the panel is there after a Grafana restart (it came from git, not from Grafana's database).

## Then investigate
Pick the pod with the most restarts. Using only metrics, logs and `kubectl describe`, write three sentences: what restarted it (OOMKilled? a failing probe? a deploy?), when, and whether it matters.

## Reward
You've used every platform skill in one go: git as the source of truth, the release train, the dashboards as code, and the signals. Log it in a [[Log]] entry with the diff you shipped.
