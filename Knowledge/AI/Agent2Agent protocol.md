---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, a2a]
updated: 2026-11-13
---

# Agent2Agent protocol

> A2A is an open protocol for one agent to hand work to another agent: the client agent sends a **message**, the remote agent answers with a **task** whose state says whether it's done, needs input, or failed. Where [[Model Context Protocol|MCP]] gives an agent *tools*, A2A lets it talk to *other agents* as peers, without seeing their prompts, tools or memory.

## Why it matters
Agents built by different teams or vendors need a common way to find each other, delegate, and follow long-running work. A2A (version 1.0 in 2026, under the Linux Foundation) is that standard, so an orchestrator agent can call yours the same way it calls anyone's.

## How it works
- **Agent card**, at `/.well-known/agent-card.json`: name, description, version, `supportedInterfaces` (URL, binding such as `JSONRPC`, protocol version), `capabilities` (streaming, push notifications), input and output media types, and **skills** (what it can do, with examples). A client reads it to decide whether and how to call.
- **Bindings:** JSON-RPC 2.0 over HTTP, gRPC, or HTTP+JSON. Methods in JSON-RPC: `SendMessage`, `SendStreamingMessage` (server-sent events), `GetTask`, `CancelTask`, `SubscribeToTask`, `ListTasks`, push-notification configs.
- **Message:** `messageId`, `role` (`ROLE_USER`, `ROLE_AGENT`), `parts` (`{"text": …}`, files, data), and optionally `contextId` and `taskId`.
- **Task:** `id`, `contextId` (the conversation it belongs to), `status` (`state`, an optional agent `message`, a timestamp), `artifacts` (the results). States: `TASK_STATE_SUBMITTED`, `WORKING`, `INPUT_REQUIRED`, `AUTH_REQUIRED` (interrupted: the client must answer), `COMPLETED`, `FAILED`, `CANCELED`, `REJECTED` (terminal: the task can't take more messages).
- **Streaming:** each SSE frame carries one of `task`, `message`, `statusUpdate`, `artifactUpdate`.
- **Version:** the client sends `A2A-Version: 1.0`; an agent that doesn't speak it answers `VersionNotSupportedError`.
- **Errors** are JSON-RPC errors with A2A codes: `-32001` task not found, `-32002` not cancelable, `-32003` push not supported, `-32004` unsupported operation, `-32005` content type not supported, `-32009` version not supported.

## In our projects
- **agent-runtime is an A2A server**: `POST /a2a` (JSON-RPC) and its card at `/.well-known/agent-card.json`, beside `/v1/stream`. It's a second inbound adapter (`adapter/inbound/a2a/`) calling the same `HandleMessage` port, so the agent's rules don't know A2A exists ([[Agent runtime layers]], [[Hexagonal architecture]]).
- `contextId` is the conversation (`request_id`); each message is a task.
- The agent's outcomes map onto task states: a plan waiting for approval, a question, or a paused plan → `INPUT_REQUIRED` (reply **yes**, an answer or **continue** in the same task); a refused plan → `REJECTED`; an answer → `COMPLETED` with an `answer` artifact ([[Agent runtime plans and outcomes]]).
- Tasks live in memory (the last 1,000); streaming and cancel work, push notifications and `SubscribeToTask` don't.
- How to call it: [[Agent runtime - Call the API#Talk to it as an A2A agent]].

## Pitfalls we met
- **A task cancelled before its first step never released its slot.** An asyncio task cancelled before it starts never runs its `try/finally`, so the concurrency slot stayed taken. The cleanup now runs in the task's done-callback, which runs however the task ends.
- **Enums are proto names**, `TASK_STATE_COMPLETED`, not `completed` as in A2A 0.3; old examples on the web use the 0.3 shapes (`message/send`, `kind: "text"`).

## Check yourself
1. MCP and A2A both let an agent call something over JSON-RPC. What's the difference in what's on the other side?
> [!success]- Answer
> MCP's other side is a tool server: the calling agent decides everything and gets a function's result. A2A's other side is another agent with its own model, tools and memory: you hand it a goal, it decides how, and answers with a task you follow. It's delegation, not a function call.
2. Our agent writes a plan and waits for approval. Which task state does an A2A client see, and how does it approve?
> [!success]- Answer
> `TASK_STATE_INPUT_REQUIRED`, with the plan and the approval prompt in `status.message`. The client sends a new message with the same `taskId` saying "yes"; the same task goes back to `WORKING`, then `COMPLETED` with the answer artifact.
3. Why is A2A a new inbound adapter and not a change to `HandleMessage`?
> [!success]- Answer
> A2A is only another way to deliver the same request and present the same events. Keeping it in an adapter means the use case and the domain stay protocol-free, `/v1/stream` and `/a2a` behave the same, and a third protocol would again touch only the edge.

## Go further
- [A2A specification](https://a2a-protocol.org/latest/specification/) — the data model (§4), the JSON-RPC binding (§9) and the error codes (§5.4).
- [[Model Context Protocol]] · [[Agent patterns]]
