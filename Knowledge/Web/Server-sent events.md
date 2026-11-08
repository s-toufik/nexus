---
type: concept
domain: Web
level: intermediate
tags: [concept, web, streaming]
updated: 2026-11-08
---

# Server-sent events

> A server keeps an HTTP response open and writes events into it as text: `event: <type>`, `data: <payload>`, a blank line between events. One-way, server → client, over plain HTTP — the standard way to stream LLM tokens.

## Why it matters
Users shouldn't stare at a spinner for 20 seconds. SSE streams progress and partial answers through ordinary HTTP infrastructure (proxies, auth, cookies) with no extra protocol.

## How it works
```text
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

event: status
data: {"content":"Formulating a plan"}

: heartbeat

event: final
data: {"content":"…","metadata":{"outcome":"answered"}}
```
- Lines starting with `:` are comments — used as **heartbeats** so idle proxies don't close the connection.
- Browser `EventSource` handles GET only and reconnects automatically; for POST bodies, read `fetch()`'s body stream and parse frames yourself.
- **Proxies must not buffer:** Caddy's `flush_interval -1`; nginx `proxy_buffering off`.
- **Disconnect:** the server should notice the client left and stop work.
- vs **WebSockets:** two-way, own protocol, more moving parts; SSE suffices for server push.

## In our projects
- agent-runtime `POST /v1/stream`: `status`, `token`, `final`, `error`, `complete`, heartbeat every 15 s ([[Agent runtime - Call the API]]).
- homelab-ui parses frames from `fetch` with an async generator ([[Homelab UI state and streaming]]).
- pycraftcore `event_stream`, `with_heartbeat`, `cancel_on_disconnect` ([[pycraftcore web toolkits]]).
- The benchmark's two stream endpoints.

## Check yourself
1. Why not `EventSource` for the agent?
2. What breaks if a proxy buffers the response?

## Go further
- [MDN: using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).
- [HTML spec: event streams](https://html.spec.whatwg.org/multipage/server-sent-events.html).
