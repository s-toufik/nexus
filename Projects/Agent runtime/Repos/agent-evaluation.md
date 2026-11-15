---
type: repository
project: "[[Agent runtime]]"
repo: https://github.com/s-toufik/agent-evaluation
language: Python 3.14
status: active
tags: [repository, agent-runtime, evaluation]
updated: 2026-11-15
---

# agent-evaluation

> The evaluation of a running agent, from the outside: realistic conversations sent over `POST /v1/api2a`, replies checked in code or by a judge model, reports per kind. It moved out of agent-runtime on 2026-11-15 and imports nothing from it.

## Layout
| Path | What it holds |
|---|---|
| `src/agent_evaluation/domain/` | `Case`, `Say`, checks, results, capabilities (no frameworks) |
| `src/agent_evaluation/application/` | `CasePlayer` ► `KindEvaluator` ► `Evaluation`; ports `Agent`, `Clock`, `ReportWriter` |
| `src/agent_evaluation/adapter/` | `agent/` (HTTP + SSE), `judge/` (`ChatOpenAI` + structured output), `report/`, `journal/`, `clock/` |
| `src/agent_evaluation/cases/` | `case_<kind>.py`, one per kind |
| `src/agent_evaluation/control_panel.json` | The agent's address and model, the judge, capabilities, kinds |
| `tests/` | Checks, SSE client, reports, panel, catalog; `architecture/` for the boundaries |

## How it runs
`make install`, then `make evaluate` (raw: `uv run python -m agent_evaluation --panel src/agent_evaluation/control_panel.json`) against an agent already running — [[Agent runtime - Evaluate the agent]].

## Make targets
`help install test lint fix check evaluate`

## Knowledge it uses
[[LLM evaluation]] · [[Server-sent events]] · [[Hexagonal architecture]] · [[uv and pyproject]]
