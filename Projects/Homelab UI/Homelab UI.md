---
type: project
status: active
started: 2026-09
repos: [homelab-ui]
tags: [project, homelab-ui, frontend]
updated: 2026-11-19
---

# Homelab UI

> The homelab's app for everyone at home: one Angular app, served by the gateway, that shows each person only the pages they were given — assistants like Kitchen and Travel for the family, every tool of the [[Homelab]] and a live map of the cluster for admins — calm on a computer, comfortable on a phone.

## In one picture
![[Homelab UI.canvas]]

## Why it exists
- **One place for everything.** Grafana, Prometheus, Kafka UI and the others each have their own look and their own tab. Rebuilding them as pages gives one coherent control center ([[Homelab decisions]], 2026-11-07).
- **The agent in context.** Ask about an error on the Logs page without leaving it.
- **A real frontend to learn from.** Signals, dependency injection, lazy routes, streaming, a canvas editor, a strict layering rule — the skills of a modern frontend engineer.

## What it does
- **Today** (`/`): a short briefing — the date, a greeting, one or two sentences of what matters — then only what has something: waiting plans and alerts, the homelab in four numbers (admins), recent conversations.
- **Center** (`/`): the first page, a globe of constellations where every page is a star; drag, zoom, fly to a group, click a star to open it.
- **Agents** (`/agents`): a live map of the Assistant and its agents as animated scenes, with lines when it asks one.
- **Assistant** (`/assistant`): conversations listed beside the open one, each tied to an agent, deletable one by one or all at once; plans wait in a card (Approve and run · Change it · Dismiss); a details column on wide screens. The drawer opens the assistant beside tool pages. Conversations are kept per account in the browser; agent-runtime's memory expires after 7 days.
- **Map** (`/map`, admins): the cluster laid out like homelab-infra, live pod states, click a service to follow what it talks to.
- **People** (`/people`, admins): a list beside the person's pages as switches; add a person with a temporary password.
- **⌘K** finds any page or conversation, or asks an assistant. A sidebar that folds to icons on iPad and computer (`[`); on the phone a slim top bar and a menu sliding from the left with the recent conversations.
- **Tool pages:** Status, Dashboards, Metrics, Logs, Traces, Kafka, Pipeline, Models, Tools, Tool UIs, Kubernetes (admins), Tasker.
- **Kitchen** (`/kitchen`): a recipe and nutrition card — ingredients with live macros, method steps, tasting notes, versioned saves — talking to its own backend, [[Kitchen Atelier]]. The first page in a new **Life** category, alongside Platform/AI/Automation/Observability/Streaming.
- **Themes:** Everyday (Navy, Light, Contrast, Blossom, Lilac, Forest) and Storybook, which change the whole appearance (Wizarding, Dragon Rider, Demigod, Regency), or Match my device, saved on the account. Side panels peek on hover, stay on click and resize.

## How it's built
| Part | Where | Role |
|---|---|---|
| The app | [[homelab-ui]] | Angular 21: standalone components, signals, zoneless, lazy routes |
| Served by | nginx in the image, behind Caddy | One HTTPS origin, one sign-in ([[Homelab gateway and sign-in]]) |
| Talks to | `/api/<tool>/…` routes on the gateway | Each tool's own API, path-allow-listed |
| Deployed by | [[Homelab deployment]] | Tag → image + chart → `versions.yaml` → `make apply R=homelab-ui` |

## Read it in this order
0. [[Homelab UI pages]] — every page, as you see it: an annotated screenshot of the real homelab, what each part is, what it's for, how it works.
1. [[Homelab UI structure]] — the shell, features and shared code, and the rule that keeps them apart.
2. [[Homelab UI state and streaming]] — signals stores, the gateway client, the agent's event stream.
3. [[Homelab UI Tasker]] — a workflow editor whose engine is plain TypeScript.
4. [[Homelab UI delivery]] — from `ng build` to a pod.

Then [[Homelab UI decisions]] and the guides: [[Homelab UI guides]].

## Knowledge it uses
[[Angular]] · [[Signals]] · [[Single-page application]] · [[Dependency injection]] · [[Feature-first architecture]] · [[Server-sent events]] · [[Unit tests and test doubles]] · [[Container image]] · [[Reverse proxy]] · [[CSRF]] · [[Cookies and sessions]] · [[Prometheus and PromQL]] · [[Loki and LogQL]] · [[Model Context Protocol]]

## Where it stands (2026-11-19)
> [!note]- This section's older history is stale
> The "Released: v1.1.3" line below is from 2026-11-08 and predates the Draft 5 shell rework and the whole Kitchen feature ([[Homelab UI pages]] has the same caveat about its screenshot gallery). Treat it as "last confirmed," not a full changelog.
- **Released:** v1.1.3 (Tool UIs page, block names in Tasker, Kubernetes pod logs fix) — last version confirmed released at the time that line was written; `v2.5.0` is the latest tag `git fetch --tags` shows as of 2026-11-19.
- **Built, not yet released:** `environments/versions.yaml` is pinned to `2.5.1`, bundling a Kubernetes "Shell tab disconnected" fix (checking `containerStatuses` before offering Shell, instead of after a failed connection) with this round's Kitchen fixes below.
- **Kitchen page, new this week:** a recipe/nutrition studio talking to [[Kitchen Atelier]] — see [[Homelab UI page - Kitchen]]. Its Ingredients and Recipes sub-pages just gained real search (2026-11-19): the ingredient search was silently broken server-side (fixed in [[Kitchen Atelier decisions]]), and Ingredients also gained a mobile card layout to fix a "stuck, can't scroll" report.
- **Kubernetes page:** a CronJob's **Run now** now jumps straight to the new Job and its Logs/Shell work there too, resolved by the `job-name` label ([[Homelab UI page - Kubernetes]]).
- **Next:** see the [[Log]].
