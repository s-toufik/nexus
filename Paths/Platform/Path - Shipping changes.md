---
type: path
track: Platform
time: ~8 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Shipping changes

> **Goal:** change anything on the homelab safely — know which file owns a setting, preview, apply, prove, undo — and release an app version end to end.
> **Time:** ~8 h.
> **Before:** [[Path - Containers and Kubernetes]]. **Then:** [[Path - The front door]] · [[Path - Data]] · [[Path - Seeing inside]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Templated packages, revisions | kube-charts' `app` and `pg-cluster` charts; `helm history`, `make rollback` |
| One file lists every release | `helmfile.yaml.gotmpl`, `environments/*.yaml` |
| Settings in layers | chart defaults → app `devops/helm/values.yml` → `global` → release values |
| Preview before applying | `make diff` (helm-diff) |
| One version = image + chart | CI on `vX.Y.Z` tags in homelab-ui, agent-runtime, agent-toolbox |

## Warm-up (optional, from the paths before)
1. Why does editing the Caddyfile restart the Caddy pod?
> [!success]- Answer
> A checksum of the config files is a pod-template annotation; changing the file changes the template, which triggers a rollout.

## 1. Charts and releases · ~2 h

### Learn
**Definitions**
- **Chart** — a folder of templated manifests (`templates/`), defaults (`values.yaml`), metadata (`Chart.yaml`: `version` of the chart, `appVersion` of the software) ([[Helm]]).
- **Release** — a chart installed under a name with values; each upgrade is a numbered **revision**.
- **Rendering** — values merged (defaults ← your files ← `--set`), templates filled with Go templates ([[YAML and templating]]).
- **Library chart** — shared templates only (`homelab-lib`), never installed.
- **values.schema.json** — a JSON Schema for values: a typo fails instead of being ignored.

**How it works**
`helm upgrade --install` renders the chart and sends the manifests; Helm stores each revision as a Secret, so `helm rollback` can re-apply an older one.

**Example from our projects** — how the `app` chart publishes a port (`charts/app/templates/_pod.tpl`, excerpt):
```yaml
{{- if .hostPort }}
hostPort: {{ .hostPort }}
hostIP: {{ required "global.hostIP (the Tailscale address) is required to publish a hostPort" $root.Values.global.hostIP | quote }}
{{- end }}
```
`required` makes rendering *fail* with that message if `global.hostIP` is empty: a safety rule enforced by the chart, for every service.

**Common mistake** — a misspelled values key (`resource:` instead of `resources:`) silently ignored. Our schema turns it into an error.

### Do
1. 👀 `make releases`; `helm -n homelab history homelab-ui`.
2. 👀 In kube-charts: read `charts/app/values.yaml` top to bottom.
3. 👀 `make template R=caddy | grep -B2 -A3 hostPort | head -30`.

### Check
1. What does the `app` chart refuse to render, and why?
> [!success]- Answer
> A `hostPort` without `global.hostIP`: the port would bind every address, including the LAN.

## 2. The release train · ~2 h

### Learn
**Definitions**
- **helmfile** — declares many releases with chart, version, values, labels, `needs:` and hooks; `apply` = diff, then upgrade what changed ([[helmfile]]).
- **Environment** — values files loaded first and available as `.Values` everywhere (`versions.yaml`, `default.yaml`, `local.yaml`).
- **Template (helmfile)** — shared release settings (`homelab`), inherited with `inherit:`.

**How it works**
```text
make apply → helmfile apply
  1 read environments/ (fail if local.yaml isn't a valid Tailscale name/IP)
  2 render every release, helm diff against the cluster → keep changed ones
  3 in needs: order, for each: presync hook → helm upgrade --install → wait Ready / Jobs done → postsync hook
  4 a failure stops the releases after it
```

**Example from our projects** — the shared template (`helmfile.yaml.gotmpl`):
```yaml
templates:
  homelab:
    namespace: homelab
    chart: homelab/app
    version: {{ .Values.charts.app }}
    values:
      - environments/global.yaml.gotmpl
      - "{{`{{ .Release.Labels.group }}/{{ .Release.Name }}`}}/values.yaml.gotmpl"
```
1. `version` comes from `versions.yaml` (`charts.app`).
2. The values path is built from the release's group label and name — the "one folder per release" rule.
3. The backticks escape the inner template: helmfile renders the file once, then each release's template later.

**Common mistake** — "`make apply` did nothing but my pod is gone": apply diffs git with the *Helm release*, not the cluster. `make sync R=…` re-applies.

### Do
1. 👀 Read `helmfile.yaml.gotmpl`: one `needs:`, one presync hook, the postgres postsync hook.
2. 👀 `make diff` → empty.

### Check
1. Keycloak's deploy fails during `make apply`. What happens to `oauth2-proxy` and `grafana`?
> [!success]- Answer
> They don't run: both `need` keycloak and a failure stops the releases after it.

2. Where does a setting win: chart defaults, the app's `values.yml`, `global.yaml.gotmpl`, or the release's values file?
> [!success]- Answer
> The release's own `<group>/<release>/values.yaml.gotmpl`: each layer overrides the one before.

## 3. Your first real change · ~1.5 h

### Learn
**Definitions**
- **Diff** — the exact manifest changes an apply would make (`make diff R=…`).
- **Rollout** — Kubernetes replacing a workload's pods after its template changed.

**How it works** — the loop: edit on the Mac → commit → push → server `git pull` → `make diff` (read it!) → `make apply` → `make verify` → if wrong, `git revert` and apply.

**Example from our projects** — what `make diff R=loki` shows after changing the retention (shape):
```diff
  data:
    config.yml: |
-     retention_period: 720h
+     retention_period: 744h
  …
  annotations:
-   checksum/config: 5f1…
+   checksum/config: a92…
```
Two changes: the ConfigMap's content and the checksum on the pod template — which is why the pod restarts.

**Common mistake** — applying before committing: the next `git pull` + apply silently reverts your change.

### Do ✋ (undo given)
1. In `observability/loki/config.yml`, `retention_period: 720h` → `744h`; commit, push.
2. Server: `git pull`, `make diff R=loki`, `make apply R=loki`, `make status`.
3. Undo: `git revert HEAD`, push, pull, `make apply R=loki`.

## 4. Releasing an app · ~1.5 h

### Learn
**Definitions**
- **Semantic version** — `MAJOR.MINOR.PATCH`: breaking / feature / fix ([[Semantic versioning]]).
- **Tag** — the git name of a release commit; CI publishes from it ([[CI with GitHub Actions]]).
- **OCI registry** — stores images *and* charts (GHCR for charts, Docker Hub for images).

**How it works**
Tag `vX.Y.Z` → CI builds image `toufik142/<app>:X.Y.Z` and, with kube-charts' reusable workflow, chart `<app>` `X.Y.Z` with the app's `devops/helm/values.yml` baked in → you set `apps.<app>: X.Y.Z` in `versions.yaml` → `make apply R=<app>`.

**Example from our projects** — homelab-ui's own runtime settings, carried by its chart (`devops/helm/values.yml`):
```yaml
replicas: 1
ports:
  - name: http
    port: 8080
probes:
  readiness:
    httpGet: { path: /, port: http }
resources:
  requests: { cpu: 10m, memory: 32Mi }
  limits: { memory: 128Mi }
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 101
securityContext:
  readOnlyRootFilesystem: true
```
The app owns how it runs; homelab-infra adds only what's this server's.

**Common mistake** — re-pushing `v1.1.3` after a fix: chart and image are cached under that version. Tag `v1.1.4`.

### Do
1. 👀 homelab-ui on GitHub → Actions: the last tag's PUBLISH and CHART runs.
2. 👀 `helm show chart oci://ghcr.io/s-toufik/charts/homelab-ui --version <apps.homelabUi>`.

### Check
1. Why does a new number skip both caches?
> [!success]- Answer
> helmfile caches charts by version and k3s caches images by tag; a new version is a new key in both, and `make rollback` still knows the previous build.

## 5. Undo · ~45 min

### Learn
**Definitions** — **rollback**: re-apply a previous Helm revision (`make rollback R=…` = `helm -n homelab rollback <release>`).

**Common mistake** — rolling back and forgetting `versions.yaml`: the next `make apply` upgrades again.

### Check
1. After `make rollback R=homelab-ui`, what must you do next?
> [!success]- Answer
> Set the previous version back in `versions.yaml` and commit.

**Milestone:** you can change, release and roll back anything on the homelab, and explain each step's raw command. Deep dives: [[Homelab deployment]] · [[kube-charts]] · [[Homelab - Release an app]].
