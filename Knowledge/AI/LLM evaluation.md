---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, testing]
updated: 2026-11-08
---

# LLM evaluation

> Measuring whether an LLM system does its job: realistic cases, run several times (outputs vary), graded by **code checks** where possible and by a **judge model** where judgement is needed, aggregated into pass rates per kind of behaviour.

## How it works
- **Cases** from real use, with ground truth.
- **Deterministic checks first:** outcome, tools used, contains/regex, no secret leaked — cheap and exact.
- **LLM-as-a-judge** for quality/relevance: one criterion at a time, a score and a reason, a pass threshold; the judge is itself fallible (bias to length, position, its own style).
- **Repetition:** pass rate over N runs; mixed results = **flaky** behaviour worth investigating.
- **Regression:** re-run after every prompt, model or code change.

## In our projects
[[Agent runtime evaluation]]: kinds (tool selection, security, guardrail, completion, memory, relevance, planning, routing, quality), capability-based cases, judged checks, per-kind and overall reports ([[Agent runtime - Evaluate the agent]]).

## Check yourself
1. Why prefer a code check to the judge when both could work?
2. What does a flaky case tell you?

## Go further
- [Anthropic: develop tests](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests).
- [Judging LLM-as-a-judge](https://arxiv.org/abs/2306.05685).
- [Hamel Husain: Your AI product needs evals](https://hamel.dev/blog/posts/evals/).
