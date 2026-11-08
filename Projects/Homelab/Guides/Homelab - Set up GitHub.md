---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Set up GitHub

> Make the charts and app images public on GitHub so the server pulls them without a login. Once for kube-charts, once per app repository.

**Where:** on your Mac and on github.com; the checks on the server · **All guides:** [[Homelab guides]]

Once. Charts and images must be public, so the server pulls them without a login.

## kube-charts (on your Mac)
1. On github.com: **New repository** `kube-charts`, **Public**, nothing else.
2. ```bash
   cd ~/SandBox/kube-charts
   git init -b main
   git add .
   git commit -m "feat: homelab charts"
   git remote add origin git@github.com:s-toufik/kube-charts.git
   git push -u origin main
   ```
3. **Actions → Charts**: CHECK and PUBLISH are green.
4. [github.com/s-toufik?tab=packages](https://github.com/s-toufik?tab=packages) → `charts/app` → **Package settings → Change visibility → Public**. Same for `charts/pg-cluster`.
5. Check on the server: `helm show chart oci://ghcr.io/s-toufik/charts/app --version 0.1.0` → `name: app`.

## Each app repository: homelab-ui, agent-toolbox, agent-runtime
1. **Settings → Environments → production → Deployment branches and tags**: if it is restricted, **Add deployment branch or tag rule** → **Tag** `v*`.
2. Merge the release to `main`, then tag it (on your Mac, in the app repository):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Actions**: PUBLISH and CHART are green.
4. Packages → `charts/<app>` → **Change visibility → Public**.
5. Check on the server: `helm show chart oci://ghcr.io/s-toufik/charts/<app> --version 1.0.0` → `name: <app>`.

## If it goes wrong
- A chart not found, or `ImagePullBackOff`: [[Homelab - Troubleshooting]].

## Why it works
- [[CI with GitHub Actions]] — what PUBLISH and CHART do.
- [[kube-charts]] · [[Container image]] · [[Homelab deployment]]
