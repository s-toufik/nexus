---
type: concept
domain: Python
level: beginner
tags: [concept, python, tooling]
updated: 2026-11-08
---

# uv and pyproject

> `pyproject.toml` is the standard file describing a Python project (name, version, dependencies, extras, tool settings). **uv** is a fast tool that creates the virtual environment, resolves and installs dependencies, locks them in `uv.lock`, and runs commands in that environment.

## How it works
- `[project]`: `dependencies`, `requires-python`; `[project.optional-dependencies]`: extras (`pycraftcore[http]`); `[dependency-groups]`: dev tools (pytest, ruff).
- `uv sync --group dev` → `.venv` matching `uv.lock` exactly; `uv add pkg`; `uv run pytest`; `uv lock --upgrade-package x`.
- `[tool.uv.sources]`: e.g. `pycraftcore = { path = "../pycraftcore", editable = true }` to develop two projects together.
- Tool config lives in the same file: `[tool.ruff]`, `[tool.pytest.ini_options]`, `[tool.ty]`.
- **Lock file** = reproducible installs; commit it for applications.

## In our projects
Every Python project (agent-runtime, agent-toolbox, pycraftcore, web_framework, archetype's template) uses uv; `make install_dev` wraps `uv sync`; `make check` runs ruff + ty + pytest.

## Check yourself
1. Extras vs dependency groups: which ends up in a published package?
2. Why commit `uv.lock` for a service?

## Go further
- [uv docs](https://docs.astral.sh/uv/), [pyproject.toml spec](https://packaging.python.org/en/latest/specifications/pyproject-toml/).
- [ruff](https://docs.astral.sh/ruff/), [ty](https://docs.astral.sh/ty/).
