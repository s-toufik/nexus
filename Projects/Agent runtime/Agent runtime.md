---
type: project
status: active
started: 2026-09
repos: [agent-runtime, agent-evaluation]
tags: [project, agent-runtime, ai]
updated: 2026-11-15
---

# Agent runtime

> An AI agent served over HTTP. It understands a message, answers straight away when it can, writes a plan when the request needs tools, runs the tools once you approve, reviews its own answer, and streams everything back as server-sent events. One runtime, many agents: a folder `agents/<name>/` makes it the supervisor, observation, analysis, coding, security, kitchen or travel agent, each in its own pod.

## In one picture
![[Agent runtime - Harness.svg]]

The harness around the model, and what it holds: models, memory, protocols. How the parts connect, file by file:

![[Agent runtime.canvas]]

## Why it exists
- **A reliable agent, not a demo.** Explicit routing between steps, plans you approve before anything runs, a self-review, a step budget, resumable plans, a guardrail — the problems real agents face.
- **The brain of the [[Homelab]].** homelab-ui's Agent page and assistant drawer talk to it; its hands are [[Agent toolbox]].
- **A model of clean design.** Hexagonal layers enforced by tests; LangGraph is an adapter, not the architecture.

## What it does
| Endpoint | Gives |
|---|---|
| `POST /v1/api2a` | A conversation turn with this agent, as SSE: `status`, `token`, `final` (with `outcome` and metadata), `error`, `complete` (was `/v1/stream`) |
| `GET /v1/agents` | This agent and the agents it can call |
| `GET /v1/models` | The models a request may name, and the steps pinned to one model |
| `POST /a2a`, `GET /.well-known/agent-card.json` | The same agent for other agents, over [[Agent2Agent protocol\|A2A]] 1.0 (JSON-RPC): each message is a task |
| `/actuator/health`, `/health/liveness`, `/health/readiness`, `/actuator/info` | Health and version |
| `/docs` | Swagger UI, with `WEB_DOCS=true` |

## How it's built
| Part | Technology | Note |
|---|---|---|
| API | FastAPI through `pycraftcore.web_fastapi`, served by Granian; A2A through the official `a2a-sdk` | [[Python web frameworks]], [[ASGI]], [[Agent2Agent protocol]] |
| Agents | `agents/<name>/` read with pycraftcore's `OmegaTreeReader`: identity, tool scope, turn shape, peers, prompts | [[Agent runtime agents]] |
| Steps and routing | Plain Python: `HandleMessage`, step handlers, `TurnPolicy` (the rows an agent's turns allow) | [[Agent runtime turn]] |
| Workflow engine | LangGraph, generated from `TurnPolicy`; a checkpointer stores conversations in MongoDB (SQLite fallback) | [[LangGraph]] |
| Models | LangChain chat models, one adapter per role, any OpenAI-compatible server | [[OpenAI-compatible API]] |
| Tools | MCP clients to the toolbox (the agent's scope) and any `external_mcp_*` server; other agents through `ask_agents` (A2A client) | [[Model Context Protocol]], [[Agent2Agent protocol]] |
| Foundation | [[pycraftcore]]: configuration, logging, telemetry, web toolkit | |
| Evaluation | `agent_evaluation`, a separate program testing the running agent | [[Agent runtime evaluation]] |

## Read it in this order
1. [[Agent runtime layers]] — hexagonal layers, what each holds, how they're wired.
2. [[Agent runtime turn]] — one message through the code, the routing table, LangGraph.
3. [[Agent runtime plans and outcomes]] — what a user sees and why: plans, approval, budgets, outcomes.
4. [[Agent runtime evaluation]] — testing a live agent with code checks and a judge model.
5. [[Agent runtime agents]] — one runtime, many agents: folders, prompts, turn shapes, delegation.

Then [[Agent runtime decisions]] and [[Agent runtime guides]].

## Knowledge it uses
[[AI agents and sandboxing]] · [[Agent patterns]] · [[LangGraph]] · [[LLM evaluation]] · [[Guardrails and prompt injection]] · [[Hexagonal architecture]] · [[Dependency injection]] · [[Architecture tests]] · [[Server-sent events]] · [[ASGI]] · [[Python web frameworks]] · [[Data validation with pydantic and msgspec]] · [[asyncio]] · [[Retry and backoff]] · [[OpenTelemetry]] · [[MongoDB]] · [[Git flow]]

## Where it stands (2026-11-15)
- **On `develop`:** seven agents from `agents/`, one pod each; the supervisor answers what needs no data and delegates the rest over A2A with `ask_agents`; `/v1/stream` is now `/v1/api2a`. Needs pycraftcore 6.0.0 and an agent-toolbox with scopes.
- **Released:** v1.0.0 on the homelab.
- **Repositories:** [[agent-runtime]] (the agents) and [[agent-evaluation]] (the evaluation, out of the runtime since 2026-11-15).
