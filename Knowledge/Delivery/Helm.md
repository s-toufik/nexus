---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, kubernetes]
updated: 2026-11-08
---

# Helm

> The package manager for Kubernetes. A **chart** is a folder of templated Kubernetes manifests plus default **values**; installing it with your values creates a **release**, which Helm can upgrade, inspect and roll back.

## Why it matters
Raw YAML doesn't scale: the same 200 lines repeated per service, with a few values changed. Helm turns that into one template and many small values files, and tracks every install as a numbered revision you can return to.

## How it works
- **Chart**: `Chart.yaml` (name, version, appVersion), `values.yaml` (defaults), `templates/*.yaml` (Go templates + [Sprig](https://masterminds.github.io/sprig/) functions), optional `values.schema.json`.
- **Render**: values (defaults ← your files ← `--set`) are merged, templates rendered into manifests, sent to the API.
- **Release**: an installed chart with a name and a namespace; each upgrade is a **revision** stored as a Secret in the namespace. `helm history`, `helm rollback <rel> <rev>`.
- **Hooks**: Jobs annotated `helm.sh/hook: post-install,post-upgrade` run at those moments ([[Jobs and CronJobs]]).
- **Library charts** hold shared templates (`define`/`include`), never installed alone.
- **OCI registries**: `helm install x oci://ghcr.io/s-toufik/charts/app --version 0.3.0`.
- **helm-diff** plugin: shows what an upgrade would change.

## In our projects
- kube-charts holds `app`, `pg-cluster`, `homelab-lib` ([[kube-charts]]).
- Each app's CI publishes a chart named after it: `app` + the app's `values.yml` baked in.
- You use Helm through [[helmfile]]; `make releases` = `helm list -A`, `make rollback R=…` = `helm rollback`.

## Pitfalls we met
- `another operation (install/upgrade/rollback) is in progress`: an interrupted upgrade leaves the release `pending-upgrade`; roll back.
- Templates with `{{ }}` in data (Grafana dashboards) must not be re-rendered: the chart's `configFiles.template` is off by default.
- A values typo is silently ignored without a schema — `values.schema.json` makes it an error.

## Check yourself
1. What's the difference between a chart's `version` and `appVersion`?
> [!success]- Answer
> `version` is the chart's own version: it changes when the templates or defaults change. `appVersion` is the version of the application the chart deploys, usually the image tag. They move independently.
2. Where does Helm keep a release's history, and what does `rollback` actually re-apply?
> [!success]- Answer
> In the release's namespace, as one Secret per revision (`sh.helm.release.v1.<name>.v<N>`), holding the rendered manifests and values. `rollback` re-applies that old revision's manifests as a new revision; it doesn't touch data in volumes or databases.

## Go further
- [Using Helm](https://helm.sh/docs/intro/using_helm/), [Charts](https://helm.sh/docs/topics/charts/), [Chart template guide](https://helm.sh/docs/chart_template_guide/).
- [Chart hooks](https://helm.sh/docs/topics/charts_hooks/).
- [helm-diff](https://github.com/databus23/helm-diff).
