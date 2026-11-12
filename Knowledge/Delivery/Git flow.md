---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, git]
updated: 2026-11-12
---

# Git flow

> A branching model: work happens on `feature/…` branches merged into `develop`; `develop` is merged into `main` for a release; a **tag** `vX.Y.Z` on `main` marks the release. Each branch and tag has a defined effect in CI.

## How it works (as we use it)
```text
feature/… ──PR──► develop ──PR──► main
                     │               │
                tag vX.Y.Z-rc.N    tag vX.Y.Z
                     │               │
               a pre-release       a release
               image :X.Y.Z-rc.N   image :X.Y.Z + chart X.Y.Z  → deployed only when homelab-infra asks
               and :dev            and :latest
               (libraries: TestPyPI)  (libraries: PyPI)
```
- Pull requests run lint, type check, tests, build.
- **The branch a tag is on decides the channel.** A tag is not on a branch, it points at a commit, so CI asks git: `git merge-base --is-ancestor <commit> origin/main` → a release; else on `origin/develop` → a pre-release; else nothing. A commit on both (after `main` is merged back) counts as `main`.
- **The name must match the channel:** `vX.Y.Z` only on `main`, `vX.Y.Z-rc.N` only on `develop`. A tag name exists once, so a final name used on `develop` could never be released.
- **Only tags publish**; pushes run the checks. `dev` follows the last pre-release, `latest` the last release.
- Only **tags on `main`** reach the homelab; `dev`/`latest` are for trying by hand, and the server is always given an exact version, because they move.
- Infrastructure repositories (homelab-infra) stay on `develop` and are pulled by the server.
- Variants: trunk-based development (everyone on `main`, feature flags) — simpler, needs strong CI.

## In our projects
agent-runtime, agent-toolbox, homelab-ui, pycraftcore and the pricelab libraries share one job, RELEASE TARGET, byte for byte in their `cicd.yml`; only what each channel publishes differs: images and a chart for the services, PyPI or TestPyPI for the libraries ([[Agent runtime - Release a version]], [[pycraftcore - Release a version]], [[Homelab deployment]]).

## Check yourself
1. Why is the server never given `dev` or `latest`?
> [!success]- Answer
> They move with every new tag, so the server couldn't say which code it runs, and k3s keeps an image it already has, so it wouldn't even pick up the newer one. A version tag never moves.
2. Git flow vs trunk-based: what does each optimise for?
> [!success]- Answer
> Git flow: a stable `main` and a deliberate release step. Trunk-based: small changes merged fast, which needs strong CI and feature flags.
3. You tag `v1.3.0` on a `develop` commit by mistake. What does CI do, and why is that the right call?
> [!success]- Answer
> RELEASE TARGET stops it: a final version only on `develop` is refused and nothing is published. Otherwise `1.3.0` would be burnt as a trial and the real release would need another number.

## Go further
- [Vincent Driessen: a successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) (and its 2020 note).
- [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/).
