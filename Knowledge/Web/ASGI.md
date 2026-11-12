---
type: concept
domain: Web
level: intermediate
tags: [concept, web, python]
updated: 2026-11-08
---

# ASGI

> The Asynchronous Server Gateway Interface: the contract between a Python web **server** (Granian, Uvicorn, Hypercorn) and a web **application/framework** (Litestar, FastAPI, BlackSheep). An app is an async callable `app(scope, receive, send)`.

## Why it matters
It separates *serving* (sockets, HTTP parsing, workers) from *the app*. You can swap the server or the framework independently, and async I/O lets one process handle many slow requests (LLM streams) at once.

## How it works
- `scope`: the connection (type `http`/`websocket`/`lifespan`, path, headers); `receive()` gets body chunks/disconnects; `send()` sends start + body chunks.
- **Middleware** wraps an app in another ASGI app (request id, CORS).
- **Lifespan** events: start-up/shutdown hooks (open pools, load tools).
- Successor of WSGI (sync, one request per thread).
- **Workers:** a server runs N processes; each has its own app and memory.

## In our projects
Granian serves every Python service (agent-runtime, agent-toolbox, the benchmark's shop), configured with `GRANIAN_*` variables; pycraftcore's `RequestIDMiddleware` is ASGI middleware ([[pycraftcore web toolkits]]).

## Check yourself
1. What do `receive` and `send` carry for a streaming response?
> [!success]- Answer
> `receive` brings the request body chunks, then an `http.disconnect` message if the client leaves. `send` first sends `http.response.start` (status and headers), then one `http.response.body` per chunk with `more_body: True`, and a last one with `more_body: False`.
2. Why does `GRANIAN_WORKERS=2` double memory?
> [!success]- Answer
> Each worker is a separate process with its own copy of the app: imports, caches, connection pools and loaded tools. Two workers, about twice the memory.

## Go further
- [ASGI specification](https://asgi.readthedocs.io/en/latest/specs/main.html).
- [Granian](https://github.com/emmett-framework/granian).
