---
type: project
status: active
started: 2026-09
repos: [agent-runtime]
tags: [project, agent-runtime, ai]
updated: 2026-11-13
---

# Agent runtime

> An AI agent served over HTTP. It understands a message, answers straight away when it can, writes a plan when the request needs tools, runs the tools once you approve, reviews its own answer, and streams everything back as server-sent events.

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
| `POST /v1/stream` | A conversation turn, as SSE: `status`, `token`, `final` (with `outcome` and metadata), `error`, `complete` |
| `GET /v1/models` | The models a request may name, and the steps pinned to one model |
| `POST /a2a`, `GET /.well-known/agent-card.json` | The same agent for other agents, over [[Agent2Agent protocol\|A2A]] 1.0 (JSON-RPC): each message is a task |
| `/actuator/health`, `/health/liveness`, `/health/readiness`, `/actuator/info` | Health and version |
| `/docs` | Swagger UI, with `WEB_DOCS=true` |

## How it's built
| Part | Technology | Note |
|---|---|---|
| API | FastAPI through `pycraftcore.web_fastapi`, served by Granian; A2A through the official `a2a-sdk` | [[Python web frameworks]], [[ASGI]], [[Agent2Agent protocol]] |
| Steps and routing | Plain Python: `HandleMessage`, step handlers, `TurnPolicy` | [[Agent runtime turn]] |
| Workflow engine | LangGraph, generated from `TurnPolicy`; a checkpointer stores conversations in MongoDB (SQLite fallback) | [[LangGraph]] |
| Models | LangChain chat models, one adapter per role, any OpenAI-compatible server | [[OpenAI-compatible API]] |
| Tools | MCP clients to the toolbox and any `external_mcp_*` server | [[Model Context Protocol]] |
| Foundation | [[pycraftcore]]: configuration, logging, telemetry, web toolkit | |
| Evaluation | `agent_evaluation`, a separate program testing the running agent | [[Agent runtime evaluation]] |

## Read it in this order
1. [[Agent runtime layers]] — hexagonal layers, what each holds, how they're wired.
2. [[Agent runtime turn]] — one message through the code, the routing table, LangGraph.
3. [[Agent runtime plans and outcomes]] — what a user sees and why: plans, approval, budgets, outcomes.
4. [[Agent runtime evaluation]] — testing a live agent with code checks and a judge model.

Then [[Agent runtime decisions]] and [[Agent runtime guides]].

## Knowledge it uses
[[AI agents and sandboxing]] · [[Agent patterns]] · [[LangGraph]] · [[LLM evaluation]] · [[Guardrails and prompt injection]] · [[Hexagonal architecture]] · [[Dependency injection]] · [[Architecture tests]] · [[Server-sent events]] · [[ASGI]] · [[Python web frameworks]] · [[Data validation with pydantic and msgspec]] · [[asyncio]] · [[Retry and backoff]] · [[OpenTelemetry]] · [[MongoDB]] · [[Git flow]]

## Where it stands (2026-11-08)
- **Released:** v1.0.0 on the homelab.
- **On `develop`:** see the repository; the toolbox's new MCP tools appear without changes here (discovered at start).
