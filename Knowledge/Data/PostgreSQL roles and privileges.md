---
type: concept
domain: Data
level: intermediate
tags: [concept, data, postgresql, security]
updated: 2026-11-08
---

# PostgreSQL roles and privileges

> In PostgreSQL, users and groups are both **roles**. A role may log in or not, may be a member of other roles, and holds **privileges** (`SELECT`, `INSERT`, `USAGE`, `EXECUTE`…) on objects. Ownership gives everything.

## Why it matters
"One superuser for every app" is the default mistake. Separate roles with only the privileges each app needs limit what a bug, an injection or a leaked password can do — and make audits readable.

## How it works
- `CREATE ROLE app LOGIN PASSWORD '…'`; `NOLOGIN` roles are groups.
- `GRANT tasker_web TO postgrest` — membership. With `INHERIT` a member automatically has the group's privileges; with `NOINHERIT` it must `SET ROLE` to use them.
- Privileges are per object: `GRANT USAGE ON SCHEMA s`, `GRANT SELECT ON TABLE t`, `GRANT EXECUTE ON FUNCTION f`. `PUBLIC` = everyone.
- `ALTER DEFAULT PRIVILEGES` applies grants to tables created later.
- **Predefined roles**: `pg_read_all_data`, `pg_write_all_data` (all tables, no DDL), `pg_monitor`…
- **Owner** of an object can do anything to it (but see `FORCE ROW LEVEL SECURITY`).
- Attributes: `SUPERUSER`, `CREATEDB`, `CREATEROLE`, `BYPASSRLS` — avoid them for apps.

## In our projects
- CloudNativePG creates and maintains the roles declared in `repository/postgres/values.yaml.gotmpl`: `tasker_web` (NOLOGIN), `postgrest` (LOGIN, NOINHERIT, member of `tasker_web`), `keycloak` (owner of its database), `mcp` (`pg_read_all_data`, + `pg_write_all_data` if write is on) ([[Homelab data]]).
- Migration `005_grant_permissions.sql`: `REVOKE ALL ON SCHEMA tasker FROM PUBLIC`, then only `tasker_web` gets `USAGE` and DML on the two tables; `REVOKE CREATE ON SCHEMA public FROM PUBLIC`.
- Your own apps use `homelab` (owner of database `homelab`) or a role of their own ([[homelab-infra - Q&A]]).

## Pitfalls we met
- PostgREST must be `NOINHERIT`: it logs in with almost no rights and only gains `tasker_web`'s when it switches for a request.

## Check yourself
1. What does `NOINHERIT` change for `postgrest`?
2. Why revoke `CREATE` on schema `public` from `PUBLIC`?
3. Can `mcp` with `pg_write_all_data` add a column?

## Go further
- [Database roles](https://www.postgresql.org/docs/current/user-manag.html), [Privileges](https://www.postgresql.org/docs/current/ddl-priv.html), [Predefined roles](https://www.postgresql.org/docs/current/predefined-roles.html).
