---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Check the homelab

> See what runs, whether everything works, and read the logs.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

- Pods: `make status` (or `make ps`) — raw: `kubectl -n homelab get pods -o wide`
- Everything, every line ✓: `make verify` — raw: `./scripts/verify.sh`
- Releases and versions: `make releases` — raw: `helm list -A`
- Logs: `make logs R=<release>` — raw: `kubectl -n homelab logs -f --tail=200 -l app.kubernetes.io/instance=<release> --all-containers --prefix` (PostgreSQL: `-l cnpg.io/cluster=postgres`)
- Why a pod doesn't start: `make events` — raw: `kubectl -n homelab get events --sort-by=.lastTimestamp | tail -n 40`
- CPU and memory: `make top` — raw: `kubectl -n homelab top pods`

## Read the logs

| To see | Command |
|---|---|
| One release, live | `make logs R=<release>` — raw: `kubectl -n homelab logs -f --tail=200 -l app.kubernetes.io/instance=<release> --all-containers --prefix` |
| PostgreSQL | `make logs R=postgres` — raw: `kubectl -n homelab logs -f --tail=200 -l cnpg.io/cluster=postgres --all-containers --prefix` |
| More history | `make logs R=<release> TAIL=2000` |
| Why a pod crashed (the run before the restart) | `kubectl -n homelab logs deploy/<release> --previous` (`statefulset/<release>` for mongodb, kafka, prometheus, loki, tempo) |
| A job (migrations, realm sync, a backup) | `kubectl -n homelab logs job/<job>`; the jobs: `kubectl -n homelab get jobs` |
| Why a pod doesn't start | `make events` — raw: `kubectl -n homelab get events --sort-by=.lastTimestamp \| tail -n 40` |
| Everything, searchable, kept 30 days | Grafana `https://<HOMELAB_DOMAIN>:3000/explore` → **Loki** → `{service_name="<release>"}` |

- In Grafana, the label browser lists every `service_name`. agent-runtime and agent-toolbox send their logs over OTLP, under their own service names; a log line with a `trace_id` links to its trace in Tempo.

## If it goes wrong
- [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab failure modes]] — how to read pod states and events.
- [[Probes]] · [[Loki and LogQL]] · [[Homelab observability]]
