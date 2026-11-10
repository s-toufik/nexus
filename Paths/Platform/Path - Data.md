---
type: path
track: Platform
time: ~9 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Data

> **Goal:** know where every byte lives, who may read it, how the schema changes, and how to get it back.
> **Time:** ~9 h.
> **Before:** [[Path - Containers and Kubernetes]]. **Then:** [[Path - Seeing inside]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| One role per app, least privilege | PostgreSQL roles `postgrest`, `tasker_web`, `keycloak`, `mcp` |
| Authorisation in the database | RLS on `tasker.workflows`, `tasker.block_favorites` |
| A REST API from a schema | PostgREST over `tasker` |
| Versioned schema changes | dbmate migrations `001`…`005` |
| Documents vs relations | MongoDB for the agent's conversations, PostgreSQL for Tasker |
| An event log | Kafka, KRaft, 7 days |
| Backups you have restored | nightly `pg_dump` / `mongodump` CronJobs |

## Warm-up (optional, from the paths before)
1. Why is PostgreSQL run by an operator rather than a plain StatefulSet?
> [!success]- Answer
> The operator knows how to operate it: roles, passwords, TLS, failover, backups — reconciled from a declared `Cluster` object.

## 1. Roles and privileges · ~2 h

### Learn
**Definitions**
- **Role** — PostgreSQL's user *and* group concept; `LOGIN` roles can connect ([[PostgreSQL roles and privileges]]).
- **Privilege** — a right on an object: `USAGE` on a schema, `SELECT/INSERT/UPDATE/DELETE` on a table, `EXECUTE` on a function.
- **Membership / INHERIT** — a role can be granted another; with `NOINHERIT` it must `SET ROLE` to use the granted rights.
- **Owner** — the role that created an object; can do anything to it.
- **Predefined roles** — `pg_read_all_data`, `pg_write_all_data` (rows only, no schema changes).

**How it works**
CloudNativePG creates and keeps the roles declared in `repository/postgres/values.yaml.gotmpl`, with passwords from `basic-auth` Secrets; migrations grant table rights.

**Example from our projects** — the roles (`repository/postgres/values.yaml.gotmpl`):
```yaml
roles:
  - name: tasker_web
    login: false
  - name: postgrest
    login: true
    inherit: false
    inRoles: [tasker_web]
    passwordSecret: { name: pg-role-postgrest }
  - name: mcp
    login: true
    inRoles: [pg_read_all_data{{ if .Values.mcp.postgres.write }}, pg_write_all_data{{ end }}]
    passwordSecret: { name: pg-role-mcp }
```
and the grants (`repository/db-migrate/migrations/005_grant_permissions.sql`, excerpt):
```sql
REVOKE ALL ON SCHEMA tasker FROM PUBLIC;
GRANT USAGE ON SCHEMA tasker TO tasker_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasker.workflows, tasker.block_favorites TO tasker_web;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```
1. `tasker_web` can't log in: it's a set of rights PostgREST *becomes*.
2. `postgrest` logs in with nothing (`inherit: false`) and switches to `tasker_web` per request.
3. `mcp` reads everything (and writes rows only when the switch says so) — but not Tasker's rows (RLS, next lesson).
4. `REVOKE … FROM PUBLIC` — by default every role could use schema `public`; we close it.

**Common mistake** — every app using the owner or `postgres`: one leaked password exposes everything.

### Do
1. 👀 `make psql`, `\du`, `\dn+ tasker`.
2. 👀 `SELECT rolname, rolinherit FROM pg_roles WHERE rolname IN ('postgrest','tasker_web','mcp');`

### Check
1. Why is `postgrest` `NOINHERIT`?
> [!success]- Answer
> It logs in with almost no rights and gains `tasker_web`'s only when it switches role for a request: a leaked `postgrest` password alone can't read Tasker's tables.

## 2. Row-level security · ~2 h

### Learn
**Definitions**
- **RLS** — table-level policies that filter rows per query ([[Row-level security]]).
- **Policy** — `USING` (which rows are visible/updatable) and `WITH CHECK` (which rows may be written).
- **FORCE ROW LEVEL SECURITY** — applies policies to the table owner too.
- **Pre-request function** — PostgREST runs it before every request ([[PostgREST]]).

**How it works**
```text
Caddy: X-Gateway-Secret + Remote-User ─► PostgREST: SET ROLE tasker_web; request.headers = {...}
  ─► tasker.check_request(): secret right? user present? ─► query ─► policy owner = tasker.current_username()
```

**Example from our projects** — the identity function and the policy (migrations 003 and 004):
```sql
CREATE FUNCTION tasker.current_username() RETURNS text LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.headers', true)::json ->> 'remote-user', '')
$$;

ALTER TABLE tasker.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasker.workflows FORCE ROW LEVEL SECURITY;
CREATE POLICY workflows_owner_only ON tasker.workflows
    FOR ALL TO tasker_web
    USING (owner = tasker.current_username())
    WITH CHECK (owner = tasker.current_username());
```
1. `current_setting('request.headers', true)` — PostgREST puts the HTTP headers in a setting; `true` = NULL if absent.
2. `USING` hides other people's rows; `WITH CHECK` refuses writing a row with another owner.
3. `owner` defaults to the current user (003), so the UI never sends it.

**Common mistake** — RLS without `FORCE`: the table owner (who runs migrations) bypasses it — fine for migrations, a hole if an app connects as the owner.

### Do (in `make psql`)
1. 👀 `SET ROLE tasker_web; SELECT count(*) FROM tasker.workflows; RESET ROLE;` → `0`.
2. 👀 `SELECT count(*) FROM tasker.workflows;` → the real count.

### Check
1. Why does `tasker_web` see 0 rows in psql?
> [!success]- Answer
> No request headers in psql, so `current_username()` is NULL and no row matches. `postgres` is a superuser and bypasses RLS.

2. Someone calls PostgREST's pod directly with `Remote-User: alice`. What stops them?
> [!success]- Answer
> `check_request()` requires `X-Gateway-Secret` to match the secret only Caddy holds → 403; and Caddy strips `Remote-User` from clients.

## 3. Changing the schema · ~1 h

### Learn
**Definitions**
- **Migration** — a versioned SQL file with `-- migrate:up` and `-- migrate:down` ([[Database migrations]]).
- **dbmate** — applies pending files in order, recording them in `schema_migrations`.
- **Schema cache** — PostgREST's view of the tables; reloaded by `NOTIFY pgrst, 'reload schema'`.

**How it works** — the `db-migrate` release is jobs-only: on each deploy a Job runs `dbmate --wait migrate` with the files mounted from git.

**Example from our projects** — `repository/db-migrate/values.yaml.gotmpl` mounts every migration file:
```yaml
configFiles:
  migrations:
    mountPath: /db/migrations
    files:
{{- range $path := readDir "migrations" }}
      {{ base $path }}: |
        {{- readFile $path | nindent 8 }}
{{- end }}
```

**Common mistake** — editing an applied migration: it never runs again, so databases diverge. Write a new one.

### Do
👀 `make migrate-status` → five `[X]`; read `003_create_auth_functions.sql`.

## 4. Documents and events · ~1.5 h

### Learn
**Definitions**
- **Document database** — JSON-like documents in collections, flexible fields ([[MongoDB]]).
- **Topic / partition / offset / consumer group** — Kafka's log, its shards, a position in it, readers sharing the work ([[Kafka]]).
- **Advertised listener** — the address Kafka tells clients to use.

**Example from our projects** — Kafka's two listeners (`message-broker/kafka/values.yaml.gotmpl`):
```yaml
KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,EXTERNAL://<HOMELAB_DOMAIN>:9094
```
Pods are told `kafka:9092`; tailnet devices `<HOMELAB_DOMAIN>:9094`. A client given the wrong one can't connect after its first request.

**Common mistake** — Kubernetes' `KAFKA_PORT=tcp://…` service variables read as Kafka settings → `enableServiceLinks: false`.

### Do
👀 `make mongosh`: `show dbs`, `use agent_runtime`, `show collections`; `make topics`; `make groups`.

### Check
1. Why are conversations in MongoDB but Tasker's workflows in PostgreSQL?
> [!success]- Answer
> A conversation checkpoint is a self-contained, evolving document read and written whole by one service; Tasker's data is per-account rows that need database-enforced access (RLS) and a REST API from the schema.

## 5. Getting it back · ~2 h

### Learn
**Definitions**
- **Logical backup** — a dump of contents (`pg_dump`, `mongodump`); **RPO** — how much you may lose; **RTO** — how long to recover; **3-2-1** — 3 copies, 2 media, 1 off-site ([[Backups and restores]]).

**Example from our projects** — the PostgreSQL backup CronJob's command (`repository/backups/values.yaml.gotmpl`, excerpt):
```bash
for db in homelab keycloak; do
  pg_dump --format=custom --dbname="$db" --file="$dir/${db}_$stamp.dump.tmp"
  mv "$dir/${db}_$stamp.dump.tmp" "$dir/${db}_$stamp.dump"
done
find "$dir" -name '*.dump' -mtime +"$KEEP_DAYS" -print -delete
```
Write to `.tmp`, rename when complete (a half-written dump never looks finished), delete dumps older than 14 days.

**Common mistake** — never testing a restore. A backup you haven't restored is a hope.

### Do ✋ (a scratch database)
1. `make backups` → last night's `homelab_<date>.dump`.
2. `make psql`, `CREATE DATABASE scratch;`, `\q`.
3. `kubectl -n homelab exec -i "$(kubectl -n homelab get pod -l cnpg.io/cluster=postgres,cnpg.io/instanceRole=primary -o name)" -c postgres -- pg_restore -d scratch --no-owner < <(sudo cat /var/backups/homelab/postgres/homelab_<date>.dump)`.
4. `make psql`, `\c scratch`, `SELECT count(*) FROM tasker.workflows;`. Undo: `\c homelab`, `DROP DATABASE scratch;`.

### Check
1. Our RPO and RTO, and what's missing from 3-2-1?
> [!success]- Answer
> RPO up to 24 h, RTO minutes per database; the backups are on the same disk — no off-site copy.

**Milestone:** you can say where any piece of data lives, who can read it, and restore it — and you've done a restore. Deep dive: [[Homelab data]].
