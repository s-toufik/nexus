---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-12
---

# Agent runtime - Release a version

> From `develop` to a tag to the homelab: what CI publishes for each branch and tag, and how a version reaches the server.

**Where:** on your Mac and GitHub, then homelab-infra on the server · **All guides:** [[Agent runtime guides]]

## Build the image

`make docker_build` builds `agent:local`. The image listens on port 8000, reads its configuration from `/app/config`, and takes the [[Agent runtime - Configure it]] above.

On the homelab it runs as a Helm release: [`devops/helm/values.yml`](https://github.com/s-toufik/agent-runtime/blob/develop/devops/helm/values.yml) is how it runs there (env variables, Secrets it reads, port, probes, volumes). homelab-infra adds only this server's choices, in `apps/agent-runtime/values.yaml.gotmpl` (the address of its own LLM, `HOMELAB_LLM_BASE_URL`).

## What each branch and tag publishes

```text
 feature/…  ──PR──►  develop  ──PR──►  main
                        │                  │
                        └─ tag             └─ tag vX.Y.Z               a release
                           vX.Y.Z-rc.N        image toufik142/agent-runtime:X.Y.Z and :latest
                           image :X.Y.Z-rc.N  chart oci://ghcr.io/s-toufik/charts/agent-runtime:X.Y.Z
                           and :dev           deployed once homelab-infra's versions.yaml says X.Y.Z
                           (never deployed)
```

| Event | CI ([`.github/workflows/cicd.yml`](https://github.com/s-toufik/agent-runtime/blob/develop/.github/workflows/cicd.yml)) | Publishes | On the homelab |
|---|---|---|---|
| Pull request to `develop` or `main` | LINT, TYPECHECK, TEST, BUILD | nothing | nothing changes |
| Push to `develop` or `main` | the same | nothing | nothing changes |
| Tag `vX.Y.Z-rc.N` on a commit only on `develop` | the same + RELEASE TARGET + PUBLISH | image `:X.Y.Z-rc.N` and `:dev` | nothing changes |
| Tag `vX.Y.Z` on a commit of `main` | the same + RELEASE TARGET + PUBLISH + CHART | image `:X.Y.Z` and `:latest`, chart `agent-runtime:X.Y.Z` | nothing yet: deployed once homelab-infra asks for `X.Y.Z` |

- Only tags publish: `:dev` is the last pre-release, `:latest` the last release. Only tags on `main` reach the homelab; to try a pre-release there, [[Homelab - Release an app#Try a dev image]]
- RELEASE TARGET finds the branch the tag is on, the same job in every repository with this pipeline (pycraftcore and homelab-ui too). A commit on both branches counts as `main`. It refuses a tag on neither branch, a pre-release on `main` and a final version only on `develop`, and then nothing is published.

## What is deployed

The homelab runs the version in homelab-infra's [`environments/versions.yaml`](https://github.com/s-toufik/homelab-infra/blob/develop/environments/versions.yaml), `apps.agentRuntime`. On the server:

```bash
helm -n homelab list --filter '^agent-runtime$'      # CHART agent-runtime-X.Y.Z, APP VERSION X.Y.Z
kubectl -n homelab get deploy agent-runtime -o jsonpath='{.spec.template.spec.containers[0].image}'; echo
```

## Release a version

1. Merge `develop` into `main` (pull request); CI is green.
2. Tag `main`:
   ```bash
   git switch main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
3. **Actions**: RELEASE TARGET says `release`, PUBLISH and CHART are green.
4. In homelab-infra: `apps.agentRuntime: X.Y.Z` in `environments/versions.yaml`, commit, push.
5. On the server, in homelab-infra: `git pull`, `make diff R=agent-runtime`, `make apply R=agent-runtime` (raw: `helmfile -l name=agent-runtime apply`).
6. Check: the `helm list` above shows `X.Y.Z`; `make logs R=agent-runtime`.

Roll back: set the previous version in `versions.yaml` and `make apply R=agent-runtime`, or right away `make rollback R=agent-runtime` (raw: `helm -n homelab rollback agent-runtime`). The step-by-step version: [[Homelab - Release an app]] and [[Homelab - Roll back]].

It is served by [Granian](https://github.com/emmett-framework/granian), configured with `GRANIAN_*` variables in `devops/docker/Dockerfile`. Set any other Granian option the same way in your deployment, without rebuilding:

| Variable | Effect |
|---|---|
| `GRANIAN_WORKERS=2` | Two worker processes, each with its own app and container |
| `GRANIAN_WORKERS_MAX_RSS=1024` | Restarts a worker that grows above 1 GiB |

Granian's own start and stop lines keep Granian's format; everything the worker logs uses the service's format.

---

## If it goes wrong
- [[Homelab - Troubleshooting]] · undo: [[Homelab - Roll back]].

## Why it works
- [[Git flow]] · [[Homelab deployment]] · [[Semantic versioning]]
