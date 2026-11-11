---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Logs

> **Route** `/logs` · **for** everyone · **reads** Loki (`/api/loki/…`) · **code** `src/app/features/loki/`
> Every container's logs in one place: search with LogQL, see the volume by level, open a line, follow live.

![[Homelab UI - Logs.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | LogQL | The query. `{service_name=~".+"}` = every stream that has a service name, i.e. everything ([[Loki and LogQL]]). |
| 2 | Label · Value | Build the selector without typing: pick `service_name`, then `caddy`. |
| 3 | Time range | 15 min to 7 d, and ⟳. |
| 4 | Lines | How many lines to fetch (500), newest first. |
| 5 | Run | Run the query. |
| 6 | Live | On: re-runs every 5 s, so new lines appear on top. |
| 7 | Lines over time | How many lines per minute, coloured by level: a spike says *something happened here*. |
| 8 | Legend | The levels found. |
| 9 | Level filter | Show only error, warn, info, debug or unknown lines. |
| 10 | A line | Time, service, message (cut to one line). Click to open it. |
| 11 | Labels | The stream's labels: `container`, `namespace`, `pod`, `host`, `job`, `service_name`, `detected_level`. |
| 12 | Full message | The whole line, wrapped. |
| — | Open its trace → | Under the labels, when the line was written during a traced request (it has a `trace_id`): opens that trace on [[Homelab UI page - Traces]]. |

## Use it to
- **After a symptom, find the first error:** time range around it, level filter *error*, read from the oldest.
- **Follow a request across services** by searching an id: `{service_name=~".+"} |= "<request-id>"`.
- Ask the assistant beside the page about a line ([[Homelab UI page - Assistant]]).

## How it works
Two Loki calls: `query_range` for the lines, and a metric query for the chart — `sum by (detected_level) (count_over_time(<your query> [step]))`. The levels are Loki's `detected_level` label, guessed from each line's content ([[Grafana Alloy|Alloy]] ships the lines from every pod: [[Homelab observability]]). The page then merges levels that differ only by case (`INFO` + `info` → `info`) and orders them error → unknown (`volumeByLevel` in `logs.store.ts`).

A line sent over OTLP by agent-runtime or agent-toolbox carries `trace_id` and `span_id`: Loki keeps them as structured metadata, and the page shows them as labels.

## What the real homelab showed (2026-11-11)
- **`INFO` and `info`, `WARN` and `warn` are separate levels.** The upper-case ones came from agent-runtime and agent-toolbox: their OTLP logs carry `severity_text=INFO`, and Loki copies a level *field* as it is, while a level it finds *in the line* is lowercased. `unknown` = Loki couldn't tell (oauth2-proxy's access lines).
- **The spike to ~3 000 lines a minute around 17:30** is oauth2-proxy: Caddy asks it to check the session on *every* request, and it logs each check. Loading every page of the UI at once = thousands of checks. The cost of [[Forward authentication|forward auth]], made visible.
- **kafka-ui's lines start with `[30m…[0;39m`:** ANSI colour codes, because the app colours its console output even when no terminal reads it.
- Every request comes from the same pod-network address (masked): the hostPort NAT again ([[Homelab UI page - Account]]).

### Fixed since (in the repositories; live after the next deploy)
| Finding | Fix | Where |
|---|---|---|
| `INFO` vs `info` | Loki reads an OTLP line's level from its **severity number** (lower-case), because `log_level_fields` no longer lists `severity_text`. The page also merges cases, for the 30 days of older lines. | homelab-infra `observability/loki/config.yml` · homelab-ui `logs.store.ts` |
| oauth2-proxy's spike | `--exclude-logging-path=/oauth2/auth` and `--silence-ping-logging`: no line per session check or health check. Sign-ins and failures are still logged; Caddy still logs every request with its status. | homelab-infra `gateway/oauth2-proxy/values.yaml.gotmpl` |
| kafka-ui's colour codes | A plain [logback](https://logback.qos.ch/manual/layouts.html) pattern, loaded with `LOGGING_CONFIG`. | homelab-infra `message-broker/kafka-ui/logback.xml` |
| A line doesn't lead to its trace | *Open its trace →* on any line with a `trace_id`. | homelab-ui `logs-page.html`, `traces-page.ts` (`/traces?trace=<id>`) |

## Try it
1. 👀 Label `service_name`, value `caddy`, 1 h, level *error* → the gateway's errors (empty is good).
2. 👀 `{service_name="agent-runtime"} |= "rejected"` → the agent's model errors from [[Homelab UI page - Agent]].
3. 👀 `{service_name=~"agent-runtime.*"} |= "turn finished"` → open a line → *Open its trace →* → the waterfall of that message, step by step.

> [!question]- Check: you filter *error* and see nothing, yet the app is broken. Why might that be?
> Its errors may be logged as `ERROR` (another case), `unknown` (an unstructured stack trace), or not at all. Filter by service instead and read around the time of the symptom.

Back to [[Homelab UI pages]].
