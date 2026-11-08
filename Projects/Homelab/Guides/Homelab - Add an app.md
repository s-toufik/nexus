---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Add an app

> Run a new API or app of your own on the homelab: its repository, its release, its Secrets, its route.

**Where:** on your Mac (a new repository, homelab-infra), then on the server · **All guides:** [[Homelab guides]]

## In a new repository (start from `templates/myapi-a`)
1. `devops/docker/Dockerfile` and `devops/helm/values.yml` (port, env, the Secrets it reads, probes, resources).
2. `.github/workflows/cicd.yml`: copy agent-toolbox's, change the image name and the `chart` job's `name` and `image`.
3. GitHub: [[Homelab - Set up GitHub|Set up GitHub]] → **Each app repository** (environment rule, tag `v1.0.0`, package public).

## In homelab-infra
4. If it reads Secrets: add them to `SPECS` in `scripts/secrets.sh`.
5. In `environments/versions.yaml`, under `apps`: `<appName>: 1.0.0`.
6. In `helmfile.yaml.gotmpl`, a release in its group:
   ```yaml
     - name: <app>
       inherit: [{ template: homelab }]
       chart: homelab/<app>
       version: {{ .Values.apps.<appName> }}
       labels: { group: apps }
   ```
7. `apps/<app>/values.yaml.gotmpl`: what this server adds (often nothing: copy `apps/homelab-ui/values.yaml.gotmpl`).
8. A web page behind the sign-in: a route in `gateway/caddy/Caddyfile` ([gateway/caddy/README.md](https://github.com/s-toufik/homelab-infra/blob/develop/gateway/caddy/README.md), Adding a route or a tool).
9. Commit, push.

## On the server
10. `git pull`, `make secrets` (if it reads Secrets), `make validate`, `make apply R=<app>`.
11. `make status` → `Running`; `make logs R=<app>`.

## If it needs PostgreSQL
- Give it its own user: [[Homelab - Connect to the databases#Give an app its own PostgreSQL user]].

## If it should send telemetry
- Add `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318` to its `env:`.

## Why it works
- [[Homelab change cookbook]] — the recipe, file by file.
- [[kube-charts]] · [[Reverse proxy]] · [[OpenTelemetry]]
