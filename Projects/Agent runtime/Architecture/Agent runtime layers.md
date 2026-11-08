---
type: architecture
project: "[[Agent runtime]]"
order: 1
tags: [agent-runtime, architecture]
updated: 2026-11-08
---

# Agent runtime layers

> Four rings, dependencies pointing inward: the **domain** (plain dataclasses) knows nothing; the **application** (use case, step handlers, ports) knows the domain; **adapters** implement the ports with LangChain, MCP, LangGraph and the SSE presenter; **bootstrap** wires everything and builds the Litestar app. A test fails the build if an import crosses a boundary.

Back: [[Agent runtime]] · Next: [[Agent runtime turn]]

**Do it:** [[Agent runtime - Change the agent]]

## The rings
```text
bootstrap      settings, AgentDI (wiring only), container, create_agent_application (Granian's target), Litestar API
 └ adapter     inbound:  StreamAgentController, SsePresenter
               outbound: LangChain model adapters + prompts, Toolbox (MCP), LangGraph runtime, checkpointer
    └ application   HandleMessage, one handler per step (*_step.py), ports: Actor, Planner, ToolExecutor, WorkflowRunner…
       └ domain     Conversation, Turn, Plan, Answer, TurnPolicy — no framework
```
This is [[Hexagonal architecture]]: the core states *what it needs* as ports (interfaces); the outside world plugs in as adapters.

## What that buys
| You want to… | You touch |
|---|---|
| Swap LangGraph for another engine | `adapter/outbound/langgraph/` — the scenario tests already run the same steps on a plain in-memory loop |
| Use another model provider | One LangChain adapter; nothing else knows LangChain exists |
| Serve over another framework | `bootstrap/application/<framework>/`; the controller and presenter don't depend on Litestar |
| Change a business rule | The domain or a step handler, testable without a model |

## Wiring: `AgentDI`
`AgentDI` only builds and connects objects — models per role from `operation/llm.yml` and `operation/agent.yml`, MCP tools from `connector/mcp.yml`, the checkpointer from `connector/database.yml`, the step handlers. `create_agent_application` builds the container and the app; routes get services through Litestar's dependency injection. That's the **composition root** of [[Dependency injection]]: one place where concrete classes are chosen.

## Boundaries, enforced
`tests/architecture/test_boundaries.py` imports every module and fails if, for example, the domain imports LangChain, or the application imports a web framework ([[Architecture tests]]). Without that test, layers erode one "quick" import at a time.

## Boot
1. Settings from `config/<APP_ENV>/` and env ([[pycraftcore configuration]]).
2. Logging and telemetry (pycraftcore).
3. Discover MCP tools on every connector; a server that's down is skipped with a warning.
4. `/health/readiness` answers 200 only now — Kubernetes routes traffic after boot ([[Probes]]).

## Check yourself
1. Why must the domain not import LangGraph, even though LangGraph runs the steps?
2. Where would you add a new model provider, and what else changes?
3. What's a composition root, and which file is it here?

## Go further
- [Alistair Cockburn: Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/).
- [import-linter](https://import-linter.readthedocs.io/) — another way to enforce layers in Python.
