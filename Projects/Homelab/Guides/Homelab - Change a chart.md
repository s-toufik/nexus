---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Change a chart

> Change kube-charts' `app` or `pg-cluster` chart, publish it, and deploy it.

**Where:** on your Mac (kube-charts, homelab-infra), then on the server · **All guides:** [[Homelab guides]]

## On your Mac, in kube-charts
1. Edit the chart; raise its `version` in `charts/<chart>/Chart.yaml` (e.g. `0.1.0` → `0.1.1`).
2. Check:
   - `make check`
   - raw: `./scripts/check.sh`
3. Commit and push to `main`. **Actions → Charts**: PUBLISH is green.

## In homelab-infra
4. The new version in `environments/versions.yaml` (`charts.app` or `charts.pgCluster`), commit, push.

## On the server
5. `git pull`, `make diff`, `make apply`.

Apps get the new `app` chart with their next release (their CI builds on the latest one).

## Why it works
- [[kube-charts]] — what the charts give every pod.
- [[Helm]] · [[Semantic versioning]]
