---
type: path
track: AI
time: ~6 h
projects: ["[[Homelab]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Models

> **Goal:** understand what a language model does and costs, talk to one through its API, and run your own.
> **Time:** ~6 h.
> **Before:** [[Path - Networks you can reason about]]. **Then:** [[Path - Agents]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. How does the browser read the agent's answer as it's written?
> [!success]- Answer
> `fetch` + `response.body.getReader()`, splitting the SSE stream into frames on blank lines.

## 1. How a model works · ~1.5 h
**Read:** [[LLM fundamentals]]

**Check:**
1. Why does a long tool result make a model worse at following instructions?
> [!success]- Answer
> Everything shares one context window; a long result pushes the instructions far away and dilutes attention, and may push older content out entirely. Hence trimming results, summarizing history and keeping only recent tool calls.

2. Why does the agent default to temperature 0?
> [!success]- Answer
> Planning, routing and tool calls need repeatable, most-likely outputs; randomness helps creative text, not decisions.

## 2. Talking to a model · ~1.5 h
**Read:** [[OpenAI-compatible API]]

**Do** (from your Mac):
1. `KEY=…` (the `llm-gateway` key); `curl -s https://<HOMELAB_DOMAIN>:8090/v1/models -H "Authorization: Bearer $KEY" | jq '.data[].id'`.
2. `curl -s https://<HOMELAB_DOMAIN>:8090/v1/chat/completions -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' -d '{"model":"qwen3-8b","messages":[{"role":"user","content":"Say hi in 3 words"}]}' | jq '.choices[0].message.content, .usage'` → the answer and its token counts.
3. Same with `"stream": true` and `curl -N` → `data:` chunks, then `data: [DONE]`.

**Check:**
1. What changes in agent-runtime to use NVIDIA's API instead of the homelab model?
> [!success]- Answer
> Only `llmBaseUrl` (→ `LLM_BASE_URL`) and the API key Secret: both speak the same OpenAI-compatible API.

## 3. Running your own · ~2 h
**Read:** [[Running LLMs locally]] · [[llama-swap]] · [[Homelab LLM and agent]] (first section)

**Do:**
1. 👀 `make llm-running` → what's loaded.
2. ✋ `make llm-ask M=qwen3.5-2b Q="Name three planets"` while `make logs R=llm` runs in another terminal → watch llama-swap start the model, then unload it after 5 idle minutes.
3. 👀 Read `llm/llm/config.yml`: the `always-on` and `on-demand` groups, one model's `-hf …:Q4_K_M`.

**Check:**
1. Roughly how much memory do an 8B model's weights take at Q4_K_M, and at Q8_0?
> [!success]- Answer
> About 8 × 4.5 / 8 ≈ 4.5 GB at Q4_K_M, about 8 × 8.5 / 8 ≈ 8.5 GB at Q8_0 — plus the KV cache, which grows with the context size.

2. Why does llm-sd list an on-demand model only during its first `ttl` seconds?
> [!success]- Answer
> A Prometheus scrape counts as activity, which resets llama-swap's idle timer; scraping forever would keep the model loaded forever.

**Milestone:** you can call any model, read its usage, and say what fits in the server's memory.
