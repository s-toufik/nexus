---
type: architecture
project: "[[Agent runtime]]"
order: 3
tags: [agent-runtime, architecture, ai]
updated: 2026-11-08
---

# Agent runtime plans and outcomes

> Anything that needs tools becomes a **plan** you approve first. A plan runs one step at a time; a step is done only when its tool succeeds; the run is capped by a step budget, and a plan stopped by it is **paused**, resumable with "continue". Every reply ends with an **outcome** that tells the client what kind of answer it is.

Previous: [[Agent runtime turn]] · Next: [[Agent runtime evaluation]]

## Why plans
An agent that calls tools on its own can do damage on a misunderstanding or a prompt injection. A plan makes intent visible *before* action — the human approves (or `auto_approve: true` for trusted use). It's the agent version of `make diff` before `make apply`.

## The plan's life
| You send | The pending plan |
|---|---|
| "yes", "go on", "continue" | Runs; a paused plan resumes where it stopped, without redoing finished tool calls |
| A change ("only last month") | Rewritten (only the steps left, if paused), then handled like a new plan |
| Something unclear | Stays pending; the agent asks |
| "Drop plan" | Dropped |
| Anything else | Dropped; the message is handled on its own |

| The run | The plan |
|---|---|
| Finishes the work | Done |
| Hits the step limit (`max_iterations`) | Paused again — even if every step ran but the work (a loop) isn't finished |
| Is interrupted (page closed, model down, restart) | Stays as before the run; "continue" may redo what ran |

A paused plan keeps its **last 20 tool calls** and a count of earlier ones, so resuming a long loop never overflows the model's context. The plan is stored *apart from* the chat history, so summarizing the history never loses it.

## Outcomes
| `outcome` | Means | The client |
|---|---|---|
| `answered` | Normal answer, reviewed or not needing review | show it |
| `awaiting_approval` | The reply is a plan | offer yes / Drop plan / edit |
| `clarification` | A question back | let the user answer |
| `best_effort` | No answer passed review, or no plan could be written | show, suggest rephrasing |
| `budget_exhausted` | Steps used up; `resumable: "true"` if a plan is paused | offer "continue" |
| `refused` | Guardrail blocked the plan: `[SCREEN]: <reason>` | show the reason |
Clients must ignore unknown events and fields, and treat an unknown outcome like `answered` — that's how the API evolves without breaking homelab-ui.

## Typical journeys
| You send | Route | Reply |
|---|---|---|
| "What can you do?" | understand → act → finish | `answered` |
| "How many users signed up today?" | understand → plan → finish | `awaiting_approval` |
| "yes" | understand → act → run_tools → act → review → finish | `answered` from tool results |
| A task with `auto_approve: true` | understand → plan → act → run_tools → act → review → finish | `answered` in one go |
| A loop longer than the budget | … → finish | `budget_exhausted`, resumable |
| An answer the review rejects | … act → review → feedback → act → review → finish | `answered`, or `best_effort` |

## Check yourself
1. Why is a plan stored apart from the chat history?
> [!success]- Answer
> Summarizing compacts the history when it passes half the context; a plan inside it could be shortened or lost. Stored apart, the plan with its steps and last 20 tool calls survives any summary, and resuming always has it whole.
2. What happens to a plan when the browser is closed mid-run, and why might "continue" repeat a tool call?
> [!success]- Answer
> The turn is interrupted, so the plan stays as it was before the run. The tool calls made during that run weren't recorded against it, so "continue" starts from the same point and may call them again.
3. Why should a client treat an unknown `outcome` like `answered`?
> [!success]- Answer
> So the API can grow without breaking clients: a new outcome added later must not make an old homelab-ui fail. Showing the reply as a normal answer is the safe default.

## Go further
- [Plan-and-execute agents](https://blog.langchain.com/planning-agents/) (LangChain blog).
- [Reflexion: language agents with verbal reinforcement learning](https://arxiv.org/abs/2303.11366) — the idea behind review/feedback.
