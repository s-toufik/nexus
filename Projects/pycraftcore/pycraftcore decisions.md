---
type: decisions
project: "[[pycraftcore]]"
tags: [pycraftcore, decisions]
updated: 2026-11-15
---

# pycraftcore decisions

## Building blocks, not a framework
- **Decision:** independent modules, each a port + adapters; services compose what they need.
- **Why:** no inversion of control imposed on services; any module can be replaced or skipped.
- **Alternatives:** a framework owning the app lifecycle (tighter, harder to leave).

## One extra per module
- **Decision:** third-party packages behind extras; CI installs each extra alone.
- **Why:** small images and dependency trees; import errors surface in CI, not in production.

## Three web frameworks behind one toolkit contract
- **Decision:** `web_litestar`, `web_fastapi`, `web_blacksheep` with the same four functions, shared tests.
- **Why:** services pick the framework that fits (FastAPI for agent-runtime, all three in the benchmark) while keeping identical conventions; makes [[Web framework benchmark]] fair.
- **Consequences:** every web feature is built three times — the shared tests keep them equal.

## SQLAlchemy as a fourth repository adapter
- **Decision:** `repository/adapter/sql/sqlalchemy/`: a factory and a repository like the other adapters, plus engine builders. The factory only manages the engine (build once, `ping()`, dispose); how it's built is injected, `PostgresEngineBuilder(PostgresConnector)` or `SqliteEngineBuilder(SqliteConnector)`, so the factory never knows the database and reuses the existing settings and mappers. Both run on the psycopg and aiosqlite drivers already in the `repository` extra; `sqlalchemy` joins that extra.
- **Why:** some libraries only take a SQLAlchemy engine (the A2A SDK's `DatabaseTaskStore` in agent-runtime). Building it from the same connector keeps one way to configure databases, and `connection()` is already how services hand a database to a library (`MongoClient` and aiosqlite to LangGraph).
- **Alternatives:** a SQLAlchemy engine built inside each service (configuration and pool rules repeated per service); replacing the psycopg and aiosqlite adapters with SQLAlchemy (heavier for services that only run SQL); a separate extra (every other adapter ships in `repository`); one factory branching on a dialect, with its own settings and mapper (it had to know every database, and repeated the PostgreSQL and SQLite settings).
- **Who prepares SQLite:** `SqliteDatabaseFile` (in the `sqlite` package) is the one place that knows where a SQLite file lives and creates its folder; both SQLite factories use it, so the SQLite engine builder uses it too. The per-connection PRAGMAs (busy timeout, `synchronous`) stay with whoever opens the connections, because SQLite forgets them when a connection closes; only WAL is saved in the file.
- **Consequences:** no ORM or models in pycraftcore; tables belong to the code that owns them.

## MongoDB TTL indexes kept in pycraftcore
- **Decision:** `MongoTtlIndex(field, expire_after_seconds).ensure(collection)` in the MongoDB adapter creates a missing TTL index, changes another expiry in place with `collMod`, and otherwise does nothing; it returns what it did (`TtlIndexChange`).
- **Why:** MongoDB refuses to create a TTL index again with another expiry. A library that creates its own (LangGraph's `MongoDBSaver`) then stops the service at boot after a retention change: agent-runtime went into a crash loop when its conversation TTL went from an hour to a week. Index management is about the database, not the service, so it belongs with the other MongoDB code and any service can use it.
- **Alternatives:** a fix inside agent-runtime (MongoDB code in a service); dropping and recreating the index (rebuilds it, and needs no less privilege); dropping the database by hand after each TTL change.
- **Consequences:** changing an index needs the `collMod` action (`dbAdmin` or root), more than `readWrite`.

## Databases and A2A split into connectors and operations
- **Decision:** a database connector holds only what every use needs to connect (engine, host, port, auth, `timeout`, a typed `pool` of `min`/`max`); a `DatabaseOperation` holds what one use does (`database`, `collections` by role, `ttl`, `parameters`) and is what the settings mappers take. An `A2aConnector` (`base_url`, `timeout`, `binding`) and `A2aOperation` join API, file and MCP. 6.0.0.
- **Why:** `default_name`, `pool.timeout_ms` and `pool.ttl` were one use's settings inside the connection, and collection names lived in code; two uses of one server needed two connectors. A2A settings sat in a server's free-form `parameters`.
- **Alternatives:** keep `default_name` on the connector as a default (PostgreSQL connects to one database, but every use would still repeat names and TTLs elsewhere); the connect timeout in the operation (it's the same for every use, so it belongs with the connection).
- **Consequences:** unknown keys are refused on database connectors, pools and operations, so a 5.x config fails at load with the key to move instead of being half-ignored. MongoDB's pool stays pymongo's: mapping `pool.max` (default 1) would shrink it. The PostgreSQL connect timeout also stops a ping to an unreachable host from hanging.

## Configuration as connectors, operations and servers
- **Decision:** YAML + OmegaConf, env interpolation, pydantic validation; only the loader reads the environment.
- **Why:** one vocabulary for every service; fail at boot, not mid-request.

## A process-level Python sandbox with a host bridge
- **Decision:** subprocess + rlimits + import/open guards + loopback token bridge.
- **Why:** cheap enough to run per tool call, good enough inside a fenced pod.
- **Alternatives:** container per run (stronger, slower, needs a runtime); in-process `exec` (no isolation).
