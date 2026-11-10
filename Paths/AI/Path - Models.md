---
type: path
track: AI
time: ~7 h
projects: ["[[Homelab]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Models

> **Goal:** understand what a language model does and costs, talk to one through its API, and run your own on the homelab.
> **Time:** ~7 h.
> **Before:** [[Path - Networks you can reason about]]. **Then:** [[Path - Agents]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Tokens and context windows | agent-runtime's `max_context_tokens`, summarize at half the context, last 20 tool calls |
| Sampling | `temperature: 0.0` by default; llama.cpp `--temp 0.7 --top-p 0.8 --top-k 20` for local models |
| One API, many providers | agent-runtime's `LLM_BASE_URL`: NVIDIA's API or the homelab `llm` |
| Quantization and memory | GGUF `Q8_0`, `Q4_K_M` in `llm/llm/config.yml`; 26 GiB limit |
| Load on demand | llama-swap groups `always-on` and `on-demand`, `ttl: 300` |

## Warm-up (optional)
1. How does the browser read the agent's answer as it's written?
> [!success]- Answer
> `fetch` + `response.body.getReader()`, splitting the SSE stream into frames on blank lines.

## 1. How a model works · ~2 h

### Learn
**Definitions**
- **Token** — a piece of text (≈ ¾ of an English word) the model reads and writes one at a time ([[LLM fundamentals]]).
- **Context window** — the most tokens the model considers at once: system prompt + history + tool results + the answer.
- **Parameters** — the model's learned weights; 8B = 8 billion.
- **Sampling** — choosing each next token: `temperature` (randomness), `top_p`, `top_k`.
- **Hallucination** — fluent, confident, wrong.
- **Reasoning / thinking** — hidden tokens spent thinking first (`reasoning_effort`).

**How it works**
The model predicts a probability for every possible next token from the context, samples one, appends it, repeats. Everything it "knows" about this conversation is in the context; everything else is in its weights, frozen at training.

**Example from our projects** — a model entry in agent-runtime's `operation/llm.yml` uses these parameters (defaults from the README):
| Parameter | Default | Means |
|---|---|---|
| `temperature` | 0.0 | always the most likely token: repeatable decisions |
| `max_output_tokens` | 8000 | longest reply |
| `max_context_tokens` | 8000 | the window the agent budgets for |
| `max_iterations` | 10 | steps per message |
| `max_reflection_retries` | 2 | rewrites after a rejected review |
| `reasoning_effort` | null | no thinking; `low/medium/high` to think first |

**Common mistake** — stuffing whole tool results into the context: instructions get diluted and old content falls out. Hence summaries and trimmed tool calls.

### Check
1. Why does a long tool result make a model worse at following instructions?
> [!success]- Answer
> Everything shares one window; a long result pushes instructions far away and dilutes attention, or pushes older content out.

2. Why temperature 0 for an agent's planner?
> [!success]- Answer
> Plans, routing and tool calls need repeatable, most-likely outputs; randomness helps creative text, not decisions.

## 2. Talking to a model · ~2 h

### Learn
**Definitions**
- **Chat completion** — `POST /v1/chat/completions` with a `model` and `messages` (`system`, `user`, `assistant`, `tool`) ([[OpenAI-compatible API]]).
- **Usage** — `prompt_tokens`, `completion_tokens` in the response.
- **Streaming** — `"stream": true`: `data: {…delta…}` lines, then `data: [DONE]`.
- **Tool calling** — the model answers with `tool_calls` (name + JSON arguments) instead of text.

**Example from our projects** — the request the homelab LLM accepts (any OpenAI client works the same):
```bash
curl -s https://<HOMELAB_DOMAIN>:8090/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"model": "qwen3-8b", "messages": [{"role": "user", "content": "Say hi in 3 words"}]}'
```
```json
{"choices": [{"message": {"role": "assistant", "content": "Hello there, friend!"}}],
 "usage": {"prompt_tokens": 14, "completion_tokens": 6, "total_tokens": 20}}
```
(Shape of the answer; your text and counts will differ.)

**Common mistake** — hard-coding one provider's SDK: agent-runtime switches between NVIDIA's API and the local model by changing only `LLM_BASE_URL` and the key.

### Do
1. `KEY=` the `llm-gateway` key ([[Homelab - Manage secrets#Read one]]); `curl -s https://<HOMELAB_DOMAIN>:8090/v1/models -H "Authorization: Bearer $KEY" | jq '.data[].id'`.
2. The chat completion above → `.choices[0].message.content` and `.usage`.
3. Again with `"stream": true` and `curl -N` → `data:` chunks then `[DONE]`.

### Check
1. What changes in agent-runtime to use NVIDIA's API instead of the homelab model?
> [!success]- Answer
> Only `llmBaseUrl` (→ `LLM_BASE_URL`) and the API key Secret.

## 3. Running your own · ~3 h

### Learn
**Definitions**
- **llama.cpp / llama-server** — an inference engine and its HTTP server ([[Running LLMs locally]]).
- **GGUF** — llama.cpp's model file format; **quantization** — fewer bits per weight (`Q8_0` ≈ 8.5, `Q4_K_M` ≈ 4.5).
- **KV cache** — the stored keys/values of past tokens; grows with context size.
- **llama-swap** — starts the right llama-server per request's `model`, stops idle ones after `ttl` ([[llama-swap]]).

**How it works**
Memory ≈ parameters × bits / 8 + KV cache. Our 32 GB server keeps one 8B model always loaded and one on-demand model at a time.

**Example from our projects** — `llm/llm/config.yml` (excerpt, simplified: the real file also lists `aliases`, `exclusive`, the on-demand members, and shares `ttl` through a YAML anchor `&ondemand_ttl`):
```yaml
macros:
  common: >
    --host 127.0.0.1 --port ${PORT}
    --jinja --chat-template-kwargs '{"enable_thinking":false}'
    --temp 0.7 --top-p 0.8 --top-k 20 --metrics
models:
  qwen3.5-2b:
    cmd: |
      /app/llama-server ${common}
      -hf unsloth/Qwen3.5-2B-GGUF:Q8_0
      --ctx-size 32768
      --parallel 1
      --threads 12
    ttl: 300
groups:
  always-on:
    swap: false
    persistent: true
    members: [qwen3-8b]
  on-demand:
    swap: true
    persistent: false
```
1. `-hf repo:quant` — download that GGUF from Hugging Face on first use.
2. `--ctx-size 32768` — the window; the KV cache is sized for it.
3. `--threads 12` — CPU threads (the server has 16).
4. `ttl: 300` — unload after 5 idle minutes; `swap: true` — one on-demand model at a time.
5. `--metrics` — Prometheus metrics per model (scraped through llm-sd).

**Common mistake** — scraping an on-demand model forever: each scrape resets its idle timer and it never unloads. llm-sd lists it only during its first `ttl`.

### Do
1. 👀 `make llm-running`.
2. ✋ `make llm-ask M=qwen3.5-2b Q="Name three planets"` while `make logs R=llm` runs → it loads, answers, unloads after 5 minutes.

### Check
1. Roughly how much memory do an 8B model's weights take at Q4_K_M? At Q8_0?
> [!success]- Answer
> ≈ 8 × 4.5 / 8 ≈ 4.5 GB; ≈ 8 × 8.5 / 8 ≈ 8.5 GB — plus the KV cache.

**Milestone:** you can call any model, read its usage, and say what fits in the server's memory. Deep dive: [[Homelab LLM and agent]].
