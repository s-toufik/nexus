---
type: path
track: AI
time: ~6 h
projects: ["[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Proving it works

> **Goal:** measure whether the agent behaves — not once, but reliably — with cases, code checks, a judge model and reports.
> **Time:** ~6 h.
> **Before:** [[Path - Agents]]. **Then:** [[Project - A feature across three repos]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. What do the scenario tests prove, and what can't they?
> [!success]- Answer
> That the code follows its rules on both runners, with scripted models. They can't prove a real model makes good decisions.

## 1. Why evaluate · ~1 h
**Read:** [[LLM evaluation]] · [[Agent runtime evaluation]]

**Check:**
1. Why run each case several times?
> [!success]- Answer
> Model outputs vary; one pass proves little. A pass rate over runs measures reliability, and mixed results reveal flaky behaviour.

## 2. A first run · ~2 h
**Read:** [[Agent runtime - Evaluate the agent]]

**Do** (in agent-runtime, against the homelab agent):
1. In `src/agent_evaluation/control_panel.json`: `agent.base_url` = `http://<HOMELAB_DOMAIN>:8000`, a `model_name` from `/v1/models`, and a `judge` (the homelab LLM or NVIDIA's).
2. `make evaluate DRY_RUN=1` → the plan: cases, runs, judge calls.
3. `make evaluate KINDS=MEMORY RUNS=1 PAUSE=0` → one line per run.
4. Open `reports/evaluation/<…>_MEMORY.md`: the result, failed checks, the answers.

**Check:**
1. A case is "flaky". What does that mean, and what do you do?
> [!success]- Answer
> Some runs pass and others fail. Read the failing answers in the report: the cause is often an ambiguous prompt, a borderline judge criterion, or a real inconsistency in the agent (a routing condition, a prompt). Fix the cause, then rerun with more runs.

## 3. Writing a case · ~2 h
**Do:**
1. Add a `Case` to `cases/case_memory.py` modelled on `memory-correction-wins`: tell the agent a fact, correct it, ask a question that needs the correction. Use `Contains`/`NotContains` before `Judged`.
2. `make evaluate CASES='<your-id>' RUNS=3 PAUSE=0`.

**Check:**
1. Why check in code before reaching for the judge?
> [!success]- Answer
> Code checks are exact, free and repeatable; the judge costs calls and can be wrong or biased. Use it only for what code can't judge (quality, relevance).

## 4. Security cases · ~1 h
**Do:** 👀 Read `cases/case_security.py` and the `INVOICE_WITH_INJECTION` fixture in `cases/fixtures.py`.

**Check:**
1. Why are destructive or secret-related requests sent *without* auto-approve?
> [!success]- Answer
> If the agent goes along with one, it only proposes a plan; nothing runs, and no secret can reach the reports.

**Milestone:** you can tell, with numbers, whether a change made the agent better or worse.
