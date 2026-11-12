---
type: concept
domain: Data
level: beginner
tags: [concept, data, operations]
updated: 2026-11-08
---

# Backups and restores

> A copy of your data from which you can rebuild — *tested* by restoring it. The **3-2-1 rule**: 3 copies, on 2 kinds of media, 1 off-site.

## Why it matters
Disks die, commands are mistyped, software corrupts data, ransomware encrypts it. The only question that matters is: how much can you lose (**RPO**), and how long to get back (**RTO**)?

## How it works
- **Logical** backups (`pg_dump`, `mongodump`): portable, per database, consistent snapshot; slower for big data.
- **Physical** backups (file copies, base backup + WAL archiving): fast, point-in-time recovery possible; tied to version.
- **Point-in-time recovery**: base backup + the write-ahead log replayed to any moment.
- **Retention**: keep N days/weeks/months.
- **Atomic writes**: write to `.tmp`, rename when complete — a half-written file never looks finished.
- **Test restores** regularly, ideally automated.

## In our projects
- Nightly at 03:00: `pg_dump --format=custom` of `homelab` and `keycloak`, `mongodump --archive --gzip`, into `/var/backups/homelab/` (root-only), 14 days kept ([[Homelab data]]).
- `make backup` (now), `make backups` (list), `make restore-postgres` / `restore-mongo` (replace).
- RPO = up to 24 h; RTO = minutes per database.

## Pitfalls we met
- **Same machine**: the backups are on the server's disk — no off-site copy yet. That's 3-2-**0**. Next step: copy them off the server (another device on the tailnet, or object storage; CloudNativePG can also archive WAL to object storage).
- A restore replaces data: do it into a scratch database first when unsure.

## Check yourself
1. What's our RPO and RTO today, and what would shrink each?
> [!success]- Answer
> RPO: up to 24 h, since the dumps run nightly at 03:00. RTO: minutes per database. Archiving PostgreSQL's WAL continuously (CloudNativePG can send it to object storage) would bring the RPO down to minutes; a restore rehearsed and scripted end to end, from a copy that's ready to use, shortens the RTO.
2. Why `custom` format for `pg_dump`?
> [!success]- Answer
> It's compressed, and `pg_restore` can read it selectively: one table or schema, in any order, in parallel jobs. A plain SQL dump can only be replayed whole.

## Go further
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html), [continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html).
- [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/).
- [The 3-2-1 backup strategy](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/).
