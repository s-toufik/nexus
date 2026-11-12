---
type: index
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page, index]
updated: 2026-11-12
---

# Homelab UI pages

> Every page of [[Homelab UI]], one note each: a real screenshot with numbered markers, what each number is, what the page is for, how it works underneath, what our homelab showed on 2026-11-11, and something to try.
> The pictures are the real homelab with its domain, addresses and personal data masked (`<HOMELAB_DOMAIN>`, `<server>`, `<pod-ip>`, `you@example.com`). Two are sample data, and say so.

## The menu
![[Homelab UI - Menu.webp]]

| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Homelab | The server this UI talks to (`<HOMELAB_DOMAIN>`). |
| 2 | Settings | Theme and colours; on the dev server, where the backends are. |
| 3 | Signed in as · Sign out | Your account; Sign out ends the session everywhere. |
| 4 | Platform | [[Homelab UI page - Status\|Status]], [[Homelab UI page - Account\|Account]], [[Homelab UI page - Kubernetes\|Kubernetes]] (admins only — hidden for others), [[Homelab UI page - Tool UIs\|Tool UIs]]. |
| 5 | A page | Each page has its colour, used in its charts and icon. |
| 6 | AI | [[Homelab UI page - Agent\|Agent]], [[Homelab UI page - Models\|Models]], [[Homelab UI page - Tools\|Tools]]. |
| 7 | Automation | [[Homelab UI page - Tasker\|Tasker]]. |
| 8 | Observability | [[Homelab UI page - Dashboards\|Dashboards]], [[Homelab UI page - Metrics\|Metrics]], [[Homelab UI page - Logs\|Logs]], [[Homelab UI page - Traces\|Traces]], [[Homelab UI page - Pipeline\|Pipeline]]. Below (not in the picture): **Streaming** ([[Homelab UI page - Kafka\|Kafka]]) and **Infrastructure**: PostgreSQL, MongoDB and Kafka marked *up* or *down*. |

The [[Homelab UI page - Control center|control center]] is `/`, and the [[Homelab UI page - Assistant|assistant]] opens beside any page but the Agent's.

## Which page answers which question
| You want to know… | Go to | Then, to dig |
|---|---|---|
| Is everything OK right now? | [[Homelab UI page - Control center\|Control center]] | the card's page |
| Is service X up? How do I connect to it? Where's its config? | [[Homelab UI page - Status\|Status]] | Kubernetes |
| Why did pod X restart? What does it run? | [[Homelab UI page - Kubernetes\|Kubernetes]] → Events, Logs | Logs |
| How has CPU, memory, disk evolved? | [[Homelab UI page - Dashboards\|Dashboards]] | Metrics |
| A precise number over time | [[Homelab UI page - Metrics\|Metrics]] (PromQL) | Dashboards |
| What did X log at 17:30? | [[Homelab UI page - Logs\|Logs]] (LogQL) | Traces |
| Why was that request slow? | [[Homelab UI page - Traces\|Traces]] | Logs of the slow service |
| Are logs and metrics being collected? | [[Homelab UI page - Pipeline\|Pipeline]] | Metrics → Targets |
| Are messages flowing? Is a consumer behind? | [[Homelab UI page - Kafka\|Kafka]] | Logs of the consumer |
| Which model is in memory? Is the model OK? | [[Homelab UI page - Models\|Models]] | Logs (`llm`) |
| What can the agent do? Does this tool work? | [[Homelab UI page - Tools\|Tools]] | Agent |
| Do it for me / explain this | [[Homelab UI page - Agent\|Agent]], [[Homelab UI page - Assistant\|Assistant]] | Tools, Traces |
| Repeat a check without me | [[Homelab UI page - Tasker\|Tasker]] | |
| My password, my sessions | [[Homelab UI page - Account\|Account]] | |
| The tool's own full interface | [[Homelab UI page - Tool UIs\|Tool UIs]] | |

## How every page works
Every page is a lazy-loaded *feature* (`src/app/features/<feature>/`) that calls one backend through the gateway: `/api/<tool>/…` on the same HTTPS origin, behind the same sign-in, on an allow-list of paths ([[Homelab UI structure]], [[Homelab gateway and sign-in]]). Changes carry the `X-Homelab-Request: 1` header, and admin-only changes need `role:admin` at Caddy.

## What the real homelab showed (2026-11-11)
Taking these pictures from the live homelab turned up real findings — each is explained on its page:
1. **The agent fails on any local model** (`404 page not found`): `llmBaseUrl` points to NVIDIA's API, and a new browser picks a local model by default → [[Homelab UI page - Agent]]. *Fixed in the code: one provider per model, the homelab's and NVIDIA's side by side.*
2. **Traces are one span each**, and MCP calls aren't linked to the agent's trace → [[Homelab UI page - Traces]]. *Fixed in the code: a span per request and per step.*
3. **13 `up` series vs 11 targets** — Alloy's own scrapes → [[Homelab UI page - Metrics]].
4. **`INFO` and `info` are different levels**, and oauth2-proxy logs one line per request → [[Homelab UI page - Logs]]. *Fixed in the code: one case, no session-check lines, a link from a line to its trace.*
5. **Every client address is the pod network's** (hostPort NAT) → [[Homelab UI page - Account]].
6. **Kafka is empty**: no topic yet → [[Homelab UI page - Kafka]].
7. **A raw label `password-display-name`** on the Account page → [[Homelab UI page - Account]].
8. **The assistant doesn't see the page** it sits on → [[Homelab UI page - Assistant]].

## A first tour, 30 minutes
1. [[Homelab UI page - Control center]] — read every card; open one link.
2. [[Homelab UI page - Status]] — copy Kafka's address.
3. [[Homelab UI page - Logs]] — `service_name` = `caddy`, last hour.
4. [[Homelab UI page - Metrics]] — `sum by (job) (up)`.
5. [[Homelab UI page - Tools]] — run `postgres_list_schemas`.
6. [[Homelab UI page - Agent]] — ask *"Compute 2 to the power of 20 with Python"*, approve the plan.
7. [[Homelab UI page - Traces]] — find that request.

This is also lesson 2 of [[Path - Tour of Homelab UI]].
