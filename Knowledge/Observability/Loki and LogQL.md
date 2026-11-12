---
type: concept
domain: Observability
level: intermediate
tags: [concept, observability, logs]
updated: 2026-11-08
---

# Loki and LogQL

> Loki stores logs cheaply by indexing only their **labels** (`service_name`, `pod`), not their text; **LogQL** selects streams by label, then filters and parses the lines.

## Why it matters
Full-text log indexes (Elasticsearch) are powerful but heavy. Loki's "labels like Prometheus, grep for the rest" fits small and large systems alike, and its labels match Prometheus' so you can jump between metrics and logs.

## How it works
- A **stream** = one unique label set; lines in it are compressed chunks.
- **LogQL**: `{service_name="caddy"} |= "error"` (contains), `!=`, `|~ "regex"`, `| json` / `| logfmt` (parse), `| status >= 500` (filter on parsed fields).
- **Metric queries**: `sum by (service_name) (rate({namespace="homelab"} |= "error" [5m]))`.
- **`detected_level`**: the level Loki adds to each line. From a level *field* (a label or structured metadata named `level`, `severity`… — the list is `log_level_fields`) it copies the value as written (`INFO`); from an OTLP severity number or from the line's text it writes lower-case (`info`). Mixed sources → mixed cases, unless you choose the fields.
- Ingest: push API (`/loki/api/v1/push`) or OTLP (`/otlp`); retention by time.
- Same cardinality rule as Prometheus: few labels, many lines.

## In our projects
- Alloy ships every pod's stdout with labels `namespace`, `pod`, `container`, `service_name` (from `app.kubernetes.io/name`, or the CNPG cluster name); apps can send OTLP logs through the collector ([[Homelab observability]]).
- 30 days; homelab-ui's Logs page queries `/api/loki/…`; Grafana links `trace_id` in a line to Tempo.

## Check yourself
1. Why is `{service_name="agent-runtime"} |= "timeout"` cheap but `{namespace="homelab"} |~ ".*"` over 30 days expensive?
> [!success]- Answer
> Loki indexes only labels. The first picks one service's streams through the index, then greps only those lines for `timeout`. The second selects every stream in the namespace and matches every line, so it reads and decompresses 30 days of every service's logs.
2. Why not make `user_id` a Loki label?
> [!success]- Answer
> Each distinct label value makes a new stream. Thousands of users means thousands of tiny streams, a huge index and slow queries. Keep it in the line (or structured metadata) and filter with `| json | user_id="…"`.

## Go further
- [Loki docs](https://grafana.com/docs/loki/latest/), [LogQL](https://grafana.com/docs/loki/latest/query/).
- [Loki label best practices](https://grafana.com/docs/loki/latest/get-started/labels/bp-labels/).
