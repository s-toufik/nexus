---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-08
---

# Agent runtime - Test and check

> Run the linters, the type checker and the tests — none of them calls a model.

**Where:** on your Mac, in `agent-runtime` · **All guides:** [[Agent runtime guides]]

```bash
make check        # ruff + ty + pytest
make test         # unit, scenario and architecture tests: never calls a model
make lint / make format / make typecheck
```

`tests/agent_runtime/scenarios/` runs whole turns on two runners, LangGraph and a plain in-memory loop over the same steps and policy, and requires the same answers, events and stored conversation from both. Scripted models make every route reachable, including the rare ones (a review rejection, a plan request from act, running out of steps).

Pre-commit hooks:

```bash
uv run pre-commit install --hook-type pre-commit --hook-type pre-push
```

## Why it works
- [[Agent runtime turn#Two runners, one behaviour]] — what the scenario tests prove.
- [[Architecture tests]] · [[Unit tests and test doubles]] · [[Pre-commit hooks]]
