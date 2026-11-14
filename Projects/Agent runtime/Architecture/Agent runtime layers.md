---
type: architecture
project: "[[Agent runtime]]"
order: 1
tags: [agent-runtime, architecture]
updated: 2026-11-14
---

# Agent runtime layers

> Four rings, dependencies pointing inward: the **domain** (plain dataclasses) knows nothing; the **application** (use case, step handlers, ports) knows the domain; **adapters** implement the ports with LangChain, MCP, LangGraph and the SSE presenter; **bootstrap** wires everything and builds the FastAPI app. A test fails the build if an import crosses a boundary.

Back: [[Agent runtime]] · Next: [[Agent runtime turn]]

**Do it:** [[Agent runtime - Change the agent]]

## The rings
```text
bootstrap      settings, di/ (one wiring class per kind), container, create_agent_application (Granian's target), FastAPI API (+ the a2a-sdk's routes)
 └ adapter     inbound:  StreamAgentController, SsePresenter (/v1/stream); A2aAgentExecutor, A2aTaskPresenter (/a2a, a2a-sdk)
               outbound: LangChain model adapters + prompts, Toolbox (MCP), LangGraph runtime, checkpointer
    └ application   HandleMessage, RunA2aTask, one handler per step (*_step.py), ports: Actor, Planner, ToolExecutor, WorkflowRunner…
       └ domain     Conversation, Turn, Plan, Answer, TurnPolicy, a2a (TaskState, TaskUpdate, AgentProfile) — no framework
```
This is [[Hexagonal architecture]]: the core states *what it needs* as ports (interfaces); the outside world plugs in as adapters.

## What that buys
| You want to… | You touch |
|---|---|
| Swap LangGraph for another engine | `adapter/outbound/langgraph/` — the scenario tests already run the same steps on a plain in-memory loop |
| Use another model provider | One LangChain adapter; nothing else knows LangChain exists |
| Serve over another framework | `bootstrap/application/<framework>/`; the controllers and presenters don't depend on FastAPI |
| Change a business rule | The domain or a step handler, testable without a model |
| Speak another protocol | One inbound adapter: [[Agent2Agent protocol\|A2A]] is an SDK executor in `adapter/inbound/a2a/` calling `RunA2aTask`, whose rules live in `domain/a2a/` |

## Wiring: `bootstrap/di/`
The wiring only builds and connects objects, one class per kind, each given what it needs in its constructor:

| Class | Builds |
|---|---|
| `ToolsDI` | MCP sessions from `connector/mcp.yml`, the tool registry and its refresher, the `Toolbox` |
| `ModelsDI` | Model providers, their resilient HTTP clients, the `ModelCatalog` from `operation/llm.yml` and `operation/agent.yml` |
| `StorageDI` | The conversation checkpointer (MongoDB, else SQLite) and the A2A task database (PostgreSQL, else SQLite), from `connector/database.yml` |
| `WorkflowDI` | The step handlers, the LangGraph graph and its runner |
| `A2aDI` | The agent card, the SDK's request handler, the task store and its cleanup |

`AgentDI` composes them and builds the two use cases; the container adds the boot-time state. `create_agent_application` builds the container and the app; routers are built from provider functions (`Callable[[], Service]`) that read the booted container. That's the **composition root** of [[Dependency injection]]: one place where concrete classes are chosen.

## Boundaries, enforced
`tests/architecture/test_boundaries.py` imports every module and fails if, for example, the domain imports LangChain, or the application imports a web framework, or one inbound adapter imports another, or anything but `adapter/inbound/a2a/` imports the A2A SDK (they share only `adapter/inbound/exception/` and `turn_status.py`) ([[Architecture tests]]). Without that test, layers erode one "quick" import at a time.

## Boot
1. Settings from `config/<APP_ENV>/` and env ([[pycraftcore configuration]]).
2. Logging and telemetry (pycraftcore).
3. Discover MCP tools on every connector; a server that's down is skipped with a warning.
4. `/health/readiness` answers 200 only now — Kubernetes routes traffic after boot ([[Probes]]).

## Check yourself
1. Why must the domain not import LangGraph, even though LangGraph runs the steps?
> [!success]- Answer
> LangGraph is one way to run the steps, an adapter. If the domain imported it, the rules couldn't be tested without it, and swapping the engine would mean rewriting the rules. Today the same steps run on a plain loop in tests, which proves the domain doesn't need it.
2. Where would you add a new model provider, and what else changes?
> [!success]- Answer
> In one LangChain model adapter under `adapter/outbound/`, plus its settings in config (`operation/llm.yml`, the URL and key in env). `ModelsDI` picks it from config. Nothing in the application or the domain changes, since nothing else knows LangChain exists.
3. What's a composition root, and which file is it here?
> [!success]- Answer
> The one place where concrete classes are chosen and connected at start-up. Here it's `bootstrap/di/`: `AgentDI` composing one wiring class per kind, used by `create_agent_application`, which builds the container and the FastAPI app.

## Go further
- [Alistair Cockburn: Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/).
- [import-linter](https://import-linter.readthedocs.io/) — another way to enforce layers in Python.
