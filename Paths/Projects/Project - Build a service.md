---
type: path
track: Projects
time: ~10 h
projects: ["[[pycraftcore]]", "[[Archetype]]"]
tags: [path, project]
updated: 2026-11-10
---

# Project - Build a service

> **Goal:** build a small service the way ours are built — hexagonal, configured, logged, streamed, tested, boundaries enforced. Not deployed: the point is the design.
> **Before:** [[Path - Design that lasts]] · [[Path - Serving HTTP well]]. **Then:** [[Project - A feature across three repos]]. **All paths:** [[Paths]]

## The service: `reading-list`
A tiny API for your reading list (it could feed [[Sources]] one day).
| Endpoint | Does |
|---|---|
| `POST /v1/items` | Add `{title, link, kind}`; validate; store |
| `GET /v1/items?status=to-read` | List |
| `PATCH /v1/items/{id}` | Change status |
| `GET /v1/items/events` | SSE: an event per change, heartbeats when quiet |
| `/actuator/health`, `/health/readiness` | Health |

## The rules
1. Start from [[Archetype - Start a new project]] (Python).
2. Domain: `Item`, status rules (e.g. `done` needs a `read` date) — no framework imports.
3. Application: use cases (`AddItem`, `ListItems`, `ChangeStatus`, `FollowChanges`) and ports (`ItemRepository`, `ChangeFeed`).
4. Adapters: SQLite via pycraftcore `repository`; the API with `pycraftcore.web_litestar` (`create_app`, `actuator_router`, `event_stream`, `with_heartbeat`).
5. Configuration with pycraftcore: a database connector, a server entry with `base_path`, `docs`.
6. Tests: unit tests with a fake repository; one architecture test (domain and application import no framework); one API test.

## Done when
- `make check` is green.
- `curl -N …/v1/items/events` shows an event when you add an item from another terminal, and a heartbeat every 15 s.
- You can point at each file and say which ring it's in, and why.

## Reward
You've built what pycraftcore exists for. Compare your service with [[Agent toolbox layers]] and write in a [[Log]] entry one thing you'd do differently now.
