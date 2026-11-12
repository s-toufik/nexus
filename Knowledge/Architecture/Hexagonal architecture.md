---
type: concept
domain: Architecture
level: intermediate
tags: [concept, architecture]
updated: 2026-11-12
---

# Hexagonal architecture

> Put the application's rules in the middle, knowing nothing about the outside world; let the middle declare what it needs as **ports** (interfaces); plug the outside world in as **adapters** that implement them. Dependencies always point inward. Also called *ports and adapters*; Clean Architecture and Onion Architecture are close cousins.

## Why it matters
Frameworks, databases and AI libraries change faster than business rules. When rules import them directly, every change of technology rewrites the rules, and testing them needs the real thing. With ports, you swap LangGraph or a database by writing one adapter, and you test the rules with fakes.

## How it works
```text
  inbound adapters ──► inbound ports ──► APPLICATION (use cases) ──► outbound ports ◄── outbound adapters
  (HTTP, CLI, MCP)      (what it offers)   + DOMAIN (rules, models)   (what it needs)     (DB, APIs, LLMs)
                                    └────────── bootstrap: wires adapters into ports ─────────┘
```
- **Domain:** entities, value objects, rules. Plain code.
- **Application:** use cases orchestrating the domain; owns the port interfaces.
- **Adapters:** translate between a port and a technology. Inbound ones *call* the application; outbound ones *are called* by it.
- **Bootstrap / composition root:** the one place that knows every concrete class ([[Dependency injection]]).
- **The rule:** source-code dependencies point inward only; the outside depends on the inside's interfaces (dependency inversion, the D of SOLID).
- Folders document it; **tests enforce it** ([[Architecture tests]]).

## In our projects
- [[Agent runtime layers]]: domain (`Conversation`, `TurnPolicy`), application (`HandleMessage`, step handlers, ports), adapters (LangChain, MCP, LangGraph, SSE), bootstrap (`AgentDI`).
- [[Agent toolbox layers]]: tools behind `Tool`, MCP and the sandbox as two inbound adapters.
- [[Web framework benchmark design]]: the shop's use cases don't know which web framework serves them.
- [[pycraftcore modules]]: the library supplies ports and outbound adapters.
- [[Archetype]]: the template, with a business and a technical hexagon.
- Even the frontend: [[Homelab UI Tasker]]'s `CanvasEngine` port.

## Pitfalls we met
- **Over-abstraction:** a port with one adapter that will never change is just indirection. Add one where the dependency is volatile or slow to test.
- **Leaky ports:** a port returning a library's types (a LangChain message) ties the core to it anyway — keep library types in adapters.
- **Things in the wrong ring** (fixed 2026-11-12 in both agent services):
  - a port that imported its data from inside the application (`ToolPublisher` → `CatalogChange`): the data that crosses a port lives with the port;
  - pure rules sitting in the application (`DependencyHealth`, the back-off delays): no dependency, so domain;
  - ports defined inside an adapter, and application logic with no technology in it (the agent's tool registry and refresher) living there too: move them inward;
  - what stays out: `McpSessionFactory` returns an `mcp.ClientSession`, a library type, so it remains inside the MCP adapter.

## Check yourself
1. Who owns a port: the application or the adapter? Why does that matter?
> [!success]- Answer
> The application: it says what it needs in its own words, so adapters depend on it and not the other way round; swapping a technology then never touches the rules.
2. Name an inbound and an outbound adapter in agent-runtime.
> [!success]- Answer
> Inbound: `StreamAgentController` (HTTP and SSE). Outbound: the LangChain model adapters, or `Toolbox` with its MCP calls.
3. When is a port not worth it?
> [!success]- Answer
> When it has one adapter that will never change and is quick to test as it is: then it's only indirection.
4. `CatalogChange` holds `Tool` objects, and `Tool` is a port. Can `CatalogChange` be domain?
> [!success]- Answer
> No: the domain may not depend on a port. It goes with the `ToolPublisher` port it crosses; the agent's `RegistryChange` holds only names, so that one is domain.

## Go further
- [Alistair Cockburn: Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/).
- [Robert C. Martin: The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).
- [Herberto Graça: DDD, Hexagonal, Onion, Clean, CQRS… how I put it all together](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/).
