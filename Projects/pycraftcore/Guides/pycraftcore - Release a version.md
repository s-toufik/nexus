---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Release a version

> Build, publish to TestPyPI, try it, publish to PyPI, raise the minimum in the services — or develop against a local checkout.

**Where:** on your Mac, in `pycraftcore` · **All guides:** [[pycraftcore guides]]

1. Bump `version` in `pyproject.toml`.
2. `make build`.
3. `make publish_dev` to TestPyPI (needs `TEST_PYPI_TOKEN`), try it in a service, then `make publish` to PyPI (needs `RELEASE_PYPI_TOKEN`).
4. Raise the minimum version in the services that need the change (`pycraftcore[<extras>]>=…` in their `pyproject.toml`), then `uv lock --upgrade-package pycraftcore`.

To work on pycraftcore and a service at the same time, point the service at your checkout with an editable path dependency in its `pyproject.toml`: `pycraftcore = { path = "../pycraftcore", editable = true }` under `[tool.uv.sources]`.

## Why it works
- [[Python packaging]] · [[Semantic versioning]]
