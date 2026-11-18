---
type: guide
project: "[[Kitchen Atelier]]"
tags: [guide, kitchen-atelier]
updated: 2026-11-18
---

# Kitchen Atelier - Refresh the ingredient catalog

> Re-download ANSES's CIQUAL table and write only what changed. Runs weekly on its own in the homelab (Monday 04:00); this is for running it by hand.

**Where:** on your Mac, in `kitchen-atelier`, or on the server · **All guides:** [[Kitchen Atelier guides]]

## 1. By hand, locally
1. `make refresh_ingredients`
2. Check the log: rows written; a second run right after should write 0.

## 2. On the homelab, out of schedule
1. Find the CronJob's last run: `kubectl get jobs -l app=kitchen-atelier`
2. Trigger one now: `kubectl create job --from=cronjob/kitchen-atelier-refresh-ingredients kitchen-refresh-manual`
3. Check: `kubectl logs job/kitchen-refresh-manual`

## 3. Change the schedule or the dataset URL
1. Edit `kitchen-atelier`'s `devops/helm/values.yml`: `cronJobs.refresh-ingredients.schedule`, or `CIQUAL_DATASET_URL`.
2. Bump the app's version in homelab-infra's `versions.yaml` → `apps.kitchenAtelier`.
3. `make apply R=kitchen-atelier` — raw: see [[Homelab change cookbook]].

## If it goes wrong
- `CIQUAL_DATASET_URL` is still the placeholder (`REPLACE-WITH-REAL-RESOURCE-ID`): fill in the real data.gouv.fr resource id — nothing downloads until it's set.
- A run writes far more rows than expected: ANSES changed the CSV's column layout; check `ciqual_parser.py` against the new header row before trusting the diff.

## Why it works
- [[Kitchen Atelier ingredients]] — why this is a weekly bulk diff, not a live per-ingredient lookup.
