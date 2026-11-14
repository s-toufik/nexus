---
type: decisions
project: "[[Agent runtime]]"
tags: [agent-runtime, decisions]
updated: 2026-11-13
---

# Agent runtime decisions

Newest first.

## Routing as a table, LangGraph generated from it
- **Context:** an agent's control flow (when to plan, review, retry, stop) is where most bugs and surprises live.
- **Decision:** one ordered table, `TurnPolicy`, of (after, condition, next); the LangGraph edges are generated from it; a test checks they match.
- **Why:** the rules fit on one screen, are testable without a model, and the engine can be swapped (scenarios run on LangGraph and a plain loop).
- **Alternatives:** edges written in LangGraph directly (rules scattered in graph code, tied to the library); a single ReAct loop (no plans, no approval, hard to bound).

## Plans before tools, approved by the user
- **Decision:** any request that needs tools first produces a plan; it runs after "yes", or at once with `auto_approve`.
- **Why:** visible intent before action; a natural point for the guardrail; the user stays in control.
- **Consequences:** one extra round trip for tool work; `awaiting_approval` outcome in the API.

## Self-review with a bounded retry
- **Decision:** answers that aren't plain direct answers are reviewed against the request; a rejection sends feedback for at most `max_reflection_retries` rewrites, within the step budget.
- **Why:** catches answers that ignore part of the request; the bound keeps cost and latency finite.

## Hexagonal layers, enforced by a test
- **Decision:** domain and application free of LangChain, LangGraph, MCP, web frameworks; adapters at the edge; `test_boundaries.py`.
- **Why:** frameworks in AI move fast; the agent's logic shouldn't move with them.

## Streaming over SSE, events with an outcome
- **Decision:** `POST /v1/stream` answers SSE with `status`, `token`, `final` (+ metadata, outcome), `error`, `complete`; heartbeats every 15 s.
- **Why:** the user sees progress and the first words at once; the outcome lets clients render plans, questions and errors differently.
- **Alternatives:** WebSockets (two-way, heavier through proxies); one JSON response (long silent wait).

## FastAPI instead of Litestar
- **Decision:** the API is FastAPI, built with `pycraftcore.web_fastapi`: pydantic schemas, routers built from providers, the OpenTelemetry FastAPI instrumentation. Invalid bodies now get FastAPI's 422 (Litestar answered 400).
- **Why:** the official A2A SDK mounts its routes on FastAPI, so `/a2a` can use it without a second framework. The [[Web framework benchmark]] showed the speed difference doesn't matter here.
- **Alternatives:** stay on Litestar and mount the SDK's Starlette app inside it (two frameworks, two error and tracing stacks); stay on Litestar with a hand-written A2A server (what we had: spec guesses to maintain).

## A2A with the SDK, rules in `domain/a2a`
- **Decision:** `POST /a2a` speaks [[Agent2Agent protocol|A2A]] 1.0 through the official `a2a-sdk` (`DefaultRequestHandler`, in-memory task store, JSON-RPC routes, 0.3 compatibility). Our code is split by layer: `domain/a2a/` (task states and the rule from an `Outcome`, `TaskUpdate`, `A2aTaskRequest`, `AgentProfile`), `RunA2aTask` in the application (runs `HandleMessage`, reports `TaskUpdate`s), and in `adapter/inbound/a2a/` the SDK's `AgentExecutor`, a presenter and the card. `contextId` is the conversation.
- **Why:** minimal maintenance: the SDK follows the spec and does the protocol work; we keep only the rules, which stay plain Python and testable without the SDK. A boundary test keeps the SDK and protobuf out of the domain and the application.
- **Task limit:** the SDK's in-memory store keeps every task, so `BoundedTaskStore` keeps the last `A2A_MAX_TASKS` (1,000), dropping finished tasks first, then waiting ones, never running ones. Not announced in the agent card: it has no field for it, and a client meets the limit as `TaskNotFoundError`.
- **Alternatives:** the hand-written JSON-RPC server it replaced (its stream format was a guess); the SDK with no domain package (the outcome-to-state rule would live in an adapter); A2A tasks stored in a database (survive restarts; the SDK's `DatabaseTaskStore` needs SQLAlchemy, and the conversation is already stored).

## Evaluation as a separate program over HTTP
- **Decision:** `agent_evaluation` tests a running agent from outside, with code checks first and a judge model second, several runs per case.
- **Why:** evaluates what's deployed, including the model's behaviour; repeated runs expose flakiness.

## Conversations in MongoDB, SQLite fallback
- **Decision:** LangGraph checkpointer on MongoDB; SQLite when MongoDB is unreachable.
- **Why:** conversations are documents; local runs need no database server.
