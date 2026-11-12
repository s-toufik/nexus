---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, git]
updated: 2026-11-08
---

# Pre-commit hooks

> Scripts git runs before a commit (or push). The `pre-commit` tool manages them from `.pre-commit-config.yaml`: format, lint, type check, tests — so broken code never leaves your machine.

## How it works
- Install the tool once (`pipx install pre-commit` / `brew install pre-commit`); in a repo: `pre-commit install --hook-type pre-commit --hook-type pre-push`.
- `pre-commit run --all-files` runs everything by hand.
- Fast checks on commit, slow ones (tests) on push.
- CI runs the same checks: hooks are a convenience, CI is the guarantee.

## In our projects
Every repository has `.pre-commit-config.yaml` (Python: ruff, ty, pytest; homelab-ui: typecheck, prettier, tests); Archetype ships it in new projects ([[Homelab UI - Run, test and build]], [[Agent runtime - Test and check]]).

## Check yourself
1. Why still run the same checks in CI?
> [!success]- Answer
> Hooks run on your machine only if they're installed, and they can be skipped (`--no-verify`) or be at another version. CI runs from the repository alone, the same way for every push: that's the guarantee, hooks are a convenience that catches problems sooner.

## Go further
- [pre-commit.com](https://pre-commit.com/).
