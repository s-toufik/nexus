---
type: architecture
project: "[[Homelab UI]]"
order: 4
tags: [homelab-ui, architecture, delivery]
updated: 2026-11-12
---

# Homelab UI delivery

> `ng build` makes static files; a two-stage Dockerfile puts them in an unprivileged nginx image; CI checks, builds and on a tag publishes the image and a Helm chart of the same version; the homelab deploys that version.

Previous: [[Homelab UI Tasker]] · Back: [[Homelab UI]]

**Do it:** [[Homelab UI - Run, test and build]] · [[Homelab UI - Release a version]]

## The image
```text
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder   # build once, on the builder's own CPU
  npm ci && npx ng build                                    # → dist/homelab-ui/browser
FROM nginxinc/nginx-unprivileged:1.27-alpine                # the runtime: no Node at all
  COPY dist → /usr/share/nginx/html, nginx.conf; port 8080
```
- **Multi-stage**: the final image has nginx and static files only — small, few vulnerabilities ([[Container image]]).
- **`--platform=$BUILDPLATFORM`**: static files are the same for every CPU, so they're built once natively, then copied into an `amd64` and an `arm64` nginx. A plain `docker build` on an Apple-silicon Mac would make an arm64-only image that fails on the x86 server with `exec format error`.
- **Unprivileged nginx** listens on 8080 as uid 101; the chart adds `readOnlyRootFilesystem` and an `emptyDir` for `/tmp` ([[Pod security context]]).

## CI
`.github/workflows/cicd.yml`: LINT (prettier) → TYPECHECK (`tsc`) → TEST (vitest via `ng test`) → BUILD (image, not pushed); only tags publish: a tag `vX.Y.Z-rc.N` on `develop` pushes `X.Y.Z-rc.N` and `dev`, a tag `vX.Y.Z` on `main` pushes `X.Y.Z` and `latest`, then CHART (kube-charts' reusable workflow bakes `devops/helm/values.yml` into a chart) ([[CI with GitHub Actions]], [[Git flow]]).

## How it runs on the homelab
`devops/helm/values.yml`: one replica, port 8080, readiness and liveness on `/`, 10m CPU / 128 Mi. Caddy serves it on `/` behind the sign-in; it can scale out because it has no volume and no host port.

## Edge cases
- **Same tag rebuilt** → old UI served (image cache, chart cache) — [[Homelab - Release an app#A version rebuilt under the same tag]].
- **Browser cache**: after a deploy, Cmd+Shift+R.

## Check yourself
1. Why does the final image contain no Node.js?
2. What does `$BUILDPLATFORM` change for an image built on a Mac?

## Go further
- [Docker: multi-platform builds](https://docs.docker.com/build/building/multi-platform/).
- [Angular: deployment](https://angular.dev/tools/cli/deployment).
