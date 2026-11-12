---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Jobs and CronJobs

> A **Job** runs pods until a task completes (then stops); a **CronJob** creates a Job on a schedule.

## Why it matters
Not everything is a server. Migrations, realm sync, backups, user creation are *tasks*: run, succeed or fail, done. Jobs give them retries, logs and a status, inside the cluster, with the same Secrets and network as the services.

## How it works
- A Job's pod uses `restartPolicy: OnFailure` or `Never`; `backoffLimit` caps retries.
- `kubectl logs job/<name>` reads its output; `ttlSecondsAfterFinished` cleans it up.
- CronJob `schedule` is cron syntax (`"0 3 * * *"` = 03:00 daily), in the cluster's time zone unless `timeZone:` is set. `concurrencyPolicy` decides if runs may overlap.
- **Helm hooks** turn a Job into a deploy step: `post-install,post-upgrade` runs it after the release's resources are applied.

## In our projects
- The chart's `jobs:` are Helm hooks run on every deploy: `keycloak-sync` (the realm as code), `db-migrate-migrate` (dbmate), MongoDB's `mcp` user ([[kube-charts]]).
- `backups` has `kind: None` (no server, only `cronJobs:`): PostgreSQL and MongoDB dumps at 03:00 ([[Backups and restores]]).
- `make backup` creates Jobs from those CronJobs now.
- `helmfile` waits for Jobs (`waitForJobs`): a failed migration fails the deploy.

## Pitfalls we met
- A hook Job that fails blocks the release; read `kubectl logs job/<name>` first.
- Jobs must be **idempotent** (safe to run again): `sync.sh` checks before creating; dbmate skips applied migrations.

## Check yourself
1. Why is the Keycloak realm sync a Job and not a script you run by hand?
> [!success]- Answer
> As a hook Job it runs on every deploy, automatically, inside the cluster with the same Secrets and network as Keycloak, and its failure fails the deploy with logs to read. A script you run by hand gets forgotten or run from the wrong place, and the realm drifts from the code.
2. What does "idempotent" mean, and why must every hook Job be?
> [!success]- Answer
> Running it twice gives the same result as running it once. Hooks run on every deploy, and a failed one is retried, so each must check before it creates (as `sync.sh` does) or skip what's done (as dbmate does).

## Go further
- [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), [CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/).
- [crontab.guru](https://crontab.guru/) — read cron expressions.
