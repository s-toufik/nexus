---
type: concept
domain: Architecture
level: beginner
tags: [concept, architecture, data]
updated: 2026-11-08
---

# Repository pattern

> Hide data access behind an interface that speaks the application's language ("get the product", "store the order"), so the rest of the code doesn't know which database, query language or driver is behind it.

## Why it matters
SQL scattered through use cases ties them to one database and makes them hard to test. A repository is the outbound port for storage: tests use an in-memory fake, production a real database adapter.

## How it works
- Interface in the application (`ProductRepository.product(sku)`), implementation in an adapter (`SqliteProductRepository`).
- A generic low-level repository (`AsyncRepository.execute(statement)`) can sit under domain-specific ones.
- **Factories** build connections/pools from configuration; connect at start, disconnect at shutdown.

## In our projects
- pycraftcore `repository`: `SqliteRepositoryFactory`, `PostgresRepositoryFactory`, `MongoRepositoryFactory` behind `AsyncRepository` ([[pycraftcore - Use databases and SQL]]).
- The benchmark's shop: SQLite repositories behind the shop's ports ([[Web framework benchmark design]]).
- Homelab UI Tasker: repository interfaces in `domain/repositories.ts`, PostgREST adapters ([[Homelab UI Tasker]]).

## Check yourself
1. Where do the repository interface and its implementation each live?
> [!success]- Answer
> The interface in the application (or domain), named in its words (`ProductRepository.product(sku)`). The implementation in an outbound adapter (`SqliteProductRepository`), which depends on the interface, never the other way round.
2. What does a fake repository let you test?
> [!success]- Answer
> The use cases and their rules, without a database: fast, deterministic tests where you choose what's stored, including cases that are hard to set up for real (empty, missing, conflicting data).

## Go further
- [Martin Fowler: Repository](https://martinfowler.com/eaaCatalog/repository.html).
