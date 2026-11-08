---
type: decisions
project: "[[Homelab UI]]"
tags: [homelab-ui, decisions]
updated: 2026-11-08
---

# Homelab UI decisions

Newest first.

## 2026-11-07 — Rebuild every tool UI natively, not in iframes
- **Context:** one control center for Grafana, Prometheus, Loki, Tempo, Kafka UI, Alloy, llama-swap, the toolbox, Keycloak's account, Kubernetes.
- **Decision:** a page per tool, calling the tool's API through allow-listed gateway routes; the tools' own UIs stay reachable (Tool UIs page).
- **Why:** iframes can't share the theme, the layout or the assistant; native pages can.
- **Alternatives:** iframes (fast to build, foreign look, cookie and framing headaches); links only.
- **Consequences:** more code per tool; each API used must have a gateway route ([[Homelab decisions]]).

## 2026-11-07 — The assistant beside every page, one conversation
- **Decision:** a drawer on every page but `/agent`, sharing the root `AgentStore`, lazy-loaded through `ASSISTANT_PANEL`.
- **Why:** ask about what you're looking at; carry on on the Agent page.
- **Alternatives:** a separate conversation per page (loses context).

## 2026-11 — Kubernetes page with full admin rights
- **Decision:** a homelab-ui page on `/api/kube` (kube-api, cluster-admin) for accounts with the `admin` role; Headlamp added later for the rest.
- **Why:** day-to-day actions (scale, restart, logs, shell, YAML) in the same UI.

## Feature-first, layered, zoneless
- **Decision:** Angular standalone components, signals, zoneless change detection; features own their layers; the shell knows only the feature contract.
- **Why:** pages stay independent; adding one never edits the shell; signals make state explicit and cheap.
- **Alternatives:** NgModules and zone.js (older Angular); a state library (NgRx) — heavier than needed for page-local stores.

## Tasker stores in PostgreSQL through PostgREST
- **Decision:** no backend of its own; PostgREST with row-level security.
- **Why:** per-account data enforced in the database; no server code to maintain.
- **Alternatives:** a small API service; browser storage only (lost on another device).
