---
type: architecture
project: "[[Agent runtime]]"
order: 2
tags: [agent-runtime, architecture, ai]
updated: 2026-11-08
---

# Agent runtime turn

> One message is one **turn**: understand → (clarify | plan | act) → … → finish → summarize. Which step follows which is decided by one ordered table, `TurnPolicy`; the LangGraph graph is *generated* from it, and a test checks they match.

Previous: [[Agent runtime layers]] · Next: [[Agent runtime plans and outcomes]]

**Do it:** [[Agent runtime - Change the agent]] · [[Agent runtime - Call the API]]

## A turn in the code
1. **`StreamAgentController`** validates the body, starts `HandleMessage` in the background, and returns the SSE response at once — the client sees events while the work runs.
2. **`HandleMessage`** builds a `Turn` (the message, the model's budget, the options) and asks the `WorkflowRunner` to run it on conversation `request_id`.
3. **`LangGraphWorkflowRunner`** loads the stored `Conversation` and runs the graph. Each node decodes the state, runs its step handler, saves the state; the **checkpointer** keeps the conversation between messages (MongoDB, SQLite fallback).
4. After each step, **`TurnPolicy.next(step, turn)`** picks the next. Each node emits a `TurnEvent`; **`SsePresenter`** turns it into frames (`status`, `token`, `final`…).
5. **`finish`** settles the answer and the plan, appends the exchange to the history; **`summarize`** compacts the history when it passes half the context.

## The steps
| Step | Does | Model role |
|---|---|---|
| understand | What is this message: task, plan change, yes/drop, direct question, rework, too vague | `agent_context` |
| clarify | Ask a question back | — |
| plan | Write steps, each naming one tool | `agent_plan` |
| screen | (guardrail on) refuse unsafe plans | `agent_guard` |
| act | Answer, or call the current step's tools | `agent_act` |
| run_tools | Execute tool calls over MCP | — |
| review | Check the answer against the request | `agent_reflection` |
| feedback | Hand the critique back to act | — |
| finish, summarize | Settle and save; compact history | `agent_summary` |

Each role can be pinned to a model in `operation/agent.yml` (e.g. a small fast model for understand), or follow the model the user chose.

## The routing table
`domain/workflow/turn_policy.py`: after a step, the **first row whose condition holds wins**.
| After | Condition | Next |
|---|---|---|
| understand | `needs_plan` | plan |
| understand | `is_ambiguous` | clarify |
| understand | always | act |
| plan | `has_approved_plan` | act |
| plan | always | finish |
| act | `asks_for_plan_without_one` | plan |
| act | `ran_out_of_steps` | finish |
| act | `asks_for_tools` | run_tools |
| act | `leaves_plan_unfinished` | act |
| act | `is_plain_direct_answer` | finish |
| act | always | review |
| run_tools, feedback | always | act |
| review | `retry_allowed` | feedback |
| review | always | finish |
| finish → summarize → end | | |
With the guardrail, plan → screen → (act | finish).

**Why a table and not graph edges written by hand:** the rules are data you can read in one screen, test without a model, and generate the graph from. The engine follows the policy, never the reverse ([[Agent patterns]]).

## Two runners, one behaviour
`tests/agent_runtime/scenarios/` runs whole turns on **LangGraph** and on a **plain in-memory loop** over the same steps and policy, and requires identical answers, events and stored conversations. **Scripted models** (fakes returning prepared outputs) make every route reachable, including rare ones — no real model is ever called in tests ([[Unit tests and test doubles]]).

## Edge cases
- **The client leaves mid-turn:** the turn is cancelled (`turn cancelled after …`); a pending plan stays as it was.
- **Long model calls:** a `: heartbeat` comment every 15 s keeps proxies from closing the stream ([[Server-sent events]]).
- **Too many streams:** above `MAX_CONCURRENT_STREAMS` the API answers 503.
- **Model server down or slow:** `error` with one short sentence; retries only for 5xx/429/connection failures, never for a silent model ([[Retry and backoff]]).

## Check yourself
1. A user sends "shorter" after an answer. Trace the steps.
2. Why generate the graph from `TurnPolicy` instead of drawing it in LangGraph?
3. What does running the scenarios on two runners prove?

## Go further
- [LangGraph concepts](https://langchain-ai.github.io/langgraph/concepts/low_level/) — state, nodes, edges, checkpointers.
