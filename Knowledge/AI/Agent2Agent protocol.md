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
- **agent-runtime is an A2A server**: `POST /a2a` (JSON-RPC) and its card at `/.well-known/agent-card.json`, beside `/v1/stream`, served by the official `a2a-sdk` mounted on FastAPI. The SDK does the protocol (JSON-RPC, task store, streaming, cancel, `ListTasks`, `SubscribeToTask`, A2A 0.3 compatibility), so we maintain only what is ours ([[Agent runtime layers]], [[Hexagonal architecture]]):
  - `domain/a2a/`: `TaskState` and the rule from an `Outcome` to a task state, `TaskUpdate`, `A2aTaskRequest`, `AgentProfile`. Plain Python, no SDK;
  - `application`: `RunA2aTask` (behind `RunA2aTaskPort`) runs `HandleMessage` in the task's conversation and reports each event as a `TaskUpdate`;
  - `adapter/inbound/a2a/`: the SDK's `AgentExecutor`, a presenter that turns a `TaskUpdate` into `TaskUpdater` calls, and the card. The only code that imports the SDK, and a boundary test checks it.
- `contextId` is the conversation (`request_id`); each message is a task.
- The agent's outcomes map onto task states: a plan waiting for approval, a question, or a paused plan → `INPUT_REQUIRED` (reply **yes**, an answer or **continue** in the same task); a refused plan → `REJECTED`; an answer → `COMPLETED` with an `answer` artifact ([[Agent runtime plans and outcomes]]).
- Tasks live in memory, at most `A2A_MAX_TASKS` (1,000 by default): past it, the oldest finished tasks go first, then the oldest waiting for input, never a running one. The limit isn't in the card: the card has no field for it, and a client learns it the protocol's way, with `TaskNotFoundError`. Push notifications aren't offered.
- How to call it: [[Agent runtime - Call the API#Talk to it as an A2A agent]].

## Pitfalls we met
- **A hand-written server left us guessing.** The first version wrote JSON-RPC by hand and guessed the stream frame format from the 0.3 binding; nothing proved it matched the spec. The SDK removes the guess, and a test now talks to `/a2a` with the SDK's own client.
- **Closing a stream doesn't stop the task.** A2A tasks outlive their connection: the client can come back with `SubscribeToTask` or `GetTask`, and only `CancelTask` stops the work.
- **No `A2A-Version` header means 0.3** to the SDK. Send `A2A-Version: 1.0`; 0.3 calls (`message/send`, `kind: "text"`) are still understood because compatibility is on.
- **The task store is updated in the background.** A `GetTask` right after a `returnImmediately` send can still show `SUBMITTED`; poll until the state changes.
- **The SDK's in-memory task store never forgets.** Each task keeps its history and artifacts, so a long-running server grows without end. `BoundedTaskStore` wraps it and keeps the last `A2A_MAX_TASKS`.
- **Enums are proto names**, `TASK_STATE_COMPLETED`, not `completed` as in A2A 0.3.

## Check yourself
1. MCP and A2A both let an agent call something over JSON-RPC. What's the difference in what's on the other side?
> [!success]- Answer
> MCP's other side is a tool server: the calling agent decides everything and gets a function's result. A2A's other side is another agent with its own model, tools and memory: you hand it a goal, it decides how, and answers with a task you follow. It's delegation, not a function call.
2. Our agent writes a plan and waits for approval. Which task state does an A2A client see, and how does it approve?
> [!success]- Answer
> `TASK_STATE_INPUT_REQUIRED`, with the plan and the approval prompt in `status.message`. The client sends a new message with the same `taskId` saying "yes"; the same task goes back to `WORKING`, then `COMPLETED` with the answer artifact.
3. agent-runtime has a `domain/a2a` package. What keeps it from depending on the SDK?
> [!success]- Answer
> It holds only our rules about tasks, in plain Python: which task state an `Outcome` gives, when a turn has ended, the agent's profile. The SDK's types (`AgentCard`, `TaskState` protos, `TaskUpdater`) appear only in `adapter/inbound/a2a/`, which translates both ways, and `test_boundaries.py` fails if the domain or the application imports `a2a` or protobuf.
4. Why use the SDK instead of the small hand-written JSON-RPC server it replaced?
> [!success]- Answer
> Less to maintain and nothing to guess: the SDK follows the spec (frame format, error codes, `ListTasks`, `SubscribeToTask`, 0.3 compatibility) and is updated with it. The cost, Starlette under FastAPI, was gone once agent-runtime moved to FastAPI. Our part shrank to the executor, the presenter and the card.

## Go further
- [A2A specification](https://a2a-protocol.org/latest/specification/) — the data model (§4), the JSON-RPC binding (§9) and the error codes (§5.4).
- [[Model Context Protocol]] · [[Agent patterns]]
