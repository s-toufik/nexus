---
type: decisions
project: "[[Agent runtime]]"
tags: [agent-runtime, decisions]
updated: 2026-11-15
---

# Agent runtime decisions

Newest first.

## A supervisor instead of an orchestrator and a chat agent
- **Decision:** `agents/supervisor/` replaces `orchestration` and `chat`: turns `direct, clarify, plan, review`, `tool_scope: none`, peers the six specialists. It answers from general knowledge what needs no data, and plans `ask_agents` calls for what needs the homelab's data or tools. Seven agents.
- **Why:** the orchestrator couldn't answer directly, so "hello" or "what is a probe?" became a plan to approve, then a call to chat: an extra pod, an extra model call and a wait for nothing.
- **Alternatives:** keep both (the cost above); give the orchestrator `direct` and keep chat as a peer (nobody calls it).
- **Consequences:** approval still covers every delegation: a direct turn only offers `request_plan`, never `ask_agents`. `AGENT` defaults to `supervisor`; on the homelab `agent-supervisor` takes `:8000` and `/api/agent`.

## One runtime, many agents
- **Decision:** an agent is a folder, `agents/<name>/` (identity, skills, `tool_scope`, `turns`, `peers`, `routes`, `prompts/<step>.md`), read like `config/` with pycraftcore's `OmegaTreeReader`; `AGENT=<name>` picks it, one process (one pod) per agent. Eight to start: orchestration, chat, observation, analysis, coding, security, kitchen, travel.
- **Why:** one codebase to fix and one image to build; each agent is a small reviewable folder. A pod each keeps their conversations, tasks, tools, restarts and logs apart.
- **Alternatives:** one service per agent (the same code copied eight times); several agents in one process (shared memory, models and failures; each agent's paths in config were kept for it, but a pod each made them rarely needed). The folder was first called `skills/`, but an A2A *skill* is one capability on a card, so `agents/` it is.
- **Consequences:** `HOMELAB_ASSISTANT` and `AgentProfile` are gone; the card comes from the folder. Each agent names its own MongoDB database and A2A tasks table when they share the servers.

## Prompts per agent, checked at boot
- **Decision:** a `PromptBook` gives each step the agent's `prompts/<step>.md`, else the generic template in `langchain/prompts/`; the generic ones say `You are {identity}` (the agent's description). Each prompt's `{placeholders}` must be known to its step, and the ones the step can't work without must be there.
- **Why:** agents differ most in what they're told, and a broken template should stop the pod, not fail the first user.
- **Alternatives:** whole prompts in YAML (escaping and multi-line pain); only a persona line per agent (the orchestrator needs a different plan prompt altogether).

## Turn shapes: allowed routes, not a graph in YAML
- **Decision:** `turns` lists routes the code knows (`direct`, `clarify`, `plan`, `review`); `TurnPolicy(shape)` keeps their rows and the graph only the steps they reach. A test walks every shape.
- **Why:** routes need conditions in code; a YAML graph could leave a step without a way out.
- **Consequences:** an agent without `plan` is never offered `request_plan`; one without `direct` plans what it would have answered (the orchestrator then hands it to chat).

## Delegation is one tool, `ask_agents`
- **Decision:** the orchestrator's peers become one tool built from their A2A cards; one call holds several `{agent, message}` requests run at the same time; later plan steps make calls serial. Peers run auto-approved: approving the orchestrator's plan covers them.
- **Why:** a plan step makes exactly one tool call, so one tool per agent couldn't call two at once; reusing the plan → act → run tools machinery keeps approvals, budgets and review as they are. Peers join and leave through the tool refresher, like MCP servers.
- **Alternatives:** a new DELEGATE step (a second way to run work); each peer's plan sent up for approval (one approval per agent and more round trips).

