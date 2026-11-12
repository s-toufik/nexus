---
type: concept
domain: Architecture
level: beginner
tags: [concept, architecture]
updated: 2026-11-08
---

# Dependency injection

> An object receives what it needs (its dependencies) from outside instead of creating them. Somewhere — the **composition root** — one piece of code builds the concrete objects and hands them in.

## Why it matters
If `HandleMessage` creates its own LangChain model, you can't test it without a model, or swap the model. If it *receives* an `Actor` port, a test passes a fake and production passes the real adapter. DI is what makes [[Hexagonal architecture]] practical.

## How it works
- **Constructor injection** (most common): `def __init__(self, planner: Planner, tools: ToolExecutor)`.
- **Composition root:** one module wires everything at start-up — `AgentDI`, `ToolboxDI`, `ShopDI`; Angular's `app.config.ts`.
- **Containers / frameworks** automate wiring: Angular's injector (`inject()`, `providedIn: 'root'`, `InjectionToken`, multi providers), FastAPI's `Depends`, Litestar's `dependencies`, BlackSheep's services.
- **Lifetimes:** singleton (one per app), scoped (one per request), transient.
- Avoid the **service locator** (objects fetching dependencies from a global registry) — it hides what a class needs.

## In our projects
- Python services: `*DI` classes do wiring only, no logic; routes receive services through the framework's DI ([[Agent runtime layers]]).
- Angular: `HOMELAB_FEATURES` multi provider — features add themselves, the shell injects the list ([[Homelab UI structure]]).
- pycraftcore's rule: services never construct a third-party client; they receive an adapter ([[pycraftcore modules]]).

## Check yourself
1. What's a composition root, and why only one?
> [!success]- Answer
> The one place, at start-up, that builds the concrete objects and hands them to whoever needs them (`AgentDI`, `ToolboxDI`, Angular's `app.config.ts`). Only one, so the wiring is easy to find, each choice is made once, and nothing else in the code knows which concrete class it got.
2. How does an Angular multi provider let the shell list features it never imports?
> [!success]- Answer
> Each feature registers itself under the `HOMELAB_FEATURES` injection token, a multi provider, in `app.config.ts`. The shell injects the token and gets the list of every registered feature: it knows the contract, never a feature's code.

## Go further
- [Martin Fowler: Inversion of control containers and the DI pattern](https://martinfowler.com/articles/injection.html).
- [Angular: dependency injection](https://angular.dev/guide/di).
