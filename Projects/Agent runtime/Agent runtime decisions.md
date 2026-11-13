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

## A2A as a second inbound adapter
- **Decision:** `POST /a2a` speaks [[Agent2Agent protocol|A2A]] 1.0 over JSON-RPC, hand-written in `adapter/inbound/a2a/` (pydantic, no SDK), calling the same `HandleMessage`. `contextId` is the conversation; outcomes map to task states; tasks kept in memory (the last 1,000); streaming and cancel, no push notifications. Inside the adapter, `JsonRpcHandler` is the binding (reads the call, writes the reply, the SSE frames and the error codes) and `A2aController` the task operations (send, stream, get, cancel), like `StreamAgentController` for `/v1/stream`.
- **Why:** other agents can delegate to this one with a standard protocol, while the rules stay protocol-free. A small adapter is easier to follow than an SDK that brings its own web framework.
- **Alternatives:** the `a2a-sdk` package (Starlette or FastAPI apps, task stores; more than we need); A2A tasks stored in MongoDB (survive restarts, but the conversation already is); a `domain/a2a` package (the domain would know how it's called: A2A's task states are a translation of `Outcome`, done in the presenter, and the boundary test keeps pydantic out of the domain).

## Evaluation as a separate program over HTTP
- **Decision:** `agent_evaluation` tests a running agent from outside, with code checks first and a judge model second, several runs per case.
- **Why:** evaluates what's deployed, including the model's behaviour; repeated runs expose flakiness.

## Conversations in MongoDB, SQLite fallback
- **Decision:** LangGraph checkpointer on MongoDB; SQLite when MongoDB is unreachable.
- **Why:** conversations are documents; local runs need no database server.
