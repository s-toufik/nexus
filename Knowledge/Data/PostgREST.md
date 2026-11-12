---
type: concept
domain: Data
level: intermediate
tags: [concept, data, api]
updated: 2026-11-08
---

# PostgREST

> A server that turns a PostgreSQL schema into a REST API automatically: tables become endpoints, `GET /workflows?owner=eq.alice` becomes a `SELECT`, and the database's roles and policies are the API's security.

## Why it matters
A lot of backend code is just "check who you are, then CRUD on a table". PostgREST removes that layer: the schema *is* the API, and authorisation lives where the data is. It's a different architecture to know — and a good lesson in pushing logic down to the database.

## How it works
- Connects as an **authenticator** role, then for each request `SET ROLE` to the request's role (anonymous role, or one from a JWT).
- Exposes only the configured schemas (`PGRST_DB_SCHEMAS`).
- Query syntax: filters `?col=eq.value`, `select=`, `order=`, `limit=`; `POST` inserts, `PATCH` updates, `DELETE` deletes; `Prefer: return=representation`.
- **Pre-request function** runs before every request (`PGRST_DB_PRE_REQUEST`) — a hook for checks.
- Request headers available in SQL: `current_setting('request.headers')`.
- Schema cache reloaded by `NOTIFY pgrst, 'reload schema'`.

## In our projects
Tasker's API: schema `tasker`, anonymous role `tasker_web`, pre-request `tasker.check_request` (gateway secret + user present), RLS for per-account rows, OpenAPI disabled, behind Caddy at `/api/tasker/` ([[Homelab data]]).

## Check yourself
1. What would happen if `PGRST_DB_PRE_REQUEST` were removed?
> [!success]- Answer
> Nothing would check that a request came through Caddy. Anyone reaching PostgREST directly could set `Remote-User` to someone else's name, and RLS would show them that person's rows, since the policies trust that header.
2. Where does PostgREST get the identity it passes to SQL?
> [!success]- Answer
> From the request's headers, which PostgREST exposes as `request.headers`: `Remote-User`, set by Caddy from your signed-in session. `current_username()` reads it, after `check_request()` has proved, with `X-Gateway-Secret`, that Caddy set it.

## Go further
- [PostgREST docs](https://docs.postgrest.org/), especially [authentication](https://docs.postgrest.org/en/stable/references/auth.html) and [API](https://docs.postgrest.org/en/stable/references/api.html).
