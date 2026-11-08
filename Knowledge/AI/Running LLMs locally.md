---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, llm]
updated: 2026-11-08
---

# Running LLMs locally

> A language model is a big file of weights; an **inference server** loads it into memory and generates text token by token. Running one on your own CPU is possible because of **quantization** (smaller numbers per weight) and efficient engines like **llama.cpp**.

## Why it matters
Local models mean privacy, no per-token cost and no dependency on a provider — at the price of speed and quality. Knowing the trade-offs (size, quantization, context, memory, threads) lets you pick a model that actually fits a machine.

## How it works
- **Parameters**: 0.8B, 8B, 14B… roughly the model's size and capability.
- **Quantization**: weights stored in fewer bits — `Q8_0` (8-bit, near-lossless), `Q4_K_M` (≈4.5 bits, the usual sweet spot). Memory ≈ parameters × bits / 8, plus the **KV cache**.
- **GGUF**: llama.cpp's file format, with the weights and tokenizer in one file; downloaded from Hugging Face (`-hf repo:quant`).
- **Context size**: how many tokens the model sees at once; the KV cache grows with it (memory!).
- **Throughput** on CPU: bound by memory bandwidth; `--threads` ≈ physical cores.
- **MoE** (mixture of experts, e.g. `8B-A1B`): many parameters, few active per token → faster than its size suggests.
- **Chat templates** turn messages into the model's prompt format (`--jinja`).

## In our projects
`llm/llm/config.yml` runs `llama-server` per model: Qwen3 / Qwen3.5, LFM2, Ministral…, mostly Q8_0 for small and Q4_K_M for 8B, 16–32k context, 12 threads, thinking disabled, `--metrics` for Prometheus. One 8B always on, one on-demand at a time, 26 GiB limit ([[Homelab LLM and agent]], [[llama-swap]]).

## Check yourself
1. Roughly how much memory do an 8B model's weights take at Q4_K_M? At Q8_0?
2. Why does doubling the context size increase memory even with the same model?

## Go further
- [llama.cpp](https://github.com/ggml-org/llama.cpp), [GGUF on Hugging Face](https://huggingface.co/docs/hub/gguf).
- [Hugging Face: quantization concepts](https://huggingface.co/docs/optimum/concept_guides/quantization).
- [Andrej Karpathy: Intro to Large Language Models (video)](https://www.youtube.com/watch?v=zjkBMFhNj_g).
