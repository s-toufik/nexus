---
type: concept
domain: Python
level: intermediate
tags: [concept, python, delivery]
updated: 2026-11-08
---

# Python packaging

> Turning a library into a distributable **wheel** (and source distribution), published to an index (PyPI, or TestPyPI for trials) under a version, with extras for optional dependencies.

## How it works
- Build: `uv build` / `python -m build` → `dist/*.whl`, `*.tar.gz`.
- Publish: `uv publish` / twine, with an API token; **TestPyPI** first, then PyPI. A version can never be re-uploaded.
- **Extras** keep the base install small: `pip install "pycraftcore[http,repository]"`.
- Consumers pin a minimum (`pycraftcore[http]>=1.4`) and lock exact versions.
- `py.typed` marks a typed package for type checkers.

## In our projects
pycraftcore: `make build`, `make publish_dev` (TestPyPI, `TEST_PYPI_TOKEN`), `make publish` (PyPI, `RELEASE_PYPI_TOKEN`), then services raise their minimum and `uv lock --upgrade-package pycraftcore` ([[pycraftcore - Release a version]]).

## Check yourself
1. Why try a TestPyPI build in a service before PyPI?
2. What does CI's "install each extra alone" catch ([[pycraftcore modules]])?

## Go further
- [Python Packaging User Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/).
