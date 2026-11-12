---
type: concept
domain: Data
level: beginner
tags: [concept, data]
updated: 2026-11-08
---

# MongoDB

> A document database: records are JSON-like documents (BSON) in **collections**, with flexible fields, rich queries and indexes — no fixed schema, no joins by default.

## Why it matters
Some data is naturally a document — a conversation with its messages, a config, an event. Knowing when a document store fits (and when a relational one does) is a basic design skill.

## How it works
- `database → collection → document` (`{ _id, …fields }`).
- Queries: `db.messages.find({ conversationId: "…" }).sort({ at: 1 })`; aggregation pipelines for reports.
- Indexes on fields; `_id` always indexed.
- **Auth**: users in a database (often `admin`), with **roles** (`read`, `readWrite`, `readAnyDatabase`, `root`); connect with `authSource=admin`.
- **WiredTiger** storage engine with its own cache (`--wiredTigerCacheSizeGB`).
- Production uses **replica sets** (failover); a single node is a standalone.
- Tools: `mongosh`, Compass, `mongodump`/`mongorestore`.

## In our projects
- A standalone StatefulSet; agent-runtime's conversations; WiredTiger cache capped at 1 GB, pod limit 3 GiB ([[Homelab data]]).
- `root` from Secret `mongodb`; `mcp` user (`readAnyDatabase` or `readWriteAnyDatabase`) created by a Job.
- Reachable at `<domain>:27017` from tailnet devices (Compass); `make mongosh` on the server.
- **Pinned to 7.0.x**: MongoDB 8 refuses to start on Linux 6.19–7.0.13.

## Check yourself
1. Why is a conversation a good fit for a document? What would you lose versus PostgreSQL?
> [!success]- Answer
> A conversation is read and written as a whole, its messages belong to it alone, and their fields vary (tool calls, metadata): one document holds it all in one read. Against PostgreSQL you'd lose a fixed schema enforced by the database, joins and constraints across tables, and transactional reports across conversations in plain SQL.
2. What does `authSource=admin` mean in a connection string?
> [!success]- Answer
> The database where the user is defined and checked: the `mcp` and `root` users are created in `admin`, so connecting needs `authSource=admin` even when you then work in another database.

## Go further
- [MongoDB manual](https://www.mongodb.com/docs/manual/), [authorization](https://www.mongodb.com/docs/manual/core/authorization/).
- [Data modeling](https://www.mongodb.com/docs/manual/data-modeling/).
