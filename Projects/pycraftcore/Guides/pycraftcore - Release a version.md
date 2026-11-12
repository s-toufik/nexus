---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-12
---

# pycraftcore - Release a version

> A tag publishes: on `develop` to TestPyPI, on `main` to PyPI. The tag is the version.

**Where:** on your Mac, in `pycraftcore` · **All guides:** [[pycraftcore guides]]

## Try a version on TestPyPI
1. `git switch develop && git pull`
2. `git tag vX.Y.ZrcN`
3. `git push origin vX.Y.ZrcN`
4. GitHub **Actions**: RELEASE TARGET says `testpypi`, PUBLISH is green.
5. In a fresh venv: `pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ "pycraftcore[<extras>]==X.Y.ZrcN"` installs it ([[pycraftcore - Install it]]).

## Release it on PyPI
1. On `develop`: `version = "X.Y.Z"` in `pyproject.toml`, commit, push.
2. Pull request `develop` → `main`, merged, CI green.
3. `git switch main && git pull`
4. `git tag vX.Y.Z`
5. `git push origin vX.Y.Z`
6. GitHub **Actions**: RELEASE TARGET says `pypi`, PUBLISH is green.
7. In each service that needs it: `pycraftcore[<extras>]>=X.Y.Z` in `pyproject.toml`, then `make update_dependency PACKAGE=pycraftcore` — raw: `uv lock --upgrade-package pycraftcore && uv sync`.

## Develop against a local checkout
1. In the service's `pyproject.toml`, under `[tool.uv.sources]`: `pycraftcore = { path = "../pycraftcore", editable = true }`.
2. `uv sync`

## Why it works
- [[Python packaging]] · [[Semantic versioning]]
