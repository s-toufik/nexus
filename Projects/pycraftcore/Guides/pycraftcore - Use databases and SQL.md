---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-14
---

# pycraftcore - Use databases and SQL

> Async repositories for SQLite, PostgreSQL and MongoDB from a connector, a SQLAlchemy engine for libraries that need one, and a check that SQL is read-only.

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

Every factory has three methods: `connect()` gives the `AsyncRepository`, `connection()` gives the driver's own client, `disconnect()` closes both. `connection()` is for handing the database to a library with its own code, such as LangGraph's checkpointers in agent-runtime.

## A SQLAlchemy engine

For a library that asks for a SQLAlchemy engine (the A2A SDK's task store, for example), from a connector with `engine: postgresql` or `engine: sqlite`:

```python
from pycraftcore.repository.adapter import SqlAlchemyRepositoryFactory, SqlAlchemySettingsMapper

factory = SqlAlchemyRepositoryFactory(SqlAlchemySettingsMapper(config.connector.database("tasks"))())
await factory.ping()                    # raises when the database can't be reached
engine = await factory.connection()     # an AsyncEngine, for the library
await factory.disconnect()              # disposes the engine
```

- Same drivers as the other adapters: psycopg (`postgresql+psycopg`) and aiosqlite (`sqlite+aiosqlite`).
- PostgreSQL: a pool of `pool.max` connections, checked before use. SQLite: `<host>/<default_name>.db`, with the same PRAGMAs as `SqliteRepositoryFactory`.
- `connect()` gives an `AsyncRepository` too; its SQL uses the driver's placeholders (`%s` for PostgreSQL, `?` for SQLite), one transaction per call.
- The factory builds the engine only: the library owns its tables.

## Read-only SQL

```python
from pycraftcore.query_language.adapter import SqlHandlerFactory

statement = SqlHandlerFactory()("SELECT * FROM users", dialect="sqlite").transpile()
```

`transpile()` raises when the statement writes, deletes or changes the schema, so only reads reach the database.

## Why it works
- [[Repository pattern]] · [[pycraftcore modules]] · [[PostgreSQL roles and privileges]]
