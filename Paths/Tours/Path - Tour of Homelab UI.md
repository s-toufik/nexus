---
type: path
track: Tours
time: ~4 h
projects: ["[[Homelab UI]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of Homelab UI

> **Goal:** know homelab-ui end to end — every page and what it calls, how the code is organised, how state and streaming work, how it ships — and the principles it's built on.
> **Time:** ~4 h. **Before:** [[Path - Tour of the homelab]] helps. **Then:** [[Path - Tour of the agent runtime]] · [[Path - The frontend]]. **All paths:** [[Paths]]

## 1. What it is, and why · ~45 min
**Read:** [[Homelab UI]] and its canvas.

**Do:** 👀 Visit every page from the menu once: control center, Status, Dashboards, Metrics, Logs, Traces, Kafka, Pipeline, Models, Tools, Account, Tool UIs, Agent, Tasker (and Kubernetes if admin). Open the assistant drawer on the Logs page.

**Check:**
1. Why rebuild each tool as a page instead of embedding it?
> [!success]- Answer
> Iframes can't share the theme, the layout or the assistant; native pages give one coherent control center with the agent beside every page ([[Homelab UI decisions]]).

## 2. What each page talks to · ~45 min
**Read:** [[Homelab UI structure]] (*Backend addresses*), then [[Homelab gateway and sign-in]] (*The Caddyfile in five patterns*).

**Do:** 👀 In the browser's network tab on Metrics, Logs, Kafka and Agent: note each `/api/<tool>/…` call and its status.

**Check:**
1. Which header does every write carry, and why does the gateway insist on it?
> [!success]- Answer
> `X-Homelab-Request: 1`. A cross-site page can't add a custom header without CORS approval, so the gateway knows the write comes from the UI itself (CSRF protection).

## 3. How the code is organised · ~1 h
**Read:** [[Homelab UI structure]] · [[homelab-ui]]

**Do:** 👀 Open `src/app/app.config.ts`, `shell/application/homelab-features.ts`, then one feature folder (`features/prometheus/`).

**Check:**
1. You add a page. Which files outside its own feature folder change?
> [!success]- Answer
> `app.routes.ts` (its lazy route) and `app.config.ts` (its `provideXxxFeature()`). The shell doesn't change.

## 4. State, streaming and Tasker · ~1 h
**Read:** [[Homelab UI state and streaming]] · [[Homelab UI Tasker]]

**Check:**
1. Follow one agent answer from the server to the screen.
> [!success]- Answer
> `AgentApiService.stream()` POSTs to `/api/agent/v1/stream`, reads the body with a reader, splits frames on blank lines and yields `StreamEvent`s; `AgentStore` updates its signals per event (`status` → progress, `token` → append, `final` → replace and keep metadata); templates reading those signals update.

## 5. How it ships · ~30 min
**Read:** [[Homelab UI delivery]] · [[Homelab UI guides]]

## 6. The principles inside
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Single-page app behind a gateway | [[Single-page application]] | nginx image, `/api/*` same origin | [[Path - The frontend]] |
| Components, DI, lazy routes | [[Angular]], [[Dependency injection]] | `app.config.ts`, `app.routes.ts`, `HOMELAB_FEATURES` | [[Path - The frontend]] |
| Reactive state | [[Signals]] | `AgentStore` | [[Path - The frontend]] |
| Feature-first layering | [[Feature-first architecture]] | `features/<page>/{domain,application,infrastructure,pages}` | [[Path - Design that lasts]] |
| Ports and adapters on the frontend | [[Hexagonal architecture]] | Tasker's `CanvasEngine` | [[Path - Design that lasts]] |
| Streaming over HTTP | [[Server-sent events]] | `agent-api.service.ts` | [[Path - Serving HTTP well]] |
| CSRF defence, sessions | [[CSRF]], [[Cookies and sessions]] | `GatewayApi`, `GatewaySession` | [[Path - The front door]] |
| Data security in the database | [[Row-level security]] | Tasker via PostgREST | [[Path - Data]] |
| Multi-platform images | [[Container image]] | `devops/docker/Dockerfile` | [[Path - Shipping changes]] |

**Milestone:** you can explain any page — what it calls, how its state flows, where its code is.
