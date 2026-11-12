---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-12
---

# Homelab - Release an app

> Ship a new version of homelab-ui, agent-runtime or agent-toolbox: tag it, then point the server at it. Also: try a dev image, and pick up a build rebuilt under the same tag.

**Where:** on your Mac (the app repository, homelab-infra), then on the server · **All guides:** [[Homelab guides]]

## On your Mac, in the app repository
1. Merge to `main` what goes in the release.
2. Tag it:
   ```bash
   git tag v<X.Y.Z>
   git push origin v<X.Y.Z>
   ```
3. **Actions**: RELEASE TARGET says `release`; PUBLISH (image `toufik142/<app>:<X.Y.Z>`) and CHART (`oci://ghcr.io/s-toufik/charts/<app>:<X.Y.Z>`) are green.

## In homelab-infra
4. Set the version in `environments/versions.yaml` (`apps.homelabUi`, `apps.agentToolbox` or `apps.agentRuntime`), commit, push.

## On the server
5. `git pull`
6. `make diff R=<release>` — raw: `helmfile -l name=<release> diff`
7. `make apply R=<release>` — raw: `helmfile -l name=<release> apply`
8. `make status` → the pod is `Running`; open the app.

## A release train (several apps at once)
1. Steps 1–3 in each app repository.
2. Every new version in `environments/versions.yaml`, one commit.
3. On the server: `git pull`, `make diff`, `make apply`.

## Try a dev image

Every push to `develop` of agent-runtime (or agent-toolbox) publishes the image `toufik142/agent-runtime:dev-<commit sha>`. The homelab normally runs the version tagged `vX.Y.Z`; you can point it at a dev image instead.

1. Find the commit's full sha: the green **PUBLISH** run in the repository's **Actions**, or on your Mac `git rev-parse origin/develop`.
2. Pick how long it should stay:
   - **Just to try it** (undone by the next `make apply`):
     ```bash
     helmfile -l name=agent-runtime apply --set image.tag=dev-<sha>
     ```
   - **Until you remove it**: on your Mac, in `apps/agent-runtime/values.yaml.gotmpl`, add
     ```yaml
     image:
       tag: dev-<sha>
     ```
     commit, push; on the server `git pull`, `make apply R=agent-runtime` — raw: `helmfile -l name=agent-runtime apply`.
3. Check: `kubectl -n homelab get deploy agent-runtime -o jsonpath='{.spec.template.spec.containers[0].image}'; echo` → `toufik142/agent-runtime:dev-<sha>`; `make logs R=agent-runtime`.
4. Back to the release: remove the `image:` lines (or just `make apply R=agent-runtime` for the "just to try it" way).

- Use `dev-<sha>`, not `dev`: the server keeps an image it already has, so `:dev` would not pick up a newer push.
- Only the image changes. The chart, with the repository's `devops/helm/values.yml` (env variables, Secrets, probes), stays the one of the release. A dev build that needs a new env variable needs it in `apps/agent-runtime/values.yaml.gotmpl` too, under `env:`.
- Same for agent-toolbox: `name=agent-toolbox`, `apps/agent-toolbox/values.yaml.gotmpl`, image `toufik142/agent-toolbox:dev-<sha>`.

## A version rebuilt under the same tag

GitHub has the new build under the old version (`1.1.2` here), but the server keeps the old one in two caches: helmfile's chart cache (`Skipping refresh for chart … shared cache` in `make apply`), and k3s's images (pods pull an image only if it isn't there yet, `imagePullPolicy: IfNotPresent`). On the server, in `homelab-infra`:

1. **Forget the cached chart:** `helmfile cache cleanup`. The next deploy downloads the chart again.
2. **Remove the cached image:** `sudo k3s crictl rmi docker.io/toufik142/homelab-ui:1.1.2`. It prints `Deleted: …`; if the image is in use, do step 4, then this step and step 4 again.
3. **Deploy the downloaded chart:** `make sync R=homelab-ui` — raw: `helmfile -l name=homelab-ui sync`. It ends with `UPDATED RELEASES: homelab-ui`.
4. **Replace the pods, so they pull the image:** `make restart R=homelab-ui` — raw: `kubectl -n homelab rollout restart deploy/homelab-ui`. `make ps` shows a new homelab-ui pod.
5. **Check the pod runs the new build:**
   ```bash
   kubectl -n homelab get pod -l app.kubernetes.io/name=homelab-ui -o jsonpath='{.items[0].status.containerStatuses[0].imageID}'; echo
   ```
   The `sha256:…` digest matches the one of tag `1.1.2` on Docker Hub, or in the GitHub Actions PUBLISH log.
6. **Reload the page with Cmd+Shift+R**, so the browser drops the old UI.

- Only the code changed: steps 2, 4, 5 are enough. The chart changed too (`devops/helm/values.yml`): all of them.
- Same for agent-runtime and agent-toolbox: their release name and image (`toufik142/agent-runtime`, `toufik142/agent-toolbox`).
- Next time, tag a new version instead (`v1.1.3`, then `apps.homelabUi: 1.1.3` in `environments/versions.yaml`, `make apply R=homelab-ui`): a new number skips both caches, and `make rollback` still knows the previous build.

## If it goes wrong
- Undo: [[Homelab - Roll back]].
- `ImagePullBackOff`, chart not found: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab deployment]] — one tag, one image, one chart.
- [[Semantic versioning]] · [[Container image]] · [[CI with GitHub Actions]]
