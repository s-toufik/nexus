---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, ci]
updated: 2026-11-12
---

# CI with GitHub Actions

> Continuous integration: every push runs checks and builds automatically; a release tag publishes artefacts. GitHub Actions runs **workflows** (YAML in `.github/workflows/`) of **jobs** and **steps** on GitHub's machines.

## Why it matters
A build on your laptop depends on your laptop. CI builds from the repository alone, the same way every time, and leaves a log of what was published from which commit — the base of trust in a release.

## How it works
- **Triggers** (`on:`): `push` to branches, tags (`v*`), pull requests, schedules, manual.
- **Jobs** run on runners (`ubuntu-latest`), each a list of **steps**: `uses:` an action (`actions/checkout`, `docker/build-push-action`) or `run:` a shell command.
- **Secrets** (registry tokens) are injected as env variables, masked in logs; `GITHUB_TOKEN` can push to GHCR.
- **Reusable workflows** (`workflow_call`): one workflow called by many repositories.

## In our projects
- Each app publishes on tags only: a tag `vX.Y.Z-rc.N` on `develop` → images `X.Y.Z-rc.N` and `dev`; a tag `vX.Y.Z` on `main` → images `X.Y.Z` and `latest` on Docker Hub and chart on GHCR, via kube-charts' reusable `app-chart.yml` ([[kube-charts]]).
- kube-charts: `charts.yml` lints and renders every chart on every push; publishes new chart versions on `main`.
- GHCR packages must be **public** for the server to pull charts without a login.

## Pitfalls we met
- A chart not found on deploy: the tag's workflow failed, or the GHCR package is still private.

## Check yourself
1. What does a reusable workflow give you over copying the same YAML into three repositories?
> [!success]- Answer
> One copy to fix and improve: a change lands in every repository at once, they can't drift apart, and each app's workflow stays a few lines that pass only what differs.
2. Where would you look to know which commit an image `1.1.3` was built from?
> [!success]- Answer
> The git tag `v1.1.3`: `git rev-list -n 1 v1.1.3` gives the commit, and the Actions run that tag triggered shows the same commit and its build log.

## Go further
- [GitHub Actions docs](https://docs.github.com/en/actions).
- [Reusing workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
