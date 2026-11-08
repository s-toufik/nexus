---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Roll back

> Go back to a release's previous revision, or to a chosen version.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## Right away
1. `make releases` — raw: `helm list -A` (current revision of each release)
2. `make rollback R=<release>` — raw: `helm -n homelab rollback <release>`
3. In `environments/versions.yaml`, set the previous version back, commit, push (otherwise the next `make apply` upgrades again).

## To a chosen version
1. That version in `environments/versions.yaml`.
2. `make apply R=<release>`

## If it goes wrong
- `another operation (install/upgrade/rollback) is in progress`: [[Homelab - Troubleshooting]].

## Why it works
- [[Helm]] — revisions and `helm rollback`.
- [[Homelab deployment]] — why `versions.yaml` must follow.
