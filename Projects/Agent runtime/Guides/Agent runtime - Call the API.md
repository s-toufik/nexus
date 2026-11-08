---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-08
---

# Agent runtime - Call the API

> List the models, send a message, and read the streamed reply and its outcome — what a client like homelab-ui does.

**Where:** from any machine that reaches the agent (tailnet: `http://<HOMELAB_DOMAIN>:8000`) · **All guides:** [[Agent runtime guides]]

## List the models

`GET /v1/models` returns the models a request may name, and the steps that always use one model whatever the request asks:

```json
{
  "models": [{ "name": "qwen3-8b", "context_tokens": 16384, "max_output_tokens": 4096, "thinking": false }],
  "pinned_steps": { "act": "<llm_model>", "understand": "<llm_model>" }
}
```

Build your model picker from `models`. When `pinned_steps` covers every step, the choice has no effect.

## Send a message

```bash
curl -N http://<host>:<port>/v1/stream \
  -H 'Content-Type: application/json' \
  -d '{"message": "how many users signed up today?", "model_name": "qwen3-8b", "request_id": "my-conversation"}'
```

| Field | Meaning |
|---|---|
| `message` | What you say (non-empty) |
| `model_name` | One of the models from `GET /v1/models` |
| `request_id` | The conversation id: the same value for every message of one conversation; a new value starts an empty one |
| `auto_approve` | Optional, default `false`. `true` runs a plan as soon as it is written instead of waiting for your "yes" |

## Read the reply

The reply is a server-sent event stream: each frame is `event: <type>` + `data: <json>`.

| Event | What to do with it |
|---|---|
| `status` | Progress ("Comprehending the request", "Formulating a plan", "Running file_reader"…): show it as an indicator |
| `token` | A piece of the answer as it is written (only for answers that need no review, with `AGENT_ANSWER_DELIVERY=stream`): append the pieces |
| `final` | The complete answer: show it, replacing any `token` pieces |
| `error` | The request failed. An expected failure is one short sentence: the model server is down or too slow, it rejected the request (wrong address or key), or the model is unknown. Anything else comes with its full trace |
| `complete` | Always last |

During a long model call, the stream sends a `: heartbeat` comment every 15 seconds so proxies keep it open; SSE clients ignore it.

`final.metadata` describes the answer:

| Field | Meaning |
|---|---|
| `outcome` | What kind of reply it is (below) |
| `iteration`, `max_iteration` | Steps used, and the step budget |
| `model` | The model that answered |
| `elapsed_time`, `input_tokens`, `output_tokens` | When known |
| `tools` | The tools used, comma-separated |
| `resumable` | `"true"` when a plan was paused at the step limit and "continue" resumes it |

| `outcome` | What it means | What you can do |
|---|---|---|
| `answered` | A normal answer: it passed the agent's own review, or needed none | Read it |
| `awaiting_approval` | The reply is a plan that needs tools | Reply **yes** to run it, **Drop plan** to cancel it, or say what to change |
| `clarification` | The reply is a question: the request was too vague | Answer the question |
| `best_effort` | No answer the agent was satisfied with: the review rejected every rewrite, no answer was produced, or no plan could be written | Check the answer, or rephrase |
| `budget_exhausted` | The agent used all its steps (`max_iterations`). For a plan, the reply shows which steps ran, and the plan is paused, even when every step ran but its work (a loop, say) was not finished | Say **continue** to resume it, narrow it, or drop it |
| `refused` | The guardrail blocked the plan before anything ran: `[SCREEN]: <reason>` | Change the request |

New events, fields and outcomes may be added: ignore the ones you don't know, and treat an unknown `outcome` like `answered`. Why a message gets a given outcome: see [[Agent runtime plans and outcomes]].

## Why it works
- [[Agent runtime plans and outcomes]] — why a message gets an outcome.
- [[Server-sent events]] · [[Homelab UI state and streaming]]
