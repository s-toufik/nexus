---
type: concept
domain: AI
level: beginner
tags: [concept, ai, api]
updated: 2026-11-08
---

# OpenAI-compatible API

> The HTTP shape OpenAI's chat API made standard: `POST /v1/chat/completions` with a `model` and a list of `messages`, answered with a completion — or streamed token by token as server-sent events. Most model servers and providers speak it.

## Why it matters
It makes models interchangeable: the same client code talks to a hosted provider or to your local server by changing a base URL and a key. Understanding the request, streaming and tool-call format lets you debug any LLM app.

## How it works
```json
POST /v1/chat/completions
{ "model": "qwen3-8b",
  "messages": [{"role":"system","content":"…"},{"role":"user","content":"Hello"}],
  "stream": true, "temperature": 0.7,
  "tools": [{"type":"function","function":{"name":"…","parameters":{…json schema…}}}] }
```
- `GET /v1/models` lists models.
- **Streaming**: `data: {"choices":[{"delta":{"content":"Hel"}}]}` lines, ending with `data: [DONE]`.
- **Tool calling**: the model answers with `tool_calls` (name + JSON arguments); the client runs the tool and sends the result back as a `tool` message.
- Auth: `Authorization: Bearer <key>`.

## In our projects
- llama-swap exposes it at `http://llm:8080/v1`, and Caddy at `https://<domain>:8090/v1` (signed in, or the `llm-gateway` key) ([[Homelab LLM and agent]]).
- agent-runtime talks to NVIDIA's hosted API or the local `llm` with the same code — only `llmBaseUrl` changes.
- Caddy streams it (`flush_interval -1`).

## Check yourself
1. What changes in a client to move from a hosted provider to `llm`?
2. Walk through one tool call round trip.

## Go further
- [OpenAI API reference: chat](https://platform.openai.com/docs/api-reference/chat).
- [MDN: server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).
