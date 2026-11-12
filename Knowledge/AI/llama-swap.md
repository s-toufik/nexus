---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, llm]
updated: 2026-11-08
---

# llama-swap

> A small proxy in front of model servers: it reads the `model` field of an OpenAI-style request, starts the matching `llama-server` if it isn't running (swapping out another if needed), forwards the request, and stops idle models after their `ttl`.

## Why it matters
One `llama-server` serves one model. Memory can't hold them all. llama-swap gives you "many models behind one API" on one machine — the same idea as model routing in hosted platforms, at home scale.

## How it works
- `models:` — each with `cmd` (how to start it), `aliases`, `ttl` (seconds idle before unloading; 0 = never).
- `groups:` — `swap: true` means only one member runs at a time; `persistent: true` means it isn't stopped by other groups' swaps; `exclusive` controls whether loading it stops other groups.
- `macros` — shared command-line fragments.
- Endpoints: `/v1/*` (OpenAI), `/running`, `/logs`, `/upstream/<model>/…` (talk to one model directly, e.g. its `/metrics`), a UI.
- `healthCheckTimeout` — how long to wait for a model to start (downloads included).

## In our projects
Groups `always-on` (`qwen3-8b`) and `on-demand` (the rest, `ttl: 300`, one at a time) ([[Homelab LLM and agent]]). Prometheus scrapes `/upstream/<model>/metrics`; **llm-sd** lists on-demand models only during their first `ttl` so scrapes don't keep them loaded ([[Homelab observability]]). `make llm-running`, `llm-ask`, `llm-down` / `llm-up`.

## Check yourself
1. What happens when two users ask for two different on-demand models at the same time?
> [!success]- Answer
> The on-demand group swaps, so only one runs at a time. They take turns: one request waits while llama-swap stops the other model and loads its own, and each swap costs a full model load.
2. Why would a scrape keep a model loaded?
> [!success]- Answer
> Every scrape of `/upstream/<model>/metrics` is a request for that model: llama-swap starts it if needed and resets its idle timer, so it would never reach its `ttl`. That's why llm-sd lists on-demand models only during their first `ttl`.

## Go further
- [llama-swap](https://github.com/mostlygeek/llama-swap) and its [configuration example](https://github.com/mostlygeek/llama-swap/blob/main/config.example.yaml).
