---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-14
---

# Homelab - Back up and restore

> The nightly PostgreSQL and MongoDB dumps: list them, back up now, copy them off the server, restore, change the schedule.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

Every night at 03:00 (`backups` in `environments/default.yaml`): PostgreSQL (databases `homelab` and `keycloak`; not `agent_runtime`, whose A2A tasks live a week) and MongoDB into `/var/backups/homelab`, kept 14 days.

## List them
- `make backups` — raw: `./scripts/backups.sh list`

## Back up now (e.g. before an upgrade)
- `make backup` — raw: `./scripts/backups.sh now`

## Copy them off the server (on your Mac)
```bash
ssh -t <user>@<HOMELAB_DOMAIN> 'sudo tar -C /var/backups -czf - homelab' > homelab-backups-$(date +%F).tar.gz
```

## Restore PostgreSQL (replaces the database)
1. `make backups` → the file, e.g. `/var/backups/homelab/postgres/homelab_2026-11-03_0300.dump` (or `keycloak_…`).
2. `make restore-postgres FILE=<file>`, type `restore` — raw: `./scripts/backups.sh restore-postgres <file>`
3. For `keycloak_…`: `kubectl -n homelab rollout restart deploy/keycloak`.

## Restore MongoDB (replaces its data)
1. `make backups` → the file, e.g. `/var/backups/homelab/mongodb/mongodb_2026-11-03_0300.archive`.
2. `make restore-mongo FILE=<file>`, type `restore` — raw: `./scripts/backups.sh restore-mongo <file>`

## Change the schedule or how long they are kept
1. `backups.schedule` / `backups.keepDays` in `environments/default.yaml`.
2. `make apply R=backups`

## If it goes wrong
- A backup fails, or none has run: [[Homelab - Troubleshooting]].

## Why it works
- [[Backups and restores]] — RPO, RTO, 3-2-1, and what's still missing here.
- [[Homelab data]] · [[Jobs and CronJobs]]
