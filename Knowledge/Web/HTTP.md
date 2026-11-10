---
type: concept
domain: Web
level: beginner
tags: [concept, web]
updated: 2026-11-10
---

# HTTP

> The language browsers, apps and services speak: a client sends a **request** (method, path, headers, optional body); the server answers with a **response** (status code, headers, optional body). Every API, page and tool call in our projects is HTTP underneath.

## Why it matters
Most bugs you'll debug at the edges — a 401, a 403, a 406, a CORS error, a stream that stalls — are HTTP details. Reading a raw exchange fluently is a core skill.

## How it works
```text
POST /v1/stream HTTP/1.1                 ← method, path, version
Host: agent-runtime:8000                 ← headers
Content-Type: application/json
X-Request-ID: my-conversation

{"message": "hi", "model_name": "qwen3-8b", "request_id": "my-conversation"}   ← body

HTTP/1.1 200 OK                          ← status
Content-Type: text/event-stream
…
```
| Methods | Meaning | Safe? Idempotent? |
|---|---|---|
| GET | read | safe, idempotent |
| POST | create / run something | neither |
| PUT | replace | idempotent |
| PATCH | change part | neither (usually) |
| DELETE | remove | idempotent |

| Status | Means | Ours |
|---|---|---|
| 2xx | success (200 OK, 201 Created, 202 Accepted, 204 No Content) | oauth2-proxy answers 202 = signed in |
| 3xx | go elsewhere (302 redirect, 304 not modified) | redirect to the sign-in page |
| 4xx | your request is wrong (400, 401 not signed in, 403 forbidden, 404, 405 method, 406 can't produce the `Accept`ed type, 421 wrong host, 422 invalid body, 429 slow down) | 403 without `X-Homelab-Request`; 421 at the toolbox |
| 5xx | the server failed (500, 502 bad gateway, 503 unavailable, 504 timeout) | 503 from readiness before boot |

- **Headers that matter here:** `Host` (which site), `Cookie`/`Set-Cookie`, `Authorization`, `Content-Type`/`Accept`, `Origin`, `X-Forwarded-*`, `X-Request-ID`.
- **HTTP/1.1 vs 2 vs 3:** same semantics; 2 multiplexes many requests on one connection; 3 runs over QUIC (UDP).
- **Stateless:** each request stands alone; sessions are built on cookies or tokens ([[Cookies and sessions]]).
- Tools: `curl -v` (see everything), `curl -N` (don't buffer a stream), the browser's network tab.

## In our projects
- Caddy routes by host, port and path ([[Homelab gateway and sign-in]]).
- The agent streams over one long HTTP response ([[Server-sent events]]).
- homelab-ui's Kubernetes logs page hit **406** because it asked for JSON from an endpoint that returns text ([[Homelab failure modes]]).

## Check yourself
1. What's the difference between 401 and 403?
2. Why is PUT idempotent but POST not, and why does that matter for retries ([[Retry and backoff]])?
3. Which header tells Caddy which site you want when several share one IP?

## Go further
- [MDN: an overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview), [HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).
- [Julia Evans: HTTP zine](https://wizardzines.com/zines/http/).
