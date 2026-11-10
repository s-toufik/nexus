---
type: path
track: Tours
time: ~5 h
projects: ["[[Agent runtime]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the agent runtime

> **Goal:** know the agent end to end — what it does with a message, how it's built, how it's configured, deployed and evaluated — and the principles behind it.
> **Time:** ~5 h. **Before:** [[Path - Tour of the homelab]] helps. **Then:** [[Path - Tour of the agent toolbox]] · [[Path - Agents]]. **All paths:** [[Paths]]

How each lesson works: **Learn** → **Do** (👀 looks, ✋ changes) → **Check** → **You can now**.

## 1. What it is, and why · ~45 min

### Learn
**Definitions**
- **Agent** — a program that uses a language model in a loop to decide and take actions (tool calls) until it can answer ([[AI agents and sandboxing]]).
- **Turn** — one user message and all the work done for it.
- **Plan** — the steps the agent proposes before using tools, each naming one tool; you approve it.
- **Outcome** — the kind of reply, in `final.metadata.outcome`: `answered`, `awaiting_approval`, `clarification`, `best_effort`, `budget_exhausted`, `refused`.
- **Tool** — a function the agent can call through MCP, published by [[Agent toolbox]].

**How it works**
```text
client ── POST /v1/stream ──► agent-runtime
   ▲                           understand ─► (clarify | plan | act) ─► … ─► finish ─► summarize
   └──── SSE: status · token · final · complete      │                     │
                                     OpenAI-compatible API (model)   MCP (tools)   MongoDB (conversations)
```
A direct question is answered at once; anything needing tools first becomes a plan you approve; tools run; a review step checks the answer; the reply streams back.

**Example from our projects** — a request and the frames it produces:
```bash
curl -N http://<HOMELAB_DOMAIN>:8000/v1/stream -H 'Content-Type: application/json' \
  -d '{"message": "What is a KV cache?", "model_name": "qwen3-8b", "request_id": "tour-1"}'
```
```text
event: status
data: {"content": "Comprehending the request", …}

event: token
data: {"content": "A KV cache keeps the keys and values …", …}

event: final
data: {"content": "…", "metadata": {"outcome": "answered", "model": "qwen3-8b", "input_tokens": "…", …}}

event: complete
data: {…}
```
`request_id` is the conversation: send another message with the same id and it continues.

**Common mistake** — treating a plan as an answer. `awaiting_approval` means nothing has run yet; the client must offer yes / edit / drop.

### Do
1. 👀 homelab-ui's Agent page, auto-approve off: ask "What is a KV cache?", then "Compute 2^20 with Python and save it to tour_pow.txt" → a plan; reply "yes".
2. 👀 Hover an answer → the arrow: model, tools, steps, tokens, outcome.

### Check
1. Why did the question answer at once but the task come back as a plan?
> [!success]- Answer
> *understand* classified the question as answerable directly (→ act → finish) and the task as needing tools (→ plan). A plan that uses tools waits for approval unless auto-approve is on.

**You can now:** predict, for a message, whether you'll get an answer, a question or a plan.

## 2. How a message is routed · ~1.5 h

### Learn
**Definitions**
- **Step** — one stage of a turn: understand, clarify, plan, screen, act, run_tools, review, feedback, finish, summarize.
- **Transition** — (source step, target step, condition); `TurnPolicy` is the ordered list of them.
- **Condition** — a pure function of the `Turn` (`needs_plan`, `asks_for_tools`, `retry_allowed`…).
- **Budget** — `max_iterations` (steps per message) and `max_reflection_retries` (rewrites after a rejected review).

**How it works**
After a step finishes, `TurnPolicy.next(step, turn)` walks its transitions in order and takes the **first** whose source is that step and whose condition holds. The LangGraph graph is generated from this table.

**Example from our projects** — `src/agent_runtime/domain/workflow/turn_policy.py` (excerpt, without the guardrail):
```python
Transition(Step.UNDERSTAND, Step.PLAN, needs_plan),
Transition(Step.UNDERSTAND, Step.CLARIFY, is_ambiguous),
Transition(Step.UNDERSTAND, Step.ACT),
Transition(Step.PLAN, Step.ACT, has_approved_plan),
Transition(Step.PLAN, Step.FINISH),
Transition(Step.ACT, Step.PLAN, asks_for_plan_without_one),
Transition(Step.ACT, Step.FINISH, ran_out_of_steps),
Transition(Step.ACT, Step.RUN_TOOLS, asks_for_tools),
Transition(Step.ACT, Step.ACT, leaves_plan_unfinished),
Transition(Step.ACT, Step.FINISH, is_plain_direct_answer),
Transition(Step.ACT, Step.REVIEW),
Transition(Step.RUN_TOOLS, Step.ACT),
Transition(Step.REVIEW, Step.FEEDBACK, retry_allowed),
Transition(Step.REVIEW, Step.FINISH),
```
and one condition from `conditions.py`:
```python
def retry_allowed(turn: Turn) -> bool:
    verdict = turn.last_verdict
    return (
        verdict is not None
        and verdict.rejects
        and turn.retries < turn.settings.max_retries
        and turn.steps_taken < turn.settings.max_steps
    )
```
A rejected answer is rewritten only while both budgets have room.

**Common mistake** — reading the table as "all matching rows run". Order matters: `ran_out_of_steps` is checked *before* `asks_for_tools`, so a turn with no steps left finishes instead of calling more tools.

### Check
1. Trace "shorter" sent right after an answer.
> [!success]- Answer
> understand (a rework, not a task: `needs_plan` false, not ambiguous) → act → not a plain direct answer → review → (accepted) finish → summarize; outcome `answered`.

**You can now:** explain any reply from its route. Deep dives: [[Agent runtime turn]] · [[Agent runtime plans and outcomes]].

## 3. How it's built · ~1 h

### Learn
**Definitions**
- **Hexagonal architecture** — rules in the middle, technologies at the edges behind ports ([[Hexagonal architecture]]).
- **Port** — an interface the core owns; here `typing.Protocol`s in `application/port/outbound/` (`Actor`, `Planner`, `ToolExecutor`, `WorkflowRunner`…).
- **Adapter** — an implementation of a port with a library: LangChain models, the MCP `Toolbox`, the LangGraph runner, the SSE presenter.
- **Composition root** — `AgentDI` and `create_agent_application`, where concrete classes are chosen ([[Dependency injection]]).

**How it works**
```text
bootstrap   settings · AgentDI · container · Litestar API (pycraftcore.web_litestar)
adapter     inbound: StreamAgentController, SsePresenter · outbound: LangChain, MCP Toolbox, LangGraph, checkpointer
application HandleMessage · *_step.py handlers · ports
domain      Conversation · Turn · Plan · TurnPolicy — plain dataclasses
```

**Example from our projects** — the API is assembled with pycraftcore's toolkit (`src/bootstrap/application/litestar/litestar_api.py`):
```python
return create_app(
    api,
    routes=[AgentRouter, actuator_router(actuator)],
    lifespan=lifespan,
    exception_handlers={ServerAtCapacityException: detail_handler(503)},
    dependencies={
        "agent": Provide(agent, sync_to_thread=False),
        "models": Provide(models, sync_to_thread=False),
    },
    on_startup=[_log_routes(logger)],
)
```
`create_app` adds the request id middleware, CORS, docs and the base path; `dependencies` is Litestar's DI handing the controller to routes; too many streams → 503.

**Common mistake** — importing LangChain in a step handler "to save time". `tests/architecture/test_boundaries.py` fails the build: the core must not know the libraries.

### Do
👀 In the repository, one sentence per folder: `domain/workflow/`, `application/step/`, `application/port/outbound/`, `adapter/outbound/langgraph/`, `adapter/outbound/llm/langchain/prompts/`, `src/bootstrap/`.

### Check
1. Where would you change what the model is told when it writes a plan?
> [!success]- Answer
> In the plan role's prompts: `adapter/outbound/llm/langchain/prompts/`.

**You can now:** find the file behind any behaviour. Deep dive: [[Agent runtime layers]].

## 4. Configured, deployed, evaluated · ~1 h

### Learn
**Definitions**
- **Connector / operation** — pycraftcore configuration: where something is / what you do with it ([[pycraftcore configuration]]).
- **Model role** — a step that calls a model (`agent_context`, `agent_plan`, `agent_act`, `agent_reflection`, `agent_guard`, `agent_summary`), each pinnable to one model.
- **Evaluation** — testing the running agent from outside with realistic cases ([[Agent runtime evaluation]]).

**How it works**
Env variables fill `config/<APP_ENV>/`; `operation/llm.yml` lists models users can pick; `operation/agent.yml` pins roles; `connector/mcp.yml` lists MCP servers. A tag `vX.Y.Z` publishes image + chart; homelab-infra deploys the version it names. `make evaluate` grades the deployed agent.

**Example from our projects** — adding another MCP server, from agent-runtime's README:
```yaml
connector:
  external_mcp_analytics:
    name: external_mcp_analytics
    type: mcp
    base_url: https://<analytics-host>/mcp
    timeout: 30
    transport: streamable_http
    auth:
      type: token
      key_name: Authorization
      key_value: ${oc.env:ANALYTICS_MCP_TOKEN,''}
```
List it under `mcp:` in `config/root.yml`, restart: its tools join the catalogue.

**Common mistake** — setting an optional variable to an empty string in a deployment (`WEB_DOCS=`): it overrides the YAML default and the agent refuses to start.

### Do
👀 On the server: `kubectl -n homelab get deploy agent-runtime -o jsonpath='{.spec.template.spec.containers[0].env}' | jq -r '.[].name'` → the env variables it gets; match three to [[Agent runtime - Configure it]].

### Check
1. How does the agent find its tools, and what if the toolbox is down when it starts?
> [!success]- Answer
> At boot it lists the tools of every MCP connector (`toolbox` and any `external_mcp_*`). A server that's down is skipped with a warning; its tools are missing until the agent restarts.

## 5. The principles inside · ~30 min
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Ports and adapters | [[Hexagonal architecture]] | `domain/`, `application/port/`, `adapter/` | [[Path - Design that lasts]] |
| Composition root | [[Dependency injection]] | `AgentDI`, `create_agent_application` | [[Path - Design that lasts]] |
| Boundaries enforced by tests | [[Architecture tests]] | `tests/architecture/test_boundaries.py` | [[Path - Design that lasts]] |
| Routing, plans, reflection, approval | [[Agent patterns]] | `TurnPolicy`, step handlers | [[Path - Agents]] |
| Workflow engine with checkpoints | [[LangGraph]] | `adapter/outbound/langgraph/` | [[Path - Agents]] |
| Context and token budgets | [[LLM fundamentals]] | `max_iterations`, summarize, last 20 tool calls | [[Path - Models]] |
| Streaming responses | [[Server-sent events]] | `StreamAgentController`, `SsePresenter` | [[Path - Serving HTTP well]] |
| Retries only for what's retryable | [[Retry and backoff]] | model calls (`connector/api.yml`) | [[Path - Serving HTTP well]] |
| Tools over a protocol | [[Model Context Protocol]] | `adapter/outbound/tool/` | [[Path - Tools and safety]] |
| Evaluation from outside | [[LLM evaluation]] | `src/agent_evaluation/` | [[Path - Proving it works]] |
| Guardrails | [[Guardrails and prompt injection]] | screen step, `GUARDRAIL_ENABLED` | [[Path - Tools and safety]] |

**Milestone:** you can explain any reply the agent gives, and point to the file that decided it.
