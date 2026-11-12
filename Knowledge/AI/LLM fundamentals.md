---
type: concept
domain: AI
level: beginner
tags: [concept, ai, llm]
updated: 2026-11-12
---

# LLM fundamentals

> A large language model predicts the next **token** (a piece of a word) given everything before it — its **context**. Repeating that prediction writes text. Everything else — chat, tool calls, plans — is built on this loop.

## Why it matters
Most agent design is managing four scarce things: context (what the model sees), tokens (cost and time), randomness (sampling) and the model's knowledge limits. Understanding them explains our agent's budgets, summaries and reviews.

## How it works
- **Tokens:** ~¾ of a word in English; billing, speed and limits count tokens. `input_tokens`/`output_tokens` in the agent's metadata.
- **Context window:** the maximum tokens a model attends to at once (e.g. 16k–32k for our local models). Everything — system prompt, history, tool results — competes for it → summarize, trim, keep only the last tool calls.
- **Sampling:** `temperature` (0 = most likely token, higher = more varied), `top_p`, `top_k`. The agent uses 0.0 by default for repeatability.
- **Chat format:** messages with roles `system`, `user`, `assistant`, `tool`; a chat template turns them into the model's prompt ([[OpenAI-compatible API]]).
- **Tool calling:** the model outputs a structured call (name + JSON arguments) instead of text; your code runs it and returns the result ([[Model Context Protocol]]).
- **Structured output:** asking for JSON matching a schema (the judge's `GradeDto`).
- **Reasoning / thinking:** some models think in hidden tokens first — better answers, more tokens and time (`reasoning_effort`).
- **Hallucination:** fluent and wrong; mitigate with tools, grounding, review and evaluation.

## In our projects
- Model parameters per model: `temperature`, `max_output_tokens`, `max_context_tokens`, `reasoning_effort` ([[Agent runtime - Configure it]]).
- Summarize when the history passes half the context; paused plans keep only their last 20 tool calls ([[Agent runtime plans and outcomes]]).
- **Every call is sized to the window**, not just the history. agent-runtime keeps room for the answer and the tool definitions, counts 85 % of the rest (its count is an estimate), cuts this turn's tool results oldest first with a note asking the model to fetch less, then fills what is left with history. Before that fix, a request of 45,621 tokens hit a 32,768-token model and llama.cpp refused it with a `400`.
- **Tool definitions are the hidden cost.** Measured on the homelab's 55 tools: the full catalogue in the prompt was 13.7k tokens and all definitions sent with a plan step 28.8k, more than the window before any history. Now the planner sees each tool as a typed signature (inputs, defaults, output) plus its first sentence, the act prompt lists each tool in one line, a plan step sends only the plan's tools, and `python_executor` lists its callable functions without argument docs: about 4k to plan, 2.5k for a direct answer, 4–10k for a plan step.
- Local models, quantized to fit memory ([[Running LLMs locally]]).

## Check yourself
1. Why does a long tool result make the model worse at following instructions?
2. Why use temperature 0 for an agent's planner?

## Go further
- [Andrej Karpathy: Intro to Large Language Models (video)](https://www.youtube.com/watch?v=zjkBMFhNj_g), [Let's build the GPT tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE).
- [Anthropic: prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview).
