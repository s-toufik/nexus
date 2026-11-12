---
type: concept
domain: Data
level: beginner
tags: [concept, data]
updated: 2026-11-08
---

# Database migrations

> Versioned, ordered scripts that change a database's schema step by step. A table in the database records which ones ran, so any copy of the database can be brought to the latest version — and back.

## Why it matters
The schema is code. Changing it by hand on the server means nobody knows what's there, and a rebuild can't reproduce it. Migrations make schema changes reviewable, repeatable and deployable like everything else.

## How it works
- Files numbered or timestamped: `001_create_roles.sql`, `002_…`. Each has an **up** (apply) and a **down** (undo).
- The tool (dbmate, Flyway, Liquibase, Alembic…) keeps a `schema_migrations` table, applies the pending files in order, usually each in a transaction.
- Rules: **never edit an applied migration** (write a new one); make them **idempotent** where possible (`IF NOT EXISTS`); separate schema and data changes; think about running code during the change (**expand → migrate → contract** for zero downtime).

## In our projects
- `repository/db-migrate/migrations/` for Tasker's schema, applied by **dbmate** in a Job on every deploy of `db-migrate` (a `kind: None` release) ([[Homelab data]]).
- `make migration-new NAME=…` creates the next file; `make migrate` applies and reloads PostgREST (`NOTIFY pgrst, 'reload schema'`); `make migrate-status`, `make migrate-rollback`.
- Roles themselves are declared in CloudNativePG; migrations handle grants, schema, functions, RLS.

## Pitfalls we met
- A `down` that's never been tested is a guess. Try it on a copy.
- PostgREST caches the schema: a new column is invisible until the reload.

## Check yourself
1. Why must you never edit `003_create_auth_functions.sql` now that it ran?
> [!success]- Answer
> It already ran on the server and is recorded in `schema_migrations`, so dbmate will never run it again: your edit never reaches that database, yet a fresh one would get it. The two would differ silently. Write a new migration instead.
2. Describe expand → migrate → contract for renaming a column used by a running app.
> [!success]- Answer
> Expand: add the new column and fill it, keeping the old one in step (both written, or a trigger). Migrate: deploy the app reading and writing the new column. Contract: once nothing uses the old column, drop it in a later migration. At every step, the running code works with the schema in place.

## Go further
- [dbmate](https://github.com/amacneil/dbmate).
- [Evolutionary database design](https://martinfowler.com/articles/evodb.html) (Martin Fowler).
