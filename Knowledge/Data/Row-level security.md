---
type: concept
domain: Data
level: intermediate
tags: [concept, data, postgresql, security]
updated: 2026-11-08
---

# Row-level security

> A PostgreSQL feature that filters rows per query according to **policies**: "a user sees and changes only rows where `owner` is them". The database enforces it on every query, whatever the application asks.

## Why it matters
Multi-user apps usually filter in code (`WHERE owner = ?`). Forget it once, and one user sees another's data. RLS makes the database the guard, so an application bug can't leak rows — authorisation in depth.

## How it works
```sql
ALTER TABLE t ENABLE ROW LEVEL SECURITY;
ALTER TABLE t FORCE ROW LEVEL SECURITY;          -- also for the table owner
CREATE POLICY owner_only ON t FOR ALL TO app_role
  USING (owner = current_user_name())            -- which rows are visible / can be updated or deleted
  WITH CHECK (owner = current_user_name());      -- which rows may be written
```
- With RLS on and no policy for a role, it sees **nothing** (fail closed).
- `USING` filters reads, updates, deletes; `WITH CHECK` validates inserts and updates.
- Superusers and roles with `BYPASSRLS` skip it; owners skip it unless `FORCE`.
- The "who" can be the database user, or — for a web app with one connection role — a value set per request (a setting, a JWT claim).

## In our projects
- Tasker's `workflows` and `block_favorites`: policies `owner = tasker.current_username()` for role `tasker_web` ([[Homelab data]]).
- `current_username()` reads `remote-user` from PostgREST's `request.headers` — set by Caddy, from the signed-in session; `check_request()` first proves the request came through Caddy (the gateway secret).
- `owner` defaults to the current user, so the UI never sends it.

## Pitfalls we met
- An RLS policy is only as trustworthy as the identity it reads: that's why the gateway secret exists.

## Check yourself
1. Why `FORCE ROW LEVEL SECURITY`?
> [!success]- Answer
> The table's owner skips RLS by default. `FORCE` applies the policies to the owner too, so a connection as the owner, a migration or a mistake, can't read every row silently.
2. What does a role see on a table with RLS enabled and no policy for it?
> [!success]- Answer
> Nothing: no row is visible and no write is allowed. RLS fails closed.

## Go further
- [Row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).
- [PostgREST: row level security](https://docs.postgrest.org/en/stable/explanations/db_authz.html).
