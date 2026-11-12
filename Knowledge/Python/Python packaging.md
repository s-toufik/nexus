---
type: concept
domain: Python
level: intermediate
tags: [concept, python, delivery]
updated: 2026-11-12
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
pycraftcore: a git tag publishes — on `develop` a pre-release (`v5.1.0-rc.1`, built as `5.1.0rc1`) to TestPyPI, on `main` the release (`v5.1.0`) to PyPI; CI takes the version from the tag (`uv version --frozen`), finds the branch with `git merge-base --is-ancestor`, then services raise their minimum and `uv lock --upgrade-package pycraftcore` ([[pycraftcore - Release a version]]). A tag name is used once, so the trial and the release are two versions.

## Check yourself
1. Why try a TestPyPI build in a service before PyPI?
> [!success]- Answer
> A version on PyPI can never be uploaded again. Trying the TestPyPI build in a real service first catches a missing file, a broken extra or an import error while it only costs an `rc` number.
2. What does CI's "install each extra alone" catch ([[pycraftcore modules]])?
> [!success]- Answer
> An extra that imports something it doesn't declare, which only worked because another extra installed it. Alone, each extra must install and import on its own.

## Go further
- [Python Packaging User Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/).
