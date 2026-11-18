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
- `CIQUAL_DATASET_URL` is set to data.gouv.fr's stable resource link for *"Table Ciqual 2020 en Français au format Excel"* (`bcdb7fec-875c-42aa-ba6e-460adf97aad3`), which redirects to the file on `ciqual.anses.fr` itself — if ANSES's own site is in maintenance (it was, as of 2026-11-18), the redirect resolves fine but the download 503s. Retry later; the weekly schedule will too.
- ANSES has since moved the *current* edition (2025, more foods) to `entrepot.recherche.data.gouv.fr` (DOI `10.57745/RDMHWY`) — not switched to because that domain wasn't reachable to check its direct-download URL shape when this was last touched, and the freely-downloadable mirror on Zenodo (`zenodo.org/records/4770202`) is English-only, whose header names don't match [[Kitchen Atelier ingredients|`CiqualRowMapper`'s]] French column markers (`alim_nom_fr`, …).
- A run writes far more rows than expected: ANSES changed the file's column layout; check `CiqualRowMapper`'s marker tuples against the new header row before trusting the diff.

## Why it works
- [[Kitchen Atelier ingredients]] — why this is a weekly bulk diff, not a live per-ingredient lookup.
