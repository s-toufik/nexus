---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-12
---

# Homelab UI page - Agent

> **Route** `/agent` · **for** everyone · **talks to** agent-runtime (`/api/agent/v1/stream`, `/v1/models`) · **code** `src/app/features/agent/`
> Talk to the homelab's agent: it answers, or proposes a plan that uses tools, runs it when you say yes, and streams its words as it writes them.

![[Homelab UI - Agent answer.webp]]

## An answer
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Your message | What you sent. |
| 2 | Answer | Streamed token by token over [[Server-sent events]]; while it works, a small swarm of dots moves next to the step it's on (calm while thinking, faster on a tool, red on an error). |
| 3 | Details toggle and usage | `(5s · ↑ 15.5k · ↓ 155 tokens)`: time, input tokens, output tokens. The arrow opens the details. |
| 4 | Details | Everything the agent reported about this answer. |
| 5 | Outcome | `answered`, `awaiting_approval`, `clarification`, `best_effort`, `budget_exhausted`, `refused` ([[Agent runtime plans and outcomes]]). |
| 6 | Iteration · Max iteration | Steps used (1) out of the budget (20) ([[Agent runtime turn]]). |
| 7 | Composer | Enter sends, Shift+Enter adds a line. |
| 8 | Send | Turns into a red **stop** while the agent works. |
| 9 | Settings | Model, auto-approve, conversation (below). |
| 10 | Menu | Every page. |

![[Homelab UI - Agent plan.webp]]

## A plan
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Plan | The agent wants to use tools, so it asks first. Nothing has run yet (outcome `awaiting_approval`). |
| 2 | Step | One step per tool call, naming the tool (`python_executor`). |
| 3 | Expected result | The agent's **guess** of the outcome — here it already "knows" 1048576 before running anything. A plan's expected result isn't a result. |
| 4 | Your choice | **yes** runs it, **Drop plan** cancels, anything else is a change request and comes back as a new plan. |
| 5 | Usage | The plan's own cost: 16.2 k tokens in. |

![[Homelab UI - Agent settings.webp]]

## Settings
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Model | The model for this conversation; the list comes from the agent (`/v1/models`). Remembered on this device. |
| 2 | Auto-approve plans | Run plans without asking. Off by default — keep it off until you trust the task. |
| 3 | Conversation id | The `request_id` every message carries; the same id continues the same conversation. |
| 4 | Copy | Copy it, to continue on another device (paste it there). |
| 5 | Start a new conversation | A new id, an empty history. |
| 6 | Close | Close the panel. |

When the server pins steps to models, a *Fixed by the server* list appears below; today none are pinned (`pinned_steps: {}`), so the model you pick does every step.

## Use it to
- Ask about the homelab and let it look: *"Which pods restarted today?"*, *"How full is the disk?"* — it has the Grafana, PostgreSQL and MongoDB tools.
- Delegate a small task with files or Python, and approve the plan.

## How it works
Each message is `POST /api/agent/v1/stream` with `{message, model_name, request_id, auto_approve}`; the reply is a stream of `status`, `token`, `final` and `complete` events ([[Homelab UI state and streaming]], [[Agent runtime]]).

## What the real homelab showed (2026-11-11)
- **A new browser gets a broken agent.** The page picks the first model of the list, `qwen3.5-0.8b`, a *local* model. But agent-runtime sends every model call to `llmBaseUrl` = NVIDIA's hosted API (homelab-infra `environments/default.yaml`), which doesn't know that name: every message fails with *The model server rejected the request (404 page not found)*. NVIDIA's models work. *Fixed in the code: each model names its provider in `operation/llm.yml`; local models go to llama-swap (`HOMELAB_LLM_BASE_URL`), NVIDIA's to NVIDIA, each with its own client and circuit breaker.*
- **The answer is fluent and wrong.** Asked *what is a KV cache?*, the model described a web-style key-value cache that "sits between the application and the backend" (and it gave the same answer when asked again). In LLMs, the KV cache keeps each token's attention keys and values so the next token doesn't recompute them ([[LLM fundamentals]]). The review step accepted it. Lesson: be specific (*"in a transformer"*), and check the source of facts.
- **15.5 k input tokens for a one-line question:** the system prompts, the tool catalogue and the history ride along with every call ([[Homelab UI page - Tools]]). *Fixed in the code: one line per tool in the prompt, full definitions only for the plan's tools; about 2.5k tokens for a direct answer.*

## Try it
1. 👀 Ask *"What is a KV cache in a transformer?"* → compare with the answer above.
2. 👀 Ask *"Compute 2 to the power of 20 with Python"* → a plan → reply **yes** → the result, outcome `answered`, tools `python_executor`.

> [!question]- Check: you reply "use numpy" to a plan. What happens?
> Not yes or Drop plan, so it's a change request: the agent writes a new plan with your change and waits again.

Back to [[Homelab UI pages]].
