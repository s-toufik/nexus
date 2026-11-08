---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Test and check

> Lint, type-check and test; the architecture and contract tests included.

**Where:** on your Mac, in `agent-toolbox` · **All guides:** [[Agent toolbox guides]]

```bash
make check        # ruff + ty + pytest
make test
make lint / make format / make typecheck
```

Pre-commit hooks:

```bash
uv run pre-commit install --hook-type pre-commit --hook-type pre-push
```

## Why it works
- [[Architecture tests]] · [[Agent toolbox layers#Same use case, two doors]] · [[Pre-commit hooks]]
