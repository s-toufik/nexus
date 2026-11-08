---
type: architecture
project: "[[Agent runtime]]"
order: 4
tags: [agent-runtime, architecture, ai, testing]
updated: 2026-11-08
---

# Agent runtime evaluation

> Unit tests prove the code follows its rules; they can't prove the *model* behaves. `agent_evaluation` is a separate program that talks to a **running** agent over its public API, sends realistic conversations several times, checks the replies in code where it can and with a **judge model** where it must, and writes reports per kind of behaviour.

Previous: [[Agent runtime plans and outcomes]] · Back: [[Agent runtime]]

**Do it:** [[Agent runtime - Evaluate the agent]]

## Why from the outside
It never imports the agent or reads its config: it evaluates exactly what is deployed, through the same HTTP contract homelab-ui uses (`message`, `model_name`, `request_id`, `auto_approve`; events `status`, `token`, `final`, `error`, `complete`). If that contract changes, one adapter changes.

## What it checks
**Kinds:** tool selection, security, guardrail, task completion, memory, relevance, planning, routing, quality.

A **case** is a short conversation of `Say(message, checks)`. Checks, cheapest first:
| Check | Kind |
|---|---|
| `Answers()`, `OutcomeIs(…)` | the outcome |
| `UsesAny/UsesAll/Avoids/UsesNoTools` | the tools used, by capability |
| `Contains/NotContains/Matches` | the text |
| `ShowsPlanStep()` | whether planning happened |
| `KeepsInstructionsPrivate()`, `LeaksNoSecrets()` | security |
| `Judged(criterion)` | a judge model scores 0–1 ([[LLM evaluation]]) |

Ground truth comes from fixtures the agent writes itself (an incident export, revenue per region, release notes, an invoice with a hidden injected instruction — [[Guardrails and prompt injection]]).

## How results are decided
- **Run:** passes if every check of every message passes; ERROR if the agent or judge gave no usable answer (retried).
- **Case:** passes if ≥ `case_pass_rate` of runs pass; some pass, some fail → **flaky**.
- **Kind:** passes if every case passed.
Models are non-deterministic: one run proves little; rates over several runs mean something.

## Capabilities, not tool names
Cases say what they need (`jira`, `files_write`, `guardrail`); the control panel maps capabilities to tool-name patterns and says which are available. A missing capability skips a case — or runs one that checks the agent *doesn't pretend* (no Jira → it must not claim it created a ticket).

## Safety
Anything destructive or secret-related is sent **without** auto-approve: the worst a failure can do is propose a plan.

## Check yourself
1. Why can't unit tests with scripted models replace this?
2. Why prefer code checks over the judge where possible?
3. What does "flaky" tell you about an agent behaviour?

## Go further
- [Anthropic: create strong empirical evaluations](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests).
- [Judging LLM-as-a-judge (Zheng et al.)](https://arxiv.org/abs/2306.05685).
