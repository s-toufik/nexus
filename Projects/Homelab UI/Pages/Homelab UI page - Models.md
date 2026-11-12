---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-12
---

# Homelab UI page - Models

> **Route** `/models` · **for** everyone (unloading: admins) · **reads** llama-swap through `/api/llm/…` · **code** `src/app/features/llm/`
> The local models: which are in memory, load or unload one, try a prompt, read the model server's logs.

![[Homelab UI - Models.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Summary | Models configured in llama-swap (8) and how many are in memory now (1). |
| 2 | ready | A loaded model: its weights are in RAM and it answers at once. |
| 3 | not loaded + Load | Configured but not in memory. **Load** sends it a one-token prompt (`hi`, `max_tokens: 1`): llama-swap starts it on demand, which takes seconds to a minute. |
| 4 | Unload | Stops that model and frees its memory (admins). |
| 5 | Unload all | Frees every model (admins). |
| 6 | Try a model | A prompt box straight to llama-swap's `/v1/chat/completions` — no agent, no tools, no plan. Answers with tokens and time. |
| 7 | Logs | llama-swap's own log: which model it starts, health checks, errors. |
| 8 | Follow / Reload | Stream the log live, or read it once. |

## Use it to
- See why memory is high: a 14 B model takes several GiB ([[LLM fundamentals]] — weights × bytes per weight + KV cache).
- Free memory before something heavy: Unload all.
- Test a model alone, to tell a model problem from an agent problem.

## How it works
[[llama-swap]] is a proxy in front of llama.cpp servers: a request names a model, llama-swap starts that model's server if needed (stopping another if they don't fit), then forwards the request ([[Homelab LLM and agent]]). Caddy allows only a few paths on `/api/llm/` (`/v1/models`, `/v1/chat/completions`, `/running`, `/logs…`, `/api/models/unload…`) and requires `role:admin` for the unload paths.

## What the real homelab showed (2026-11-11)
- `qwen3-8b` loaded; the control center's Busiest containers shows the `llm` container at ~5.5 GiB — that's the model in memory.
- The logs say `GPU monitoring not available` — the server runs models on CPU only, which is why answers take seconds per sentence.
- **The agent can't use these models today.** Its model list includes them, but its `llmBaseUrl` (homelab-infra `environments/default.yaml`) points to NVIDIA's hosted API, which answers `404 page not found` for a local name. This page talks to llama-swap directly, so *Try a model* works. See [[Homelab UI page - Agent]]. *Fixed in the code: agent-runtime now has two providers, the homelab's (`HOMELAB_LLM_BASE_URL`, llama-swap) and NVIDIA's, and calls each model on its own.*

## Try it
1. 👀 Pick `qwen3-1.7b` in *Try a model*, ask `What is 17 × 23?` → it loads (watch the Logs), answers, and the list shows it *ready*.
2. 👀 Ask the same to `qwen3-8b` → compare time and correctness.
3. ✋ Unload `qwen3-1.7b` (admin) → back to *not loaded*.

> [!question]- Check: why is the first answer of a model much slower than the second?
> The first request makes llama-swap start the model: read the weights from disk into memory and warm up. The second only computes the answer.

Back to [[Homelab UI pages]].
