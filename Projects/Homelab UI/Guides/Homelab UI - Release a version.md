---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui]
updated: 2026-11-08
---

# Homelab UI - Release a version

> Tag a version, let CI publish the image and chart, and deploy it on the homelab.

**Where:** on your Mac, then homelab-infra on the server · **All guides:** [[Homelab UI guides]]

The server runs homelab-ui as a Helm release: the chart `oci://ghcr.io/s-toufik/charts/homelab-ui` (kube-charts' `app` chart with [`devops/helm/values.yml`](https://github.com/s-toufik/homelab-ui/blob/develop/devops/helm/values.yml) built in) and the image `toufik142/homelab-ui`, both at the version of a git tag.

1. `make check`, merge to `main`.
2. Tag the release:
   ```bash
   git tag v1.4.0
   git push origin v1.4.0
   ```
3. GitHub Actions: PUBLISH (image `1.4.0`) and CHART (chart `1.4.0`) are green.
4. In homelab-infra: `apps.homelabUi: 1.4.0` in `environments/versions.yaml`; on the server `make apply R=homelab-ui` ([[Homelab - Release an app]]).
5. Open `https://<server>/status` and reload.

Ports, probes, resources and env variables are in `devops/helm/values.yml`; the next release carries a change there to the server.

`make docker_publish` still pushes `latest` (or `TAG=…`) from a Mac for both `linux/amd64` and `linux/arm64`: built with plain `docker build` on a Mac, an image would be arm64 only and fail on an x86-64 server with `exec format error`. The Dockerfile builds the static files once on the builder's own platform (`--platform=$BUILDPLATFORM`), then copies them into an nginx image for each target.

## If it goes wrong
- Same tag rebuilt, old UI still served: [[Homelab - Release an app#A version rebuilt under the same tag]].
- Undo: [[Homelab - Roll back]].

## Why it works
- [[Homelab UI delivery]] — the image, the chart, multi-platform builds.
- [[Homelab deployment]] · [[Semantic versioning]] · [[Git flow]]
