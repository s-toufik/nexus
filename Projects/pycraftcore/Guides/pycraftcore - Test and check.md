---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Test and check

> Lint, type-check, test and measure coverage.

**Where:** on your Mac, in `pycraftcore` · **All guides:** [[pycraftcore guides]]

```bash
make install_dev    # uv sync --group dev --all-extras
make check          # ruff + ty + pytest
make test
make lint / make fix / make format / make typecheck
uv run pytest --cov=pycraftcore --cov-report=term-missing   # coverage per module
```

Pre-commit runs the test suite before every commit and push:

```bash
uv run pre-commit install --hook-type pre-commit --hook-type pre-push
```

## Why it works
- [[Unit tests and test doubles]] · [[Pre-commit hooks]]
