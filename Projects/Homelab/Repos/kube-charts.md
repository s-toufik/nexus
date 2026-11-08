---
type: repository
project: "[[Homelab]]"
repo: https://github.com/s-toufik/kube-charts
language: Helm templates
status: active
tags: [repository, homelab, helm]
updated: 2026-11-08
---

# kube-charts

> The Helm charts everything runs on: `app` (any container), `pg-cluster` (a CloudNativePG PostgreSQL), and `homelab-lib` (helpers they share).

## Layout
| Path | What it holds |
|---|---|
| `charts/app/values.yaml` | **The contract**: every key a service can set, with comments. Read this file first. |
| `charts/app/values.schema.json` | JSON Schema: a typo in a values key fails the render instead of being ignored |
| `charts/app/templates/` | `workload.yaml` (Deployment/StatefulSet), `resources.yaml` (Service, ConfigMaps, PVCs, NetworkPolicy, RBAC), `jobs.yaml`, `_pod.tpl` (the pod spec) |
| `charts/app/ci/*-values.yaml` | Test values rendered by `make check` |
| `charts/pg-cluster/` | A `Cluster` custom resource with roles and databases |
| `charts/homelab-lib/` | Library chart: names, labels, image, env, secure defaults |
| `.github/workflows/app-chart.yml` | Reusable workflow apps call on a tag: build the app's chart from `app` + its `values.yml` |

## What the `app` chart gives every pod
- `seccompProfile: RuntimeDefault`, `allowPrivilegeEscalation: false`, `capabilities: drop [ALL]` — merged under what a release sets ([[Pod security context]]).
- No service-account token unless `rbac.rules` / `clusterRules` are set ([[RBAC]]).
- `hostPort` only with `hostIP: global.hostIP` — the chart *refuses* to publish a port without the Tailscale address ([[hostPort and hostNetwork]]).
- `TZ` from `global.timezone`; `enableServiceLinks: false`.
- A config checksum annotation → pods restart when their config files change ([[ConfigMap and Secret]]).
- `kind: Deployment | StatefulSet | None` (None = jobs only) ([[Deployment and StatefulSet]], [[Jobs and CronJobs]]).
- `strategy: Recreate` when the pod has volumes or host ports.
- `metrics:` → Prometheus scrape annotations.
- `networkPolicy:` → raw ingress/egress rules; setting a direction denies everything else in it ([[NetworkPolicy]]).
- `jobs:` → Helm post-install/post-upgrade hooks; `cronJobs:` → scheduled.

## How it's released
A chart's `version` bump in `Chart.yaml` on `main` → CI publishes it to `oci://ghcr.io/s-toufik/charts`. homelab-infra picks it in `versions.yaml` (`charts.app`).

## Knowledge it uses
[[Helm]], [[Kubernetes]], [[Pod security context]], [[NetworkPolicy]], [[Operator]], [[CI with GitHub Actions]].
