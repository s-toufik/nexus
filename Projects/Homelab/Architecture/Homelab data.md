---
type: architecture
project: "[[Homelab]]"
order: 4
tags: [homelab, architecture, data]
updated: 2026-11-08
---

# Homelab data

> Two databases and a broker: PostgreSQL for relational data (Tasker, Keycloak, your projects), MongoDB for documents (the agent's conversations), Kafka for events. Each app gets its own account with only the rights it needs, and every night everything is dumped outside the cluster.

Previous: [[Homelab gateway and sign-in]] · Next: [[Homelab observability]]

**Do it:** [[Homelab - Connect to the databases]] · [[Homelab - Migrate the database]] · [[Homelab - Back up and restore]] · [[Homelab - Use Kafka]]

## PostgreSQL, run by an operator
PostgreSQL isn't a plain pod: the **CloudNativePG** [[Operator]] runs it. You declare a `Cluster` (a custom resource, from kube-charts' `pg-cluster` chart); the operator creates the pod, its volume, the Services, TLS, and keeps the declared **roles** and **databases** as you wrote them.

| Service | Points to | Use |
|---|---|---|
| `postgres-rw` | The primary | Every app — reads and writes |
| `postgres-ro` / `postgres-r` | Replicas / any instance | Unused with one instance |

Roles declared in `repository/postgres/values.yaml.gotmpl` ([[PostgreSQL roles and privileges]]):
| Role | Login | Rights | Used by |
|---|---|---|---|
| `postgres` | yes | superuser (Secret `postgres-superuser`) | migrations, backups, `make psql` |
| `homelab` | yes | owner of database `homelab` (Secret `postgres-app`) | your own projects |
| `keycloak` | yes | owner of database `keycloak` | Keycloak |
| `tasker_web` | **no** | only Tasker's tables, through RLS | the role PostgREST *becomes* |
| `postgrest` | yes | `NOINHERIT`, member of `tasker_web` | PostgREST connects as it, then switches |
| `mcp` | yes | `pg_read_all_data` (+ `pg_write_all_data` if write is on) | postgres-mcp, the agent's SQL tools |

**Passwords:** the operator reads each role's password from a Secret of type `basic-auth`; the Secret's label `cnpg.io/reload: "true"` makes it re-apply the password when you rotate it — no restart.

## Tasker: an API with no backend code
Tasker (in homelab-ui) stores workflows and favourite blocks. There is no Tasker server: **[[PostgREST]]** turns the `tasker` schema into a REST API, and PostgreSQL itself enforces who sees what.

```text
browser ─► Caddy ─────────────► PostgREST ──────────────► PostgreSQL
           + X-Gateway-Secret    connects as postgrest,     pre-request: tasker.check_request()
           + Remote-User: you    SET ROLE tasker_web,         secret right? user present?
                                 request.headers = {…}      RLS policy: owner = current_username()
```
1. Caddy adds a secret only it knows (`X-Gateway-Secret`) and your account name (`Remote-User`).
2. PostgREST runs `tasker.check_request()` before every request: wrong secret → 403, no user → 401. So calling PostgREST directly, bypassing Caddy, fails.
3. **[[Row-level security]]**: the policy `owner = tasker.current_username()` on both tables. A `SELECT * FROM tasker.workflows` returns only your rows; an `INSERT` with someone else's `owner` is refused. `FORCE ROW LEVEL SECURITY` applies it even to the table owner.

*Why this matters:* security in the database holds even if the UI has a bug. That's [[Least privilege and defence in depth|defence in depth]].

## Migrations
The `tasker` schema is built by numbered SQL files in `repository/db-migrate/migrations/` (`001_create_roles.sql` … `005_grant_permissions.sql`), each with `-- migrate:up` and `-- migrate:down`. The `db-migrate` release is **jobs only** (`kind: None`): on every deploy a [[Jobs and CronJobs|Job]] runs **dbmate**, which applies the files not yet in its `schema_migrations` table. See [[Database migrations]].

