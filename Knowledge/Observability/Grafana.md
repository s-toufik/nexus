---
type: concept
domain: Observability
level: beginner
tags: [concept, observability]
updated: 2026-11-08
---

# Grafana

> The UI for observability: **data sources** (Prometheus, Loki, Tempo…), **dashboards** of panels built from queries, **Explore** for ad-hoc investigation, and links between signals.

## Why it matters
Data you can't see is useless. Grafana is the common window in most companies; knowing how to build a dashboard, read a panel's query, and pivot from a metric to logs and traces is daily operational work.

## How it works
- **Provisioning**: data sources and dashboards from files at start-up — configuration as code.
- **Dashboards** are JSON; **variables** (`$service`) make them reusable.
- **Explore**: query any source, split view, jump from logs to traces.
- **Correlations**: Loki derived fields (log → trace), Tempo `tracesToLogs`/`tracesToMetrics`, Prometheus exemplars.
- Auth: its own users, or **OAuth/OIDC** with role mapping.
- Service accounts and tokens for API access.

## In our projects
- Provisioned data sources (Prometheus, Loki, Tempo, linked) and dashboards from `observability/grafana/` (*Homelab overview*, *Server health*, *LLM llama.cpp*) ([[Homelab observability]]).
- Signs in with Keycloak itself (its own OIDC client), roles mapped from the realm.
- `grafana-mcp` uses a service-account token (Viewer, or Editor for write) for the agent's `grafana_*` tools.
- To change a dashboard: edit in Grafana, export JSON, commit, `make apply R=grafana`.

## Check yourself
1. Why provision dashboards from git instead of saving them in Grafana's database?
> [!success]- Answer
> Git keeps them versioned, reviewed and reproducible: a rebuilt Grafana gets them back, a change can be undone, and the server's state matches the repository. Saved only in its database, a dashboard is lost with the volume and changes without a trace.
2. From a latency panel, how do you reach the slow request's logs?
> [!success]- Answer
> Through an exemplar: click a point on the panel, which links to an example trace in Tempo. From the trace, `tracesToLogs` opens Loki filtered on that trace's service and time (and `trace_id`).

## Go further
- [Grafana docs](https://grafana.com/docs/grafana/latest/), [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/), [exemplars](https://grafana.com/docs/grafana/latest/fundamentals/exemplars/).
