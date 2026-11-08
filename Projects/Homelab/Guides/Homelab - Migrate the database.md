---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Migrate the database

> Change Tasker's schema with a versioned migration, apply it, or undo the latest.

**Where:** on your Mac (homelab-infra), then on the server · **All guides:** [[Homelab guides]]

## Add a migration (on your Mac, in homelab-infra)
1. `make migration-new NAME=<what_it_does>` — raw: create `repository/db-migrate/migrations/<next number>_<what_it_does>.sql` with `-- migrate:up` and `-- migrate:down`
2. Write the up and down SQL. If PostgREST serves what it changes, end `migrate:up` with `NOTIFY pgrst, 'reload schema';`.
3. Commit, push.

## Apply it (on the server)
1. `git pull`
2. `make validate` → the file has both sections.
3. `make migrate`
   - raw:
     ```bash
     helmfile -l name=db-migrate sync
     kubectl -n homelab exec "$(kubectl -n homelab get pod -l cnpg.io/cluster=postgres,cnpg.io/instanceRole=primary -o name)" -c postgres -- psql -d homelab -qc "NOTIFY pgrst, 'reload schema'"
     ```
4. `make migrate-status` — raw: `./scripts/dbmate.sh status` → every file `[X]`.

## Undo the latest
1. `make migrate-rollback`, type `rollback` — raw: `./scripts/dbmate.sh rollback`
2. Delete or fix the file, commit, push (otherwise the next deploy applies it again).

## If it goes wrong
- The `db-migrate` job fails: [[Homelab - Troubleshooting]].

## Why it works
- [[Database migrations]] — up, down, and never editing an applied one.
- [[PostgREST]] — why its schema is reloaded.
- [[Homelab data]]
