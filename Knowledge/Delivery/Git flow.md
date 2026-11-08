---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, git]
updated: 2026-11-08
---

# Git flow

> A branching model: work happens on `feature/…` branches merged into `develop`; `develop` is merged into `main` for a release; a **tag** `vX.Y.Z` on `main` marks the release. Each branch and tag has a defined effect in CI.

## How it works (as we use it)
```text
feature/… ──PR──► develop ──PR──► main ──tag vX.Y.Z──► a release
                     │              │            │
               image :dev      image :latest   image :X.Y.Z + chart X.Y.Z  → deployed only when homelab-infra asks
```
- Pull requests run lint, type check, tests, build.
- Only **tags** reach the homelab; `dev`/`latest` images are for trying by hand (and `dev-<sha>` because `dev` is mutable).
- Infrastructure repositories (homelab-infra) stay on `develop` and are pulled by the server.
- Variants: trunk-based development (everyone on `main`, feature flags) — simpler, needs strong CI.

## In our projects
agent-runtime, agent-toolbox, homelab-ui publish per branch and tag exactly as above ([[Agent runtime - Release a version]], [[Homelab deployment]]).

## Check yourself
1. Why are `dev` and `latest` images never deployed?
2. Git flow vs trunk-based: what does each optimise for?

## Go further
- [Vincent Driessen: a successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) (and its 2020 note).
- [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/).