## `/v1/stream` is `/v1/api2a`
- **Decision:** the streaming route is `routes.api2a` (default `/v1/api2a`, *API to agent*), beside `/a2a` (agent to agent); `GET /v1/agents` lists the agents for a client's picker.
- **Consequences:** homelab-ui and the evaluation moved with it; the old path answers 404.

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
- **Decision:** `POST /a2a` speaks [[Agent2Agent protocol|A2A]] 1.0 through the official `a2a-sdk` (`DefaultRequestHandler`, its database task store, JSON-RPC routes, 0.3 compatibility). Our code is split by layer: `domain/a2a/` (task states and the rule from an `Outcome`, `TaskUpdate`, `A2aTaskRequest`, `AgentProfile`), `RunA2aTask` in the application (runs `HandleMessage`, reports `TaskUpdate`s), and in `adapter/inbound/a2a/` the SDK's `AgentExecutor`, a presenter and the card. `contextId` is the conversation.
- **Why:** minimal maintenance: the SDK follows the spec and does the protocol work; we keep only the rules, which stay plain Python and testable without the SDK. A boundary test keeps the SDK and protobuf out of the domain and the application.
- **A2A settings in their own connector and operation:** `connector/a2a.yml` (`a2a_self`: the URL the card announces, binding `JSONRPC`, refused otherwise) and `operation/a2a.yml` (the default model), from pycraftcore 6.0.0, instead of the ASGI server's `parameters`. The task store's table and TTL come from the chosen database operation (`a2a_tasks_postgresql` or `a2a_tasks_sqlite`); the retention purges that table, and doesn't run without a `ttl`.
- **Turn options in the card:** the agent's own options (model, auto-approve) are an A2A extension in `capabilities.extensions`, `https://github.com/s-toufik/agent-runtime/a2a/turn-options/v1`, with `required: false`. Its `params` (models, default model) are filled when the card is served, from `DescribeA2aOptions`, the same rule `RunA2aTask` uses for the default, so the card and the turn can't disagree. The protocol's own fields (message, ids, version) stay out of the card: every A2A client knows them. The metadata keys carry the extension's URI, as the spec suggests; the short `model` / `autoApprove` stay accepted. The SDK doesn't send back which extensions were activated, so the options are read whether or not the client names the extension; their values are type-checked.
- **Task storage:** the SDK's `DatabaseTaskStore` on a SQLAlchemy engine from [[pycraftcore]]: PostgreSQL when reachable at boot, else SQLite next to the conversation checkpoint. Tasks survive a restart; `TaskRetention` deletes those not updated for `A2A_TASK_TTL` (a week, like the conversations). The handler is built before boot, so it reaches the chosen store through `DelegatingTaskStore`. The TTL isn't announced in the agent card: it has no field for it, and a client meets it as `TaskNotFoundError`.
- **Alternatives:** the hand-written JSON-RPC server it replaced (its stream format was a guess); the SDK with no domain package (the outcome-to-state rule would live in an adapter); tasks in memory, capped by count (what we had: lost on restart); tasks in MongoDB (the SDK has no MongoDB store, so we'd maintain one).

## Wiring split by kind
- **Decision:** `bootstrap/di/` has one wiring class per kind (`ToolsDI`, `ModelsDI`, `StorageDI`, `WorkflowDI`, `A2aDI`), each taking its dependencies in its constructor; `AgentDI` only composes them and builds the use cases.
- **Why:** one 370-line class mixed tools, models, storage and the graph; each part can now be read and tested alone, and its dependencies are visible in its constructor.
- **Alternatives:** mixins sharing `self` (shorter, but each needs attributes it doesn't declare); one class per adapter (too fine for wiring).

## Evaluation as a separate program over HTTP
- **Decision:** `agent_evaluation` tests a running agent from outside, with code checks first and a judge model second, several runs per case.
- **Why:** evaluates what's deployed, including the model's behaviour; repeated runs expose flakiness.

## Conversations in MongoDB, SQLite fallback
- **Decision:** LangGraph checkpointer on MongoDB; SQLite when MongoDB is unreachable.
- **Why:** conversations are documents; local runs need no database server.
