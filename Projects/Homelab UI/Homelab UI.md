---
type: project
status: active
started: 2026-09
repos: [homelab-ui]
tags: [project, homelab-ui, frontend]
updated: 2026-11-15
---

# Homelab UI

> The homelab's app for everyone at home: one Angular app, served by the gateway, that shows each person only the pages they were given — assistants like Kitchen and Travel for the family, every tool of the [[Homelab]] for admins — in one of five themes, on the phone, the tablet and the computer.

## In one picture
![[Homelab UI.canvas]]

## Why it exists
- **One place for everything.** Grafana, Prometheus, Kafka UI and the others each have their own look and their own tab. Rebuilding them as pages gives one coherent control center ([[Homelab decisions]], 2026-11-07).
- **The agent in context.** Ask about an error on the Logs page without leaving it.
- **A real frontend to learn from.** Signals, dependency injection, lazy routes, streaming, a canvas editor, a strict layering rule — the skills of a modern frontend engineer.

## What it does
- **Home** (`/`): a greeting, the person's assistants as full-colour cards (a waiting plan shows "1 plan to approve"), their pages as tiles, one Ask bar; admins also get the control center below.
- **People** (`/people`, admins): accounts, the Access grid (people × pages), Add a person with a temporary password.
- **Appearance:** Bright, Midnight, Sand, Pastel, Contrast or "Match my device", saved on the account.
- **Control center** (on Home, admins): alerts, server gauges, data, LLM, Kubernetes, busiest containers, errors.
- **Status** (`/status`): every homelab container, Ready / Not ready / Unknown, with links and connection addresses.
- **Tool pages:** Dashboards, Metrics, Logs, Traces, Kafka, Pipeline, Models, Tools, Account, Tool UIs, Kubernetes (admins).
- **Assistants** (`/agent/<name>`): one conversation per agent, a plan shown with **Go ahead / Change it / Not now**; the **assistant drawer** beside tool pages — streamed token by token from [[Agent runtime]].
- **Tasker:** blocks on a canvas (Trigger, HTTP, Code, Transform, Output), run in the browser, saved per account in PostgreSQL through PostgREST.

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

## Where it stands (2026-11-08)
- **Released:** v1.1.3 (Tool UIs page, block names in Tasker, Kubernetes pod logs fix).
- **On `develop`:** Headlamp on the Status page, agent API docs on `:8100`.
- **Next:** see the [[Log]].
