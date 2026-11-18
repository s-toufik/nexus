---
type: decisions
project: "[[Homelab UI]]"
tags: [homelab-ui, decisions]
updated: 2026-11-18
---

# Homelab UI decisions

Newest first.

## 2026-11-18 — The global toolbar is gone; the assistant toggle floats
- **Context:** the sticky top bar on every page had shrunk to three things: the ⌘K search field, the "ask about this page" assistant toggle, and (on the one page that uses it) a page-settings gear — a whole reserved row for at most two small icons.
- **Decision:** the bar itself is gone. Search moved into the sidebar as a `Search` nav item, right above Center (opens the same command palette). The assistant toggle is now a small floating button, fixed bottom-right on every page, hidden under 768px like the bar was. The page-settings gear — used only by the Assistant/Chat page — moved into that page's own local header, next to its agent picker, reusing the same `LayoutStore.togglePanel()`/`hoverPanel()` it always called.
- **Why:** a dedicated top row for one or two icons wastes vertical space on every page; neither icon was actually page-specific chrome (search is global, the assistant toggle already worked the same everywhere) except the gear, which only one page ever used.
- **Alternatives:** keeping the bar just for the assistant icon (the row survives for one icon); making every page own a local "page actions" slot (over-engineered for something only one page needs).
- **Consequences:** the `Toolbar` component is deleted; `PageChromeStore.rightPanel()` still exists but nothing renders its toggle globally anymore — a future page that wants a right panel must put its own open button in its own header, the way the Assistant page now does.

## 2026-11-18 — A `Life` feature category and nav section
- **Decision:** `FEATURE_CATEGORIES` gets a `Life` entry alongside Platform/AI/Automation/Observability/Streaming, and `NAV_SECTIONS` a matching `Life` section (`navSection()` routes it there instead of falling through to `Operate`). Kitchen is its first member.
- **Why:** `Operate` was already Platform + AI + Streaming + anything else lumped together (Status, Kubernetes, Models, Tools, Kafka…) — infrastructure you operate. A recipe app isn't that; giving it nowhere to go but `Operate` would have buried it among unrelated tools.
- **Alternatives:** putting Kitchen under `Operate` anyway (what actually happened at first, until it was pointed out); a fifth generic "Other" section (says nothing about what's in it).
- **Consequences:** `NAV_SECTIONS` now has four entries instead of three; a future non-infrastructure, non-AI, non-automation page has a section that fits it.

## 2026-11-18 — Kitchen's theme derives from the app's own CSS variables, not a hardcoded palette
- **Decision:** the Kitchen page was built to match a provided design pixel-for-pixel (parchment background, saffron/terracotta/sage accents, Inter/JetBrains Mono) — but every `--k-*` token in `kitchen-theme.scss` is defined as `var(--surface)`, `var(--text)`, `var(--hue-amber)`, `var(--hue-orange)`, `var(--hue-green)`… from the app's own theme system, never a literal hex value.
- **Why:** so it follows whichever of the app's nine themes (and light/dark) the person picked, the same as every other page, instead of always rendering light regardless of appearance settings — verified against the `navy` (dark) and `forest` themes.
- **Alternatives:** the literal hex palette from the design as given (pixel-exact in light mode, but always light — illegible or jarring in dark theme); a Kitchen-specific dark-mode override block (double the palette to maintain, and still wrong for the other seven themes).
- **Consequences:** Kitchen's colours shift with every theme, including non-light/dark ones like `wizarding` or `dragon`; a future page that wants the same "distinct but on-theme" look should alias its own tokens onto `--surface`/`--text`/`--hue-*` the same way rather than hardcoding.

## 2026-11-16 — Draft 5 · Briefing replaces the Draft 2 build
- **Decision:** a calm desktop app that adapts down: a receding sidebar (Today, Assistant, Map, pages in Observe / Operate / Automate), a tab bar on the phone, one ⌘K field to find or ask, Today written as a briefing, conversations each tied to an agent, plans as a card in the conversation, People as list and detail, and an interactive Map of the cluster. Navy, Light and Contrast themes (Geist, Geist Mono for addresses), density by pointer.
- **Why:** the Draft 2 build promoted the agents four times on one screen, repeated the navigation on Home and stretched phone cards across a desktop ([[2026-11-16 Homelab UI Briefing design]]).
- **Alternatives:** polishing Draft 2 (the structure was the problem, not the colours).
- **Consequences:** the access model, guards, People API, theme pipeline and agent streaming stay; the rail, the colourful Home, the Ask bar and the five-theme set are gone; old saved conversations are read and kept.

## 2026-11-15 — Draft 2 · Bright, five themes, one role per page
- **Decision:** homelab-ui becomes an app for everyone at home in the Draft 2 · Bright design: Home shows only the pages a person was given, assistants as full-colour cards, one Ask bar; an app rail on iPad and computer, none on a phone. Access is a Keycloak realm role per page (`agent:kitchen`, `app:tasker`, `page:metrics`…) read from the `role:<name>` groups oauth2-proxy already sends; `admin` opens everything. Admins manage people in the UI through `/api/people` (Keycloak's admin API with their own token). Five themes (Bright, Midnight, Sand, Pastel, Contrast) or "Match my device", saved on the person's account.
- **Why:** family members need a simple app with only their pages, on their iPhone; one role per page needs no new service, and the gateway can enforce the same roles ([[Homelab decisions]]).
- **Alternatives:** groups per profile only (coarser: one profile can't give a single extra page); a people service of our own (one more backend to run and secure); themes per device (Dora would pick hers again on each device).
- **Consequences:** a new page needs an `access` id, a route guard, a line in `pages.txt` and gateway rules ([[Homelab UI - Give someone a page]]); new accounts get a temporary password shown once, since there is no email server for set-up links; theme tokens are generated by `scripts/themes.mjs`, which refuses text under 4.5:1.

## 2026-11-15 — Pick the agent, listed by the supervisor
- **Decision:** the Agent page's settings get an **Agent** list, filled from the supervisor's `GET /v1/agents`; each message goes to the chosen agent at `/api/agents/<name>/v1/api2a` (the supervisor stays at `/api/agent`). The choice is remembered with the model, and Tasker's code blocks use it.
- **Why:** you can always ask the supervisor, and still talk to one agent directly when you know which one you want ([[Agent runtime agents]]).
- **Alternatives:** a list of agents in the UI's own config (one more place to update for each new agent).
- **Consequences:** in direct mode (development), only the agent on the configured port answers; the other agents are reached through the gateway.

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
