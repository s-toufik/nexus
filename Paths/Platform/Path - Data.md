---
type: path
track: Platform
time: ~8 h
projects: ["[[Homelab]]", "[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Data

> **Goal:** know where every byte lives, who may read it, how the schema changes, and how to get it back.
> **Time:** ~8 h.
> **Before:** [[Path - Containers and Kubernetes]]. **Then:** [[Path - Seeing inside]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. Why is a database run by an operator rather than a plain StatefulSet?
> [!success]- Answer
> The operator knows how to operate the database: roles, passwords, TLS, failover, backups — reconciled from a declared `Cluster` object.

## 1. Roles and privileges · ~1.5 h
**Read:** [[PostgreSQL roles and privileges]] · [[Homelab data]]

**Do:**
1. 👀 `make psql`, then `\du` → every role and its attributes; `\dn+ tasker` → who may use the schema.
2. 👀 `SELECT rolname, rolinherit FROM pg_roles WHERE rolname IN ('postgrest','tasker_web','mcp');`
3. 👀 Read `repository/postgres/values.yaml.gotmpl` (`roles:`) and `repository/db-migrate/migrations/005_grant_permissions.sql`.

**Check:**
1. Why is `postgrest` `NOINHERIT`?
> [!success]- Answer
> It logs in with almost no rights of its own and only gains `tasker_web`'s rights when it explicitly switches role for a request. A leaked `postgrest` password alone can't read Tasker's tables.

## 2. Row-level security · ~1.5 h
**Read:** [[Row-level security]] · [[PostgREST]]

**Do** (in `make psql`):
1. 👀 `SET ROLE tasker_web; SELECT count(*) FROM tasker.workflows; RESET ROLE;` → `0`, though your workflows exist.
2. 👀 `SELECT count(*) FROM tasker.workflows;` as `postgres` → the real count.

**Check:**
1. Why does `tasker_web` see 0 rows?
> [!success]- Answer
> The policy is `owner = tasker.current_username()`, which reads `remote-user` from PostgREST's request headers. In psql there are no request headers, so it's NULL and no row matches. (Superuser `postgres` bypasses RLS.)

2. Someone calls PostgREST's pod directly with `Remote-User: alice`. What stops them?
> [!success]- Answer
> `tasker.check_request()` runs before every request and requires `X-Gateway-Secret` to match a secret only Caddy knows → 403. And Caddy strips `Remote-User` from clients.

## 3. Changing the schema · ~1 h
**Read:** [[Database migrations]] · [[Homelab - Migrate the database]]

**Do:**
1. 👀 `make migrate-status` → five files `[X]`.
2. 👀 Read `003_create_auth_functions.sql`: its `migrate:up` and `migrate:down`.

**Check:**
1. Why never edit an applied migration?
> [!success]- Answer
> dbmate records it as applied and won't run it again, so the edit never reaches existing databases — and a fresh database would differ from the old ones. Write a new migration instead.

## 4. Documents and events · ~1.5 h
**Read:** [[MongoDB]] · [[Kafka]] · [[Homelab - Connect to the databases]]

**Do:**
1. 👀 `make mongosh`, then `show dbs`, `use agent_runtime`, `show collections` → where the agent's conversations live.
2. 👀 Connect Compass from your Mac (guide's *MongoDB* section).
3. 👀 `make topics`, `make groups`.

**Check:**
1. Why are conversations in MongoDB but Tasker's workflows in PostgreSQL?
> [!success]- Answer
> A conversation checkpoint is a self-contained, evolving document read and written whole by one service; Tasker's data is per-account rows that need access control in the database (RLS) and a REST API from the schema (PostgREST).

## 5. Getting it back · ~1.5 h
**Read:** [[Backups and restores]] · [[Homelab - Back up and restore]]

**Do** ✋ (safe: a scratch database):
1. `make backups` → note last night's `homelab_<date>.dump`.
2. `make psql`, `CREATE DATABASE scratch;`, `\q`.
3. Restore into it, not over `homelab`: `kubectl -n homelab exec -i "$(kubectl -n homelab get pod -l cnpg.io/cluster=postgres,cnpg.io/instanceRole=primary -o name)" -c postgres -- pg_restore -d scratch --no-owner < <(sudo cat /var/backups/homelab/postgres/homelab_<date>.dump)`.
4. `make psql`, `\c scratch`, `SELECT count(*) FROM tasker.workflows;` → the count of last night.
5. Undo: `\c homelab`, `DROP DATABASE scratch;`.

**Check:**
1. What are our RPO and RTO, and what's still missing from 3-2-1?
> [!success]- Answer
> RPO up to 24 h (nightly), RTO minutes per database. The backups are on the same disk as the data: no off-site copy, so 3-2-1 isn't met.

**Milestone:** you can say where any piece of data lives, who can read it, and restore it — and you've done a restore.
