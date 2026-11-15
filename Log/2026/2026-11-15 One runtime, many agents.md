---
type: log
date: 2026-11-15
projects: ["[[Agent runtime]]", "[[Agent toolbox]]", "[[Homelab]]", "[[Homelab UI]]", "[[pycraftcore]]"]
tags: [log, ai, agents]
---

# 2026-11-15 One runtime, many agents

## What we did
- agent-runtime became one runtime for many agents: a folder `agents/<name>/` (identity, skills, tool scope, turns, peers, prompts) and `AGENT=<name>` per process. Eight agents to start: orchestration, chat, observation, analysis, coding, security, kitchen, travel ([[Agent runtime agents]]).
- The orchestrator never answers itself: `ask_agents` sends several requests at once over A2A, later plan steps make them serial, and approving its plan covers the agents it calls.
- Each agent's system prompts per step, checked at boot against the step's placeholders; generic prompts for the rest.
- Turn shapes: an agent's `turns` keeps only some rows of the routing table; a test walks every shape for dead ends.
- agent-toolbox serves its tools by scope, one MCP endpoint each, each with its own `python_executor` ([[Agent toolbox - Add or change a scope]]).
- `/v1/stream` became `/v1/api2a`; `GET /v1/agents` lists the agents; homelab-ui got an agent picker.
- homelab-infra: one release per agent, gateway routes `/api/agents/<name>`, the toolbox's fence admits every agent ([[Homelab - Run the LLM and agent]]).
- pycraftcore: `OmegaTreeReader`, the configuration's YAML loading for any tree ([[pycraftcore - Configure a service]]).
- First run on the server: the orchestrator's call to observation failed (`varchar(36)`: the peer's `contextId` was `<conversation>:<peer>`), and every agent logged as `agent-runtime-service`. Now a peer's `contextId` is a uuid5 of both, and each agent's service name is `agent-<name>`.
- Then `ask_agents` hung: peers got no model and took their first listed one, a small local model, while the orchestrator waited without a sign. Now every tool call gets a `ToolContext` (conversation, model) and peers run in the orchestrator's model.
- `python_executor` became opt-in: a scope lists it in its `tools` to get its own; observation and security don't.
- The orchestrator and chat merged into one **supervisor** (`agents/supervisor/`): it answers what needs no data and plans `ask_agents` calls for the rest. Seven agents; `agent-supervisor` takes `:8000` and `/api/agent`. homelab-infra got `make pull` and `S=agents` (helmfile label `scope: agents`).
- The guardrail moved into each `agent.yml` (`guardrail: true`, the default); `GUARDRAIL_ENABLED` is gone.
- An agent may fix its model in `agent.yml` (`model:`); kitchen runs on `nvidia/nemotron-3.5-lightning-30b-a3b`.
- Cleanup: names derived from `AGENT` (database, tasks table, peer connectors), no legacy A2A keys, no `role`/`A2A_MODEL`, the guardrail in `TurnShape`, and the evaluation moved to its own repository, [[agent-evaluation]].
- Tried locally: the toolbox, observation, chat and orchestration as four processes; scopes, cards, `/v1/agents` and a real parallel `ask_agents` call worked (no model server was reachable, so every answer was an error).

## What I learned
- A name can clash with a protocol's vocabulary: an A2A *skill* is one capability on a card, so the folder of agents is `agents/`, not `skills/` ([[Agent2Agent protocol]]).
- When a plan step makes exactly one tool call, parallel delegation needs one tool that fans out, not one tool per agent.
- A routing table chosen from known routes stays testable; a graph assembled from YAML wouldn't ([[Agent runtime turn]]).
- The a2a-sdk stores task and context ids in `varchar(36)` columns: an id built by joining strings breaks on PostgreSQL only (SQLite doesn't check the size), so a derived id must be a UUID itself.
- What a tool needs from the turn should reach it as an argument, not from an ambient context variable: the model wasn't in one, so it was silently lost.
- The a2a-sdk can define a custom-named task table only once per process: create its model once per table name and reuse it.

## Decisions
- [[Agent runtime decisions]]: a supervisor instead of an orchestrator and a chat agent; the guardrail set per agent; an agent may fix its model; the cleanup after the agents.
- [[Agent runtime decisions]]: one runtime, many agents; prompts per agent; turn shapes; delegation as `ask_agents`; `/v1/api2a`.
- [[Agent toolbox decisions]]: tools served by scope.
- [[Homelab decisions]]: one release per agent.
- [[Homelab UI decisions]]: pick the agent, listed by the orchestrator.
- [[pycraftcore decisions]]: a generic YAML tree reader.

## Next
- [ ] Publish pycraftcore 6.0.0; turn off the local path source in agent-runtime and agent-toolbox, `uv lock`, release them, then homelab-ui.
- [ ] On the server: *Move from agent-runtime to the agents* in [[Homelab - Run the LLM and agent]].
- [ ] On the server: *Move from the orchestrator and chat to the supervisor* in [[Homelab - Run the LLM and agent]].
- [ ] Tune each agent's prompts once real models answer.
