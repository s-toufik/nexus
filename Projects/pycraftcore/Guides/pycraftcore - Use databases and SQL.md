---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Use databases and SQL

> Async repositories for SQLite, PostgreSQL and MongoDB from a connector, and a check that SQL is read-only.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

## Repositories

Repositories are built from a database connector and share one interface, `AsyncRepository.execute(statement)`:

```python
from pycraftcore.repository.adapter import SqliteRepositoryFactory, SqliteSettingsMapper

factory = SqliteRepositoryFactory(SqliteSettingsMapper(config.connector.database("users"))())
repository = await factory.connect()
rows = await repository.execute("SELECT id, email FROM users LIMIT 10")
await factory.disconnect()
```

`PostgresRepositoryFactory` / `PostgresSettingsMapper` and `MongoRepositoryFactory` / `MongoSettingsMapper` work the same way, and so will any database added later: a factory, a settings mapper and a repository behind the same `AsyncRepository` port.

## Read-only SQL

```python
from pycraftcore.query_language.adapter import SqlHandlerFactory

statement = SqlHandlerFactory()("SELECT * FROM users", dialect="sqlite").transpile()
```

`transpile()` raises when the statement writes, deletes or changes the schema, so only reads reach the database.

## Why it works
- [[Repository pattern]] · [[pycraftcore modules]] · [[PostgreSQL roles and privileges]]
