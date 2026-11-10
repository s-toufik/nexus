---
type: path
track: Tours
time: ~4 h
projects: ["[[Agent runtime]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the agent runtime

> **Goal:** know the agent end to end — what it does with a message, how it's built, how it's configured, deployed and evaluated — and the principles behind it.
> **Time:** ~4 h. **Before:** [[Path - Tour of the homelab]] helps. **Then:** [[Path - Tour of the agent toolbox]] · [[Path - Agents]]. **All paths:** [[Paths]]

## 1. What it is, and why · ~45 min
**Read:** [[Agent runtime]] and its canvas.

**Do:**
1. 👀 In homelab-ui's Agent page: ask a direct question ("What is a KV cache?"), then a task ("Compute 2^20 with Python and save it to journey_pow.txt") with auto-approve off. Notice the plan, then reply "yes".
2. 👀 Hover an answer → the arrow: model, tools, steps, tokens.

**Check:**
1. Why did the question answer at once but the task come back as a plan?
> [!success]- Answer
> *understand* classified the question as answerable directly (→ act → finish), and the task as needing tools (→ plan). Plans that use tools wait for approval unless auto-approve is on.

## 2. How a message is handled · ~1 h
**Read:** [[Agent runtime turn]] · [[Agent runtime plans and outcomes]]

**Check:**
1. Name the outcomes a client can receive, and what the UI does with `awaiting_approval` and `budget_exhausted`.
> [!success]- Answer
> `answered`, `awaiting_approval`, `clarification`, `best_effort`, `budget_exhausted`, `refused`. For `awaiting_approval` the user can say yes, edit, or drop the plan; for `budget_exhausted` with `resumable` they can say "continue".

## 3. How it's built · ~1 h
**Read:** [[Agent runtime layers]] · [[agent-runtime]]

**Do:** 👀 In the repository: `src/agent_runtime/domain/workflow/turn_policy.py`, `application/step/`, `application/port/outbound/`, `adapter/outbound/langgraph/`, `src/bootstrap/`. One sentence per folder.

**Check:**
1. Where would you change what the model is told when it writes a plan?
> [!success]- Answer
> In the prompts of the plan role: `adapter/outbound/llm/langchain/prompts/`.

## 4. Configured, deployed, evaluated · ~1 h
**Read:** [[Agent runtime - Configure it]] (skim) · [[Agent runtime - Release a version]] · [[Agent runtime evaluation]]

**Do:** 👀 On the server: `kubectl -n homelab get deploy agent-runtime -o jsonpath='{.spec.template.spec.containers[0].env}' | jq -r '.[].name'` → the env variables it gets; match three to the configuration table.

**Check:**
1. How does the agent find its tools, and what if the toolbox is down when it starts?
> [!success]- Answer
> At boot it lists the tools of every MCP connector (`toolbox` and any `external_mcp_*`). A server that's down is skipped with a warning; its tools are missing until the agent restarts.

## 5. The principles inside
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
