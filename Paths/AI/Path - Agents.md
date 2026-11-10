---
type: path
track: AI
time: ~9 h
projects: ["[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Agents

> **Goal:** know how an agent turns a message into an answer — routing, plans, tool use, self-review, budgets — and how ours is built to be reliable.
> **Time:** ~9 h.
> **Before:** [[Path - Models]] · [[Path - Design that lasts]]. **Then:** [[Path - Tools and safety]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. What is a tool call, from the model's side?
> [!success]- Answer
> Instead of text, the model outputs a structured call — a tool name and JSON arguments — for the client to run and feed back as a `tool` message.

## 1. Patterns · ~1.5 h
**Read:** [[Agent patterns]] · source: [Anthropic: building effective agents](https://www.anthropic.com/research/building-effective-agents)

**Check:**
1. Which patterns does our agent combine, and which step is each?
> [!success]- Answer
> Routing (understand), plan-and-execute (plan, act), human approval (`awaiting_approval`), ReAct inside a step (act ⇄ run_tools), reflection (review ⇄ feedback) — all bounded by budgets.

## 2. A turn, step by step · ~2.5 h
**Read:** [[Agent runtime turn]] · [[LangGraph]]

**Do:**
1. 👀 `src/agent_runtime/domain/workflow/turn_policy.py` and `conditions.py` → the table and its conditions (`needs_plan`, `asks_for_tools`, `retry_allowed`…).
2. 👀 `src/agent_runtime/application/step/` → one handler per step; open `act_step.py`.
3. With `request_id` fixed, send three messages with curl as in [[Path - Serving HTTP well]], lesson 2: a question, then "shorter", then "and the other one?". After each, `make logs R=agent-runtime | grep 'turn finished'` → the outcome and steps.

**Check:**
1. Trace "shorter" after an answer through the table.
> [!success]- Answer
> understand (a rework, not a task) → act → (not a plain direct answer) → review → finish → summarize; outcome `answered`.

2. Why is the graph generated from `TurnPolicy` rather than drawn in LangGraph?
> [!success]- Answer
> The rules live in one readable, testable table, independent of LangGraph; the engine follows the policy (and a test checks the generated edges match).

## 3. Plans, approval and budgets · ~2 h
**Read:** [[Agent runtime plans and outcomes]]

**Do** (homelab-ui's Agent page, auto-approve **off**):
1. "Compute the first 20 Fibonacci numbers with Python and save them to journey_fib.csv" → a plan naming `python_executor` and `file_writer` (`awaiting_approval`).
2. "only the even ones" → a revised plan.
3. "yes" → it runs; watch the swarm and status lines; then "read journey_fib.csv back" to check.
4. "Write 25 files, journey_1.txt to journey_25.txt, each containing its number, one file_writer call per file" → "yes" → it stops at the step budget: `budget_exhausted`, resumable. Say "continue" until it finishes. (Clean up later: the files are in the toolbox's working directory.)

**Check:**
1. Why is the pending plan stored apart from the chat history?
> [!success]- Answer
> The history is summarized when it grows; the plan must survive that intact, and be settled only when a run finishes.

## 4. Reading the decisions · ~1 h
**Read:** [[Agent runtime decisions]] · [[Agent runtime layers]] (again — it reads differently now)

**Check:**
1. Pick one decision you'd make differently. Write it as a decision entry (context, decision, why, alternatives) in a [[Log]] note.
> [!success]- Guidance
> A good answer names a real cost of the current choice (e.g. an extra round trip for plans) and a condition under which the alternative wins.

## 5. The code under test · ~2 h
**Do:**
1. In agent-runtime: `uv run pytest tests/agent_runtime/scenarios -q`.
2. 👀 Find the scenario that reaches `ran_out_of_steps`; read its scripted model.

**Milestone:** you can explain any of the agent's replies from its route through `TurnPolicy`.
