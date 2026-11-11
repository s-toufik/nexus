---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Status

> **Route** `/status` · **for** everyone · **reads** `/api/health/<service>` on the gateway · **code** `src/app/features/status/`
> *Is this one service up, where is its configuration, how do I connect to it?* — one card per homelab container, grouped like homelab-infra's folders.

![[Homelab UI - Status.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Summary | How many services answer *ready* (`24 of 24`), when it last checked; it checks again every 30 s. |
| 2 | Check now | Check every service at once. |
| 3 | Group | The homelab-infra folder the services live in: Gateway, Repository, Message broker, Observability, LLM, Apps. |
| 4 | State | **Ready** (its health endpoint answered OK), **Not ready** (it answered something else or failed), **Unknown** (no way to ask, e.g. on the dev server). |
| 5 | Name and folder | `Caddy  gateway/caddy`: the service and the folder of its release in homelab-infra — where to look when you change it. |
| 6 | Page link | Opens its page here: *Your account*, *Kubernetes*, *Metrics*, *Models*… |
| 7 | Address and Copy | How a program connects to it — Kafka's bootstrap server, the MongoDB URI, the LLM's OpenAI-compatible URL — ready to paste. Passwords stay placeholders. |
| 8 | Footer | One-shot jobs (db-migrate, db-provision, keycloak-sync) run at each start and stop, so they aren't listed; `make verify` on the server checks them. |

## Use it to
- Answer *is X up?* for one service, faster than the Kubernetes page.
- Find a connection address when you write code or a pgAdmin/mongosh connection ([[Homelab - Connect to the databases]]).
- Find the folder to edit before a change.

Not for *why* it's down: go to [[Homelab UI page - Kubernetes]] (events, logs) or [[Homelab UI page - Logs]].

## How it works
For each service the page calls `GET /api/health/<name>`. Caddy maps that route to the service's own health endpoint inside the cluster (an actuator, `/ready`, `/-/ready`…), so the browser never talks to the service directly ([[Homelab gateway and sign-in]]). A 2xx means Ready.

## Try it
1. 👀 Click **Copy** next to Kafka → paste it: `<HOMELAB_DOMAIN>:9094`, the listener for clients outside the cluster ([[Kafka]]).
2. ✋ On the server, `make restart R=kafka-ui`, then **Check now** → Kafka UI goes Not ready for a few seconds, then Ready. (Undo: nothing to undo.)

> [!question]- Check: Status shows every service Ready, but the Kafka page fails. Where do you look?
> Ready only means the health endpoint answered. Look at the Kafka page's own call: [[Homelab UI page - Logs]] for `kafka-ui`, and the gateway route `/api/kafka/…`.

Back to [[Homelab UI pages]].
