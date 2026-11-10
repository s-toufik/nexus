---
type: path
track: Applications
time: ~8 h
projects: ["[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - The frontend

> **Goal:** read and extend homelab-ui confidently: how an Angular app is organised, how state flows, how it streams the agent, how it's tested and shipped.
> **Time:** ~8 h.
> **Before:** [[Path - Networks you can reason about]]. **Then:** [[Path - Models]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. Why does `/api/*` answer 401 instead of redirecting?
> [!success]- Answer
> It's called by the app's `fetch()`; a 401 lets the app send the browser to sign in, while a redirect would hand it an HTML page.

## 1. An app in the browser · ~1.5 h
**Read:** [[Single-page application]] · [[Angular]]

**Do** (in `homelab-ui`):
1. `make install`, then `make run` → `http://localhost:4200`. The Agent page works (it calls `:8000` directly); most tool pages don't — they need the gateway.
2. Browser devtools → Network: navigate to Metrics → a new JS chunk loads (lazy route).

**Check:**
1. Why do tool pages fail under `npm start` but work on the homelab?
> [!success]- Answer
> In `direct` mode the app calls tools on their ports; their APIs (Prometheus' query API, PostgREST, `/api/health`) are reachable only behind the gateway's `/api/<tool>/` routes, with the session cookie.

## 2. Structure · ~1.5 h
**Read:** [[Feature-first architecture]] · [[Homelab UI structure]]

**Do:**
1. 👀 `src/app/app.config.ts` → every `provideXxxFeature()`.
2. 👀 `src/app/shell/application/homelab-features.ts` → the `HOMELAB_FEATURES` token, `multi: true`.
3. 👀 One feature, e.g. `features/kafka-ui/`: its `domain/`, `application/`, `infrastructure/`, `pages/`, and `kafka-ui.feature.ts`.

**Check:**
1. How does the menu list Kafka without the shell importing the Kafka feature?
> [!success]- Answer
> The feature registers itself with `provideHomelabFeature(...)` — a multi provider for `HOMELAB_FEATURES`. The shell injects the token and gets an array of every registered feature.

## 3. State and streaming · ~2 h
**Read:** [[Signals]] · [[Homelab UI state and streaming]]

**Do:**
1. 👀 `features/agent/application/agent.store.ts` → the signals, `canSend`, `phase`, the preferences `effect`.
2. 👀 `features/agent/infrastructure/api/agent-api.service.ts` → the `async *stream` generator splitting frames on `\n\n`.
3. Open the Agent page and the assistant drawer side by side on the homelab: same conversation.

**Check:**
1. Why are the Agent page and the drawer always in sync?
> [!success]- Answer
> Both inject the same root singleton `AgentStore`; its signals are the single source of truth.

## 4. An editor in plain TypeScript · ~1.5 h
**Read:** [[Homelab UI Tasker]]

**Do:**
1. 👀 `features/tasker/domain/graph-execution.ts` and its spec.
2. On the homelab, build a 3-block workflow (Trigger → HTTP → Output), run it, select each block to see its result.

**Check:**
1. A block in the middle fails. What happens to the blocks after it?
> [!success]- Answer
> They never run: only a successful block queues the blocks it connects to. The failed block's error is recorded and shown.

## 5. Tested and shipped · ~1.5 h
**Read:** [[Homelab UI delivery]] · [[Homelab UI - Run, test and build]]

**Do:**
1. `make check` → prettier, `tsc`, vitest green.
2. 👀 `devops/docker/Dockerfile`: the two stages and `$BUILDPLATFORM`.

**Check:**
1. Why would a plain `docker build` on your Mac break on the server?
> [!success]- Answer
> It would produce an arm64-only image; the x86-64 server can't run it (`exec format error`). The Dockerfile builds the static files once, then makes amd64 and arm64 nginx images.

**Milestone:** you can add a page and explain how data flows from the gateway to a signal to the screen.
