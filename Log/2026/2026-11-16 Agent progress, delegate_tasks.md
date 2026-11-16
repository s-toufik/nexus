---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]", "[[Agent runtime]]"]
tags: [log, agents, frontend]
---

# 2026-11-16 Agent progress, delegate_tasks

## What we did
- **agent-runtime**: the supervisor's tool `ask_agents` ({agent, message}) is now `delegate_tasks` ({agent, task}). A new domain `Progress` (`domain/event/progress.py`) says what an agent is doing: `plan` (every step done, current or to do), `tool` (a call running, done or failed, with its arguments on one line), `agent` (a delegated task working, then answered, needs_input, refused, failed or unreachable), with a `path` of agent names for nested work. `AgentNode` publishes the plan after understand, plan and run-tools; `RunToolsStep` publishes each call's start and end; `DelegateTasksTool` publishes each agent it hands a task to and forwards what that agent reports, placed under its name.
- Peers are asked with A2A `SendStreamingMessage` instead of a blocking call; each agent sends its progress as `working` status updates with `metadata.progress` (JSON). The web stream gets a `progress` event with the same JSON. 615 tests (an in-process A2A server streams a peer's plan and tools to the supervisor), ruff and ty pass.
- **homelab-ui**: `agent-progress.ts` folds the events into a tree per answer, and the `agent-progress` component shows the agent's plan (done ✓, current spinning, to come ○) and tool calls, then a card per delegated agent with its scene, task, own steps and tools (folds once answered), side by side when several work at once. 189 tests, build.

## What I learned
- Over A2A, a status update with no message and only metadata is the clean way to stream structured progress; the client reads `status_update.metadata`, builds the answer from `artifact_update` chunks and the outcome from the last status.
- LangGraph's stream writer (`get_stream_writer`) works inside a tool running in `asyncio.gather`, so a tool can publish events of the turn it belongs to.

## Next
- [ ] Commit and release agent-runtime and homelab-ui together (the old UI ignores `progress` events; an old supervisor still calls `ask_agents`).
- [ ] Agents map: read the supervisor's `agent` progress to draw exact lines instead of guessing from simultaneous activity.
