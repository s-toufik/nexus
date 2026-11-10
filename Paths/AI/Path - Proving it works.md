---
type: path
track: AI
time: ~7 h
projects: ["[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Proving it works

> **Goal:** measure whether the agent behaves — reliably, not once — with cases, code checks, a judge model and reports.
> **Time:** ~7 h.
> **Before:** [[Path - Agents]]. **Then:** [[Project - A feature across three repos]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Evaluate what's deployed, from outside | `agent_evaluation` over HTTP, never importing the agent |
| Code checks before a judge | `cases/dsl.py`: `Answers`, `Contains`, `UsesAll`… then `Judged` |
| Repetition and pass rates | `runs`, `case_pass_rate`, flaky detection |
| Capabilities, not tool names | `capabilities` in `control_panel.json` |
| Safe by construction | destructive cases sent without auto-approve |

## Warm-up (optional)
1. What do the scenario tests prove, and what can't they?
> [!success]- Answer
> That the code follows its rules (with scripted models); they can't prove a real model decides well.

## 1. Why evaluate · ~1.5 h

### Learn
**Definitions**
- **Case** — a short conversation with expected checks ([[LLM evaluation]]).
- **Check** — passes or fails; a **judged** check gets a 0–1 score from a judge model.
- **Run / case / kind** — one execution / several runs of a case / a family of cases (security, memory…).
- **Flaky** — some runs pass, others fail.

**How it works**
```text
make evaluate → preflight (agent answers, model served) → for each kind, case, run:
  send each message (new conversation per run) → collect events → checks (code, then judge) → reports
```

**Example from our projects** — how results are decided ([[Agent runtime evaluation]]):
| Level | Passes when |
|---|---|
| run | every check of every message passes (ERROR if no usable answer — retried) |
| case | at least `case_pass_rate` of runs pass; mixed → flaky |
| kind | every case it ran passed |

**Common mistake** — one run per case: a lucky pass hides a 40 % failure rate.

### Check
1. Why run each case several times?
> [!success]- Answer
> Outputs vary; a pass rate measures reliability and exposes flaky behaviour.

## 2. A first run · ~2 h

### Learn
**Definitions**
- **Control panel** — `control_panel.json`: the agent, the judge, run defaults, kinds, capabilities, security markers.
- **Dry run** — print the plan without calling anything.

### Do (agent-runtime, against the homelab agent)
1. `control_panel.json`: `agent.base_url` = `http://<HOMELAB_DOMAIN>:8000`, a `model_name` from `/v1/models`, a `judge`.
2. `make evaluate DRY_RUN=1`; `make evaluate KINDS=MEMORY RUNS=1 PAUSE=0`.
3. Read `reports/evaluation/<…>_MEMORY.md`.

### Check
1. A case is flaky. What do you do?
> [!success]- Answer
> Read the failing answers: an ambiguous prompt, a borderline judge criterion, or a real inconsistency in the agent. Fix the cause, rerun with more runs.

## 3. Writing a case · ~2 h

### Learn
**Example from our projects** — `memory-correction-wins` (from the evaluation README):
```python
Case(
    id="memory-correction-wins",
    title="A correction replaces the earlier fact",
    requires=(),
    says=(
        Say("Our SLA for SEV1 incidents is 4 hours.", (Answers(),)),
        Say("Correction: the SEV1 SLA is 2 hours, not 4.", (Answers(),)),
        Say(
            "A SEV1 was opened at 09:00. By what time must it be resolved to meet our SLA?",
            (Answers(), Contains("11:00"), NotContains("13:00")),
        ),
    ),
)
```
Three messages, one conversation; the last checks the *correct* time and the absence of the old one — no judge needed.

**Common mistake** — `Judged("the answer is correct")` where `Contains("11:00")` would do: slower, costlier, less reliable.

### Do
Write a similar case in `cases/case_memory.py`; `make evaluate CASES='<your-id>' RUNS=3 PAUSE=0`.

## 4. Security cases · ~1.5 h

### Learn
**Definitions**
- **Instruction markers / secret patterns** — prompt fragments and secret regexes that must never appear in answers.
- **Fixture with injection** — `INVOICE_WITH_INJECTION`: an invoice hiding an instruction the agent must ignore.

**How it works** — destructive or secret-related requests go **without** auto-approve: the worst a failure can produce is a plan, so nothing runs and no secret reaches the reports.

### Do
👀 `cases/case_security.py`, `cases/fixtures.py`.

**Milestone:** you can tell, with numbers, whether a change made the agent better or worse.
