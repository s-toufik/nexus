---
type: concept
domain: Delivery
level: intermediate
tags: [concept, delivery, kubernetes]
updated: 2026-11-08
---

# helmfile

> A file that declares many Helm releases at once — which chart, which version, which values, in which order — and one command that makes the cluster match it.

## Why it matters
Helm installs one release. A platform has thirty, with dependencies (the database before the app) and shared settings. helmfile is to Helm what `docker compose` is to `docker run`: the whole system as one reviewed file.

## How it works
- `helmfile.yaml(.gotmpl)`: `repositories`, `environments` (values files), `helmDefaults`, `templates` (shared release settings), `releases`.
- **Environments**: values loaded first and available as `.Values` in the helmfile and in `.gotmpl` values files.
- **`needs:`** orders releases; independent ones deploy in parallel.
- **Labels + selectors**: `helmfile -l name=caddy apply`, `-l group=observability`.
- **Hooks**: `presync`, `postsync` run local commands around a release.
- Commands: `diff` (helm-diff for all), `apply` (diff, then upgrade only what changed), `sync` (upgrade everything selected), `template` (render only).

## In our projects
- `helmfile.yaml.gotmpl` is the release train ([[homelab-infra]]). A template `homelab` gives every release namespace `homelab`, the `app` chart and two values files: `environments/global.yaml.gotmpl` and `<group>/<release>/values.yaml.gotmpl` — the path derived from the release's `group` label.
- presync hooks check Secrets; postsync waits for PostgreSQL.
- `make diff/apply/sync/template [R=|G=]` wrap it ([[Homelab deployment]]).

## Pitfalls we met
- helmfile **caches charts** by version: a chart republished under the same version isn't re-downloaded (`helmfile cache cleanup`).
- Nested templating: in `templates:`, `{{` must be escaped (`` {{`{{ .Release.Name }}`}} ``) because the helmfile itself is rendered first.

## Check yourself
1. What's the difference between `helmfile apply` and `helmfile sync`?
> [!success]- Answer
> `apply` runs a diff first and upgrades only the releases that changed. `sync` upgrades every selected release, changed or not (useful to re-run hooks or repair drift).
2. How does the `homelab` template find each release's values file?
> [!success]- Answer
> From labels: each release has a `group` label, and the template builds the path `<group>/<release>/values.yaml.gotmpl` from that label and the release's name, alongside the shared `environments/global.yaml.gotmpl`.

## Go further
- [helmfile documentation](https://helmfile.readthedocs.io/).
