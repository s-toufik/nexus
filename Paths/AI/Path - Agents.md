---
type: path
track: AI
time: ~10 h
projects: ["[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Agents

> **Goal:** know how an agent turns a message into an answer — routing, plans, tool use, self-review, budgets — and how ours is built to be reliable.
> **Time:** ~10 h.
> **Before:** [[Path - Models]] · [[Path - Design that lasts]]. **Then:** [[Path - Tools and safety]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Agent patterns combined | understand (routing), plan + approval, act ⇄ run_tools (ReAct), review ⇄ feedback (reflection) |
| Control flow as data | `TurnPolicy` + `conditions.py` |
| A graph engine with checkpoints | LangGraph, generated from `TurnPolicy`; MongoDB checkpointer |
| Budgets | `max_iterations`, `max_reflection_retries` |
| Pending state that survives | the plan stored apart from the history; paused plans keep their last 20 tool calls |
| Outcomes as an API contract | `answered`, `awaiting_approval`, `clarification`, `best_effort`, `budget_exhausted`, `refused` |

## Warm-up (optional)
1. What is a tool call, from the model's side?
> [!success]- Answer
> Instead of text, the model outputs a tool name and JSON arguments, for the client to run and feed back as a `tool` message.

## 1. Patterns · ~1.5 h

### Learn
**Definitions**
- **ReAct** — think, act (call a tool), observe, repeat ([[Agent patterns]]).
- **Plan-and-execute** — write a plan first, then run its steps.
- **Reflection** — the model reviews its answer and rewrites it.
- **Routing** — classify the request first, then take a path.
- **Human-in-the-loop** — a person approves before side effects.

**How it works** — production agents combine patterns and bound them with budgets; the design question is *which control decisions the model makes and which the code makes*. In ours, the code decides the route (from the model's structured outputs); the model decides content.

**Example from our projects**
| Pattern | Our step |
|---|---|
| Routing | `understand` → plan / clarify / act |
| Plan-and-execute | `plan` → `act` per step |
| Human approval | `awaiting_approval` until "yes" (or `auto_approve`) |
| ReAct | `act` ⇄ `run_tools` |
| Reflection | `review` ⇄ `feedback`, at most `max_reflection_retries` |

**Common mistake** — one free ReAct loop for everything: it wanders, can't be bounded or audited, and acts without approval.

### Check
1. Why is plan-and-execute safer than a free ReAct loop?
> [!success]- Answer
> Intent is visible and approvable before anything runs; the guardrail can screen it; the plan bounds what the agent will do.

## 2. A turn, step by step · ~3 h

### Learn
**Definitions**
- **Turn** — one message and its work; **step** — one stage of it; **transition** — (source, target, condition) ([[Agent runtime turn]]).
- **Condition** — a pure function of the `Turn`.
- **Checkpointer** — saves the graph state after each step, keyed by conversation ([[LangGraph]]).

**How it works**
After each step, `TurnPolicy.next` returns the target of the **first** transition whose source is that step and whose condition holds; LangGraph's edges are generated from the same table; each node emits an event the SSE presenter streams.

**Example from our projects** — the method that routes everything (`domain/workflow/turn_policy.py`):
```python
def next(self, done: Step, turn: Turn) -> Step:
    for transition in self.TRANSITIONS:
        if transition.source is done and transition.when(turn):
            return transition.target
    raise ValueError(f"No transition leaves the step '{done}'")
```
and the conditions `act` is tested against, in order:
```python
Transition(Step.ACT, Step.PLAN, asks_for_plan_without_one),
Transition(Step.ACT, Step.FINISH, ran_out_of_steps),
Transition(Step.ACT, Step.RUN_TOOLS, asks_for_tools),
Transition(Step.ACT, Step.ACT, leaves_plan_unfinished),
Transition(Step.ACT, Step.FINISH, is_plain_direct_answer),
Transition(Step.ACT, Step.REVIEW),
```
1. Asked for tools but no plan exists → go plan first.
2. Budget used up → finish (before calling more tools).
3. Tool calls → run them.
4. An approved plan step still open → act again ("now do step N").
5. A plain direct answer → finish without review.
6. Otherwise → review.

**Common mistake** — moving a row: `ran_out_of_steps` below `asks_for_tools` would let a turn with no budget keep calling tools.

### Do
1. 👀 `turn_policy.py`, `conditions.py`, `application/step/act_step.py`.
2. Same `request_id`, three messages with curl (as in [[Path - Serving HTTP well]], lesson 2): a question, "shorter", "and the other one?". After each, `make logs R=agent-runtime | grep 'turn finished'`.

### Check
1. Trace "shorter" after an answer.
> [!success]- Answer
> understand (rework) → act → not a plain direct answer → review → finish → summarize; `answered`.

2. Why generate the graph from `TurnPolicy`?
> [!success]- Answer
> One readable, testable table of rules, independent of LangGraph; a test checks the generated edges match.

## 3. Plans, approval and budgets · ~2.5 h

### Learn
**Definitions**
- **Pending plan** — waiting for "yes", or paused at the budget ([[Agent runtime plans and outcomes]]).
- **Resumable** — `metadata.resumable: "true"`: "continue" picks up where it stopped.
- **Step done** — only when its tool succeeds; a reply that only describes a step sends the agent back to run it.

**How it works**
| You send | The pending plan |
|---|---|
| "yes", "continue" | runs / resumes without redoing finished calls |
| a change | rewritten (only remaining steps if paused) |
| something unclear | stays pending; the agent asks |
| "Drop plan" / anything else | dropped |
The plan is stored apart from the chat history, so summarizing never loses it; an interrupted run leaves it as before.

**Example from our projects** — journeys from agent-runtime's README:
| You send | Route | Reply |
|---|---|---|
| "How many users signed up today?" | understand → plan → finish | `awaiting_approval` |
| "only count verified users" | understand → plan → finish | revised plan |
| "yes" | understand → act → run_tools → act → review → finish | `answered` |
| a loop longer than the budget | … → finish | `budget_exhausted`, resumable |

**Common mistake** — keeping the whole tool history of a long paused plan in context: only the last 20 calls and a count are kept.

### Do (Agent page, auto-approve off)
1. "Compute the first 20 Fibonacci numbers with Python and save them to journey_fib.csv" → a plan.
2. "only the even ones" → revised. "yes" → runs. "read journey_fib.csv back".
3. "Write 25 files, journey_1.txt to journey_25.txt, each containing its number, one file_writer call per file" → "yes" → `budget_exhausted`; "continue" until done.

### Check
1. Why is the plan stored apart from the history?
> [!success]- Answer
> The history gets summarized; the plan must survive intact and be settled only when a run ends.

## 4. Reading the decisions · ~1 h

### Learn
A decision record — context, decision, why, alternatives, consequences — is how a team keeps its reasons ([[Agent runtime decisions]]).

### Do
Pick one decision you'd make differently; write it as an entry in a [[Log]] note.
> [!success]- Guidance
> A good answer names a real cost of the current choice (e.g. an extra round trip for plans) and when the alternative wins.

## 5. The code under test · ~2 h

### Learn
Scripted models make every route reachable on demand; the same scenarios run on LangGraph and a plain loop ([[Unit tests and test doubles]]).

### Do
`uv run pytest tests/agent_runtime/scenarios -q`; find the scenario reaching `ran_out_of_steps` and read its scripted model.

**Milestone:** you can explain any of the agent's replies from its route through `TurnPolicy`, and change a route safely.
