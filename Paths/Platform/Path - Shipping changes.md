---
type: path
track: Platform
time: ~7 h
projects: ["[[Homelab]]", "[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Shipping changes

> **Goal:** change anything on the homelab safely: know which file owns a setting, preview the change, apply it, prove it, undo it — and release an app version end to end.
> **Time:** ~7 h.
> **Before:** [[Path - Containers and Kubernetes]]. **Then:** [[Path - The front door]] · [[Path - Data]] · [[Path - Seeing inside]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. Why does editing the Caddyfile restart the Caddy pod?
> [!success]- Answer
> A checksum of the config files is a pod-template annotation; changing the file changes the template, which triggers a rollout.

## 1. Charts and releases · ~1.5 h
**Read:** [[Helm]] · [[YAML and templating]] · [[kube-charts]]

**Do:**
1. 👀 `make releases` → every release with its chart and app version.
2. 👀 `helm -n homelab history homelab-ui` → its revisions; each is a deploy you can roll back to.
3. 👀 In kube-charts on your Mac, read `charts/app/values.yaml` top to bottom — it's the contract of every service.
4. 👀 `make template R=caddy | grep -B2 -A3 hostPort | head -30` → the rendered ports, each with `hostIP`.

**Check:**
1. What does the `app` chart refuse to render, and why?
> [!success]- Answer
> A `hostPort` without `global.hostIP` (the Tailscale address). Without it, the port would bind every address of the server, including the LAN.

## 2. The release train · ~1.5 h
**Read:** [[helmfile]] · [[Homelab deployment]] · [[homelab-infra]]

**Do:**
1. 👀 Read `helmfile.yaml.gotmpl`: find the `homelab` template, one `needs:` and one presync hook.
2. 👀 Read `environments/versions.yaml` and `default.yaml`.
3. 👀 `make diff` → empty: the server runs what git says.

**Check:**
1. Keycloak's deploy fails during `make apply`. What happens to `oauth2-proxy` and `grafana` in that run?
> [!success]- Answer
> They don't run: both `needs` keycloak, and a failure stops the releases after it. Fix, commit, `make apply` again.

2. Where does a setting win: kube-charts' defaults, the app's `devops/helm/values.yml`, `global.yaml.gotmpl`, or `<group>/<release>/values.yaml.gotmpl`?
> [!success]- Answer
> The last one listed: each layer overrides the one before, so the release's own values file wins.

## 3. Your first real change · ~1.5 h
**Read:** [[Homelab - Deploy a change]] · [[Homelab change cookbook]]

**Do** ✋ (undo given):
1. On your Mac, in `observability/loki/config.yml`, change `retention_period: 720h` to `744h` (31 days). Commit, push.
2. On the server: `git pull`, `make diff R=loki` → read the diff: only the ConfigMap and the checksum annotation change.
3. `make apply R=loki` → the Loki pod restarts; `make status` → `Running 1/1`.
4. Undo: `git revert HEAD`, push, `git pull`, `make apply R=loki`.

**Check:**
1. Why commit *before* applying?
> [!success]- Answer
> The server runs what git says. A change applied but not committed is overwritten at the next `git pull` + `make apply`, and nobody can see what changed or why.

## 4. Releasing an app · ~1.5 h
**Read:** [[Semantic versioning]] · [[CI with GitHub Actions]] · [[Homelab - Release an app]] · [[Homelab UI - Release a version]]

**Do:**
1. 👀 On GitHub, open homelab-ui's **Actions**: find the last tag's PUBLISH and CHART runs.
2. 👀 `helm show chart oci://ghcr.io/s-toufik/charts/homelab-ui --version <apps.homelabUi>` → `name: homelab-ui`, same version as the image.
3. Next time homelab-ui has a change on `develop`: release it end to end with the guide (tag, versions.yaml, `make apply R=homelab-ui`).

**Check:**
1. Why tag `v1.1.4` instead of re-pushing `v1.1.3` after a fix?
> [!success]- Answer
> The server caches the chart (helmfile) and the image (`IfNotPresent`), so the same tag keeps the old build; a new number skips both caches, and `make rollback` still knows the previous build.

## 5. Undo · ~45 min
**Read:** [[Homelab - Roll back]]

**Check:**
1. You `make rollback R=homelab-ui`. What must you do next, and why?
> [!success]- Answer
> Set the previous version back in `environments/versions.yaml` and commit; otherwise the next `make apply` upgrades again to the version you rolled back from.

**Milestone:** you can change, release and roll back anything on the homelab, and explain each step's raw command.
