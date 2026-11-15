---
type: architecture
project: "[[Agent runtime]]"
order: 5
tags: [agent-runtime, architecture, ai]
updated: 2026-11-15
---

# Agent runtime agents

> One runtime, many agents. A folder `agents/<name>/` says who the agent is (name, skills), which tools it sees, which routes its turns may take, and what its models are told at each step. A process started with `AGENT=<name>` becomes that agent. The orchestration agent never answers itself: it gives each part of a request to the agent that owns it, several at once when they're independent.

Back: [[Agent runtime evaluation]] · Up: [[Agent runtime]]

**Do it:** [[Agent runtime - Add an agent]]

## The folder
```text
agents/<name>/
  agent.yml           name, description, skills, tool_scope, guardrail, model, turns, peers, routes
  skills/*.yml        optional: skills merged in, referenced as ${skills}
  prompts/<step>.md   optional: the system prompt of a step
```
It's read like `config/`, with pycraftcore's `OmegaTreeReader` ([[pycraftcore - Configure a service]]): a root file, merged folders, `${oc.env:…}`. A pydantic schema refuses unknown keys, the folder must name its own agent, and a prompt file must name a step: a mistake stops the boot with its file and key.

| Agent | turns | tool_scope | Own prompts |
|---|---|---|---|
| supervisor | direct, clarify, plan, review | none (its tool is `ask_agents`) | plan, act |
| observation, analysis, coding, security, kitchen, travel | direct, clarify, plan, review | its own toolbox scope | none |

## What each field changes
```text
agent.yml ─┬─ name, description, skills ─► the A2A card (the description is also {identity} in prompts)
           ├─ tool_scope ───────────────► ToolsDI: TOOLBOX_URL + /<scope>  (none: no toolbox)
           ├─ guardrail ────────────────► TurnPolicy(screen): plan ─► screen ─► act
           ├─ model ────────────────────► AgentModels: every turn on it, the only one listed
           ├─ turns ────────────────────► TurnShape ─► TurnPolicy keeps the allowed rows ─► the graph's steps
           ├─ peers ────────────────────► ask_agents, one tool for all of them (A2A)
           ├─ routes ───────────────────► where /a2a and /v1/api2a are served
           └─ prompts/<step>.md ────────► PromptBook: the agent's prompt, else the generic one
```

- **Prompts.** `PromptBook` (an outbound adapter, next to the LangChain prompts) gives each step its system prompt: the agent's file, or the generic template that ships with the code. Both are checked when the book is built: a prompt may only use its step's `{placeholders}` (and `{identity}`), and must use those the step can't do without (`{output_format}` where the answer is parsed, `{tools}` in plan, `{mode}` in act). So a typo fails at boot, not on the first message.
- **Turns.** A route is a group of rows of the routing table ([[Agent runtime turn]]). Without `direct`, a direct question is planned; without `plan`, a task is answered directly and `request_plan` is never offered; without `clarify`, an ambiguous message takes the best reading; without `review`, an answer is final. The graph only gets the steps the shape reaches, and a test checks that every one of the 24 shapes (12 valid × guardrail on or off) leaves no step without a way out.
- **Guardrail.** `guardrail: true` (the default; every folder says it) puts the screen step after plan: fixed rules, then the guard model, refuse unsafe plans. It is per agent because the agents the supervisor calls run auto-approved: their own screening is the only check of their concrete steps. It replaced the `GUARDRAIL_ENABLED` variable, which the chart set to `true` for every pod.
- **Model.** `model` (optional) fixes the agent's model: `AgentModels` wraps the server's catalog, `model_for()` returns it whatever the request asks, and the listing (`/v1/models`, the card's turn options) shows only it. The server's pinned steps still win for their step. Without it, the request chooses (the UI menu, the A2A `model` key, the supervisor's model). `kitchen` runs on `nvidia/nemotron-3.5-lightning-30b-a3b`.
  ```text
  a step's model:  pinned step (server) ─► agent.yml model ─► the request's model ─► A2A_MODEL (if listed) ─► first listed
  ```
- **Tool scope.** The toolbox serves each scope at its own endpoint ([[Agent toolbox]]): the agent connects to its own and never sees the rest.
- **Peers.** `A2aPeerAgents` reads each peer's card (every minute, so an agent that starts later joins) and `AskAgentsTool` turns them into one tool: `ask_agents({requests: [{agent, message}]})`. The requests of one call run at the same time (`asyncio.gather`); a later plan step makes them serial. Each answer comes back marked `answered`, `needs_input`, `refused`, `failed` or `unreachable`. Peers run with `autoApprove` and the supervisor's model: approving the supervisor's plan approves the work it hands out. Every tool call gets the turn's `ToolContext` (conversation, model), so `ask_agents` passes both on; without the model, a peer took its first listed model, a small local one, and the supervisor waited up to its 600 s timeout. Each peer keeps its part of the conversation: its `contextId` is a UUID made from the conversation and the peer's name (uuid5), the same every time and within the 36 characters of the a2a-sdk's task table. Each agent's logs and traces carry the service name `agent-<name>`.
- **One per process.** Each agent is its own pod on the homelab ([[Homelab - Run the LLM and agent]]): its own conversations (MongoDB database `agent_<name>`), A2A tasks (table `tasks_<name>`), restarts and logs.

## Check yourself
1. Why are turns a list of allowed routes and not a graph written in YAML?
> [!success]- Answer
> A route needs a condition written in code (`needs_plan`, `retry_allowed`), and a graph assembled from YAML could leave a step with no way out. Choosing among routes the code knows keeps every shape testable: the test walks all of them.

2. The supervisor must ask observation and analysis about the same incident. One plan step or two?
> [!success]- Answer
> One, if neither needs the other's answer: both requests go in one `ask_agents` call and run at the same time. Two steps only when the second message needs the first answer.

3. An agent's `prompts/plan.md` forgets `{output_format}`. When do you find out?
> [!success]- Answer
> At boot: `PromptBook` refuses it (the plan's answer is parsed against that format), and the pod never becomes ready.

4. Why doesn't the supervisor see the toolbox?
> [!success]- Answer
> Its `tool_scope` is `none`: it answers from general knowledge or routes. Data and actions belong to the agents that own them, through their scopes, so the supervisor can't bypass them.

5. The supervisor answers questions directly. Can a direct answer call another agent without your approval?
> [!success]- Answer
> No. In a direct turn the actor is offered only `request_plan`, never `ask_agents`: any call to an agent goes through a plan you approve, and only then do the peers run auto-approved.

6. The supervisor sends its model, nemotron super, to the kitchen agent, whose `agent.yml` says `model: nvidia/nemotron-3.5-lightning-30b-a3b`. Which model plans the kitchen's work?
> [!success]- Answer
> The plan step's pinned model, if the server pins one (`agent_plan`); otherwise lightning, the kitchen's own. The supervisor's model is only a request, and an agent's fixed model wins over requests.
