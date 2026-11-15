---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-15
---

# Agent runtime - Call the API

> List the models, send a message, and read the streamed reply and its outcome — what a client like homelab-ui does. Other agents use A2A instead.

**Where:** from any machine that reaches the agent (tailnet: `http://<HOMELAB_DOMAIN>:8000`, the supervisor; signed in: `https://<HOMELAB_DOMAIN>/api/agents/<name>` for any agent) · **All guides:** [[Agent runtime guides]]

## From Postman
Every call below is ready in the Postman hub, `~/SandBox/postman_hub` (collection *Agents*: Discovery, Chat, A2A, Health): import the four files of its `import/` folder (Collection v2.1 and Environment JSON; Postman's importer doesn't read the YAML of `postman/`). Each URL is `{{source}}{{agent_url}}/…`: pick the environment (Local; Homelab, the supervisor on `:8000`; Homelab gateway, every agent's `/v1` API with your sign-in cookie), then the agent in the collection variable `agent`. The A2A requests save `task_id` and `context_id`, so GetTask and CancelTask follow a SendMessage without copying ids.

## List the agents

`GET /v1/agents` returns this agent and the agents it can call (the supervisor knows them all), with their descriptions and skills:

```json
{ "agents": [{ "name": "supervisor", "description": "…", "skills": [] },
             { "name": "chat", "description": "…", "skills": [{ "id": "answer", "name": "Answer and explain", "description": "…", "tags": [], "examples": [] }] }] }
```

Each agent answers on its own `/v1/api2a` and `/v1/models`; pick one to talk to it directly ([[Agent runtime agents]]).

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
curl -N http://<host>:<port>/v1/api2a \
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

## Talk to it as an A2A agent

1. Read the agent card: what it does and where to call it.
   ```bash
   curl http://<host>:<port>/.well-known/agent-card.json
   ```
   It gives `supportedInterfaces[0].url` (`…/a2a`, binding `JSONRPC`, version `1.0`) and one skill.
2. Send a message; the reply is a task.
   ```bash
   curl http://<host>:<port>/a2a \
     -H 'Content-Type: application/json' -H 'A2A-Version: 1.0' \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "SendMessage", "params": {"message": {
           "messageId": "m1", "role": "ROLE_USER", "parts": [{"text": "how many users signed up today?"}]}}}'
   ```
   It gives `result.task` with `id`, `contextId` and `status.state`.
3. If the state is `TASK_STATE_INPUT_REQUIRED` (a plan, a question, a paused plan), read `status.message` and reply in the same task.
   ```bash
   curl http://<host>:<port>/a2a \
     -H 'Content-Type: application/json' -H 'A2A-Version: 1.0' \
     -d '{"jsonrpc": "2.0", "id": 2, "method": "SendMessage", "params": {"message": {
           "messageId": "m2", "role": "ROLE_USER", "taskId": "<task id>", "parts": [{"text": "yes"}]}}}'
   ```
   It gives the same task, `TASK_STATE_COMPLETED`, with the answer in `artifacts[0].parts[0].text`.
4. To follow the work live, call `SendStreamingMessage` instead, with `curl -N`.
   It gives server-sent events: the task, a `statusUpdate` per step, the `answer` `artifactUpdate`, the last `statusUpdate`.
5. To continue the conversation later, send a new message with the task's `contextId` (no `taskId`).
   It gives a new task in the same conversation.

| Task state | The agent's `outcome` |
|---|---|
| `TASK_STATE_COMPLETED` | `answered`, `best_effort`, `budget_exhausted` without a paused plan |
| `TASK_STATE_INPUT_REQUIRED` | `awaiting_approval`, `clarification`, `budget_exhausted` with a paused plan |
| `TASK_STATE_REJECTED` | `refused` |
| `TASK_STATE_FAILED` | an `error` |
| `TASK_STATE_CANCELED` | `CancelTask` |

- The card offers the agent's own options as an extension, `https://github.com/s-toufik/agent-runtime/a2a/turn-options/v1` (not required): its `params` give the `models` and the `defaultModel`.
- `message.metadata["<extension uri>/model"]` picks the model (else the first listed; an agent with its own `model` always uses it); `message.metadata["<extension uri>/autoApprove"]: true` runs plans without waiting. Only these keys are read: the short `model` and `autoApprove` of 1.x are gone.
- `GetTask`, `CancelTask`, `ListTasks` and `SubscribeToTask` work on the tasks of the last week (`A2A_TASK_TTL`), kept in a database across restarts; an older one answers `-32001`; `configuration.returnImmediately: true` answers at once with the task to follow.
- Closing a stream doesn't stop the task; `CancelTask` does.
- Send `A2A-Version: 1.0`: without it the call is read as A2A 0.3.
- Not supported: push notifications. Only text parts are read: a message without text is `TASK_STATE_REJECTED`.

## Try A2A from Postman

1. In Postman, click **Import** and paste `http://<host>:<port>/docs/openapi.json` (needs `WEB_DOCS=true`).
   It gives a collection with `GET /.well-known/agent-card.json`, `POST /a2a` and the other routes.
2. Send `GET /.well-known/agent-card.json`.
   It gives the card; `capabilities.extensions` lists the models (`params.models`) and the default.
3. In `POST /a2a`, add the header `A2A-Version: 1.0`.
   It gives A2A 1.0; without it the call is read as 0.3 and `SendMessage` answers `-32009` (version not supported).
4. Put a raw JSON body with `"method": "SendMessage"` and the message, as in the curl above.
   It gives the task; change `method` and `params` for `GetTask`, `ListTasks`, `CancelTask` and the others.

## Why it works
- [[Agent runtime plans and outcomes]] — why a message gets an outcome.
- [[Server-sent events]] · [[Homelab UI state and streaming]] · [[Agent2Agent protocol]]
