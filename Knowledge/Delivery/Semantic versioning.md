---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery]
updated: 2026-11-08
---

# Semantic versioning

> `MAJOR.MINOR.PATCH`: bump PATCH for fixes, MINOR for new backwards-compatible features, MAJOR for breaking changes. A version number becomes a promise about what upgrading will do.

## Why it matters
A version is how you say *exactly* what runs, roll back to a known state, and decide how careful an upgrade must be. Mutable versions ("latest", re-tagging) break all three.

## How it works
- `1.4.2 → 1.4.3`: safe fix. `→ 1.5.0`: new things, old ones still work. `→ 2.0.0`: read the changelog.
- `0.x.y`: anything may change — early development.
- Pre-releases: `1.5.0-rc.1`. Build metadata: `+k3s1` (k3s' `v1.36.5+k3s1`).
- A **git tag** `vX.Y.Z` marks the commit; CI builds artefacts from it. Tags must be **immutable**: once published, never move them.

## In our projects
- App release = tag `vX.Y.Z` → image and chart `X.Y.Z` ([[Homelab deployment]]).
- `environments/versions.yaml` pins every chart, image and app version — the release train.
- kube-charts bumps a chart's `version` in `Chart.yaml` to publish it.

## Pitfalls we met
- Re-tagging `v1.1.2` after a fix meant clearing two caches on the server; tagging `v1.1.3` would have taken one command.

## Check yourself
1. You add an optional field to an API response. Which part do you bump? You rename an endpoint?
2. Why must a published tag never move?

## Go further
- [semver.org](https://semver.org/).
- [Keep a Changelog](https://keepachangelog.com/).
