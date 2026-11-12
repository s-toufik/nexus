---
type: concept
domain: Web
level: beginner
tags: [concept, web, api]
updated: 2026-11-10
---

# REST APIs and OpenAPI

> **REST** is a style for HTTP APIs: resources named by URLs (`/v1/orders/42`), manipulated with HTTP methods, represented as JSON. **OpenAPI** is a machine-readable description of an API (paths, parameters, bodies, responses) from which docs (Swagger UI), clients and tests are generated.

## Why it matters
APIs are contracts between teams and programs. A clear, versioned, documented contract lets clients (homelab-ui, the evaluation, Postman) evolve independently of servers.

## How it works
- **Resources and verbs:** `GET /orders`, `POST /orders`, `GET /orders/{id}`, `PATCH`, `DELETE` ([[HTTP]]).
- **Versioning:** `/v1/…` so breaking changes go to `/v2/` while old clients keep working.
- **Errors as data:** a consistent body, e.g. `{"detail": "…"}`, with the right status.
- **Validation at the edge:** bodies checked against a schema ([[Data validation with pydantic and msgspec]]).
- **Evolution rules:** adding fields is safe if clients ignore unknown ones; removing or renaming breaks them.
- **Not everything is REST:** streams (SSE), RPC-style actions (`POST /v1/stream`), MCP's JSON-RPC.
- **OpenAPI:** frameworks generate it from routes and schemas; `/docs` serves Swagger UI.

## In our projects
- agent-runtime: `/v1/stream`, `/v1/models`, `/actuator/*`; `/docs` with `WEB_DOCS=true`; clients must ignore unknown events and outcomes ([[Agent runtime - Call the API]]).
- pycraftcore: `{"detail": …}` errors, docs only when `api.docs` is on ([[pycraftcore web toolkits]]).
- PostgREST turns tables into a REST API ([[PostgREST]]).

## Check yourself
1. Why must a client ignore fields it doesn't know?
> [!success]- Answer
> So the server can add fields, events or outcomes without breaking it. Adding is the safe way to evolve an API only if clients don't fail on what they don't know.
2. Is `POST /v1/stream` RESTful? Does it matter?
> [!success]- Answer
> Not strictly: it's an RPC-style action ("run this turn and stream the result"), not a resource changed with a verb. It doesn't matter much: what matters is a clear, documented, versioned contract. Forcing a stream into REST resources would only make it harder to use.

## Go further
- [Microsoft REST API guidelines](https://github.com/microsoft/api-guidelines), [OpenAPI specification](https://spec.openapis.org/oas/latest.html).
