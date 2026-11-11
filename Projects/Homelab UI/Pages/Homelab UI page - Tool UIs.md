---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Tool UIs

> **Route** `/tool-uis` · **for** everyone (Headlamp: admins) · **reads** each tool's address on the gateway · **code** `src/app/features/tool-links/`
> Every tool's **own** web interface, one click away, with whether it answers.

![[Homelab UI - Tool UIs.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Tool card | Green dot: the tool answers on its port; grey or red: it doesn't. |
| 2 | Address | `<HOMELAB_DOMAIN>:<port>` — each tool has its own HTTPS port on Caddy (3000 Grafana, 9090 Prometheus, 12345 Alloy, 8080 Kafka UI, 8090 llama-swap, 6274 MCP Inspector, 8100 agent API docs, 4466 Headlamp, 8443 Keycloak). |
| 3 | Links | Open a precise place in a new tab: Grafana *Explore*, Prometheus *Targets* or *Alerts*, Alloy's *Graph*, the LLM *Playground*… |
| 4 | Check again | Ask every tool again. |
| 5 | Group | Observability, Streaming, AI, Platform. |

## Use it to
Reach what the pages here don't rebuild: Grafana's Explore and its alerting, Alloy's live graph, Prometheus' rule editor, the MCP Inspector to debug the toolbox, the agent's OpenAPI docs, Headlamp's cluster map, Keycloak's two-factor setup.

## How it works
Each card is a link to the same domain on another port. Caddy terminates TLS on every one and asks oauth2-proxy whether you're signed in, so one sign-in covers them all ([[Homelab gateway and sign-in]]). The dot is a request the page makes to each address.

> [!question]- Check: why does every tool get its own port instead of a path like `/grafana/`?
> Most tools assume they own the root of their site (absolute links, cookies, redirects). A port per tool keeps them unmodified; the cost is one hostPort and one Caddy site per tool.

Back to [[Homelab UI pages]].