- New change → `make migration-new NAME=…`, write it, `make migrate` (also reloads PostgREST's schema cache).
- Never edit an applied migration: write a new one.

## MongoDB
A single [[MongoDB]] [[Deployment and StatefulSet|StatefulSet]] (one pod, its own volume) holds agent-runtime's conversations.
- Root account from Secret `mongodb`; the `mcp` user (read, or read-write) is created by a Job running `mcp-user.js`.
- Published on the Tailscale address `:27017` (its own password, not the sign-in) so Compass can connect.
- **Pinned to 7.0.x**: MongoDB 8 refuses to start on Linux kernels 6.19–7.0.13, and the server runs 7.0.0. A typical edge case: a version is not only "newer", it has requirements.

## Kafka
One [[Kafka]] broker in **KRaft** mode (no ZooKeeper), messages kept 7 days or 10 GiB per partition. Inside the cluster `kafka:9092`, from tailnet devices `<domain>:9094`. Kafka UI browses topics; writes through homelab-ui need the `admin` role.

## Backups
The `backups` release is two [[Jobs and CronJobs|CronJobs]] at 03:00:
- `pg_dump --format=custom` of `homelab` and `keycloak`;
- `mongodump --archive --gzip`;
- into `/var/backups/homelab/` on the host (a `hostPath`, root-only), written as `.tmp` then renamed — so a half-written dump never looks complete; dumps older than 14 days deleted.

Restore: `make restore-postgres FILE=…`, `make restore-mongo FILE=…` (they **replace** the data). See [[Backups and restores]] for what's still missing (an off-site copy).

## Edge cases
- **Uninstall keeps the volume.** Reinstall PostgreSQL with new Secrets and the old data still has the old passwords. Rotate through the operator, or delete the volume on purpose.
- **A migration that fails half-way** in a transaction is rolled back; one that can't run in a transaction (e.g. `CREATE INDEX CONCURRENTLY`) can leave partial state — check `make migrate-status`.
- **Restore = replace.** Practise a restore before you need one: a backup you've never restored is a hope, not a backup.
- **`mcp` with write on can change rows, not the schema** (`pg_write_all_data` isn't DDL), and RLS still hides Tasker's rows from it (it's not `tasker_web`).

## Check yourself
1. Why does PostgREST connect as `postgrest` and then become `tasker_web`, instead of logging in as `tasker_web`?
> [!success]- Answer
> So the login alone opens nothing: `postgrest` is `NOINHERIT` and has almost no rights until it switches to `tasker_web` for a request. A leaked `postgrest` password, or a request that skips the switch, gets nothing. PostgREST is built to connect once and switch per request.
2. Someone on your tailnet calls PostgREST's pod IP directly with `Remote-User: alice`. What stops them?
> [!success]- Answer
> `tasker.check_request()`: the request has no `X-Gateway-Secret`, or the wrong one, so PostgREST answers 403 before any query runs. Only Caddy knows the secret.
3. What's the difference between `pg_dump --format=custom` and a copy of the volume folder?
> [!success]- Answer
> `pg_dump --format=custom` is a logical, consistent export of one database: portable to another PostgreSQL version or server, restorable selectively with `pg_restore`. A copy of the volume is the raw files of the whole instance: tied to that major version, and consistent only if PostgreSQL was stopped or the copy is a proper physical backup.
4. Why is MongoDB pinned to 7.0 here, and how would you know it's safe to move to 8?
> [!success]- Answer
> MongoDB 8 refuses to start on Linux kernels 6.19 to 7.0.13, and the server runs 7.0.0. It's safe to move when `uname -r` shows a kernel outside that range (7.0.14 or later), or MongoDB's release notes say the check is gone; then try it on a copy with a restored backup first.

## Go further
- [CloudNativePG documentation](https://cloudnative-pg.io/documentation/current/) — clusters, roles, backups.
- [PostgreSQL: row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- [PostgREST: authentication](https://docs.postgrest.org/en/stable/references/auth.html).
- [dbmate](https://github.com/amacneil/dbmate).
