---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, agents]
updated: 2026-11-08
---

# Agent patterns

> Recurring designs for LLM agents: **ReAct** (think, call a tool, observe, repeat), **plan-and-execute** (write a plan, then run its steps), **reflection** (review your answer, rewrite), **routing** (classify the request first, then take a path), and **human-in-the-loop** approval.

## How they compare
| Pattern | Strength | Risk |
|---|---|---|
| ReAct loop | Simple, flexible | Wanders, hard to bound or audit |
| Plan-and-execute | Visible intent, approvable, auditable | Rigid if the plan is wrong → allow revision |
| Reflection / review | Catches incomplete answers | Costs calls; needs a retry cap |
| Routing | Cheap paths for easy questions | Misroutes need a way back |
| Human approval | Safety for side effects | Latency, user effort → `auto_approve` for trusted use |
Production agents combine them, with **budgets** (max steps, max rewrites) and explicit **state** (what's pending).

## In our projects
agent-runtime combines all five: understand (routing) → plan → user approval → act ⇄ run_tools (ReAct within a step) → review ⇄ feedback (reflection), bounded by `max_iterations` and `max_reflection_retries`, with resumable paused plans ([[Agent runtime turn]], [[Agent runtime plans and outcomes]]).

## Check yourself
1. Why does plan-and-execute make an agent safer than a free ReAct loop?
> [!success]- Answer
> The intent is written down before anything runs: you (and the screen step) can read the steps, refuse a bad one, and audit what happened against what was planned. A free ReAct loop decides each action on the fly, so a misstep or an injected instruction acts before anyone sees it.
2. What stops reflection from looping forever?
> [!success]- Answer
> A retry cap: agent-runtime's `max_reflection_retries` bounds how many times review can send the work back, and `max_iterations` bounds the whole turn. When the cap is reached, the turn ends with the best answer it has.

## Go further
- [Anthropic: building effective agents](https://www.anthropic.com/research/building-effective-agents).
- [ReAct (Yao et al.)](https://arxiv.org/abs/2210.03629), [Reflexion](https://arxiv.org/abs/2303.11366).
