---
type: architecture
project: "[[Homelab]]"
order: 2
tags: [homelab, architecture, delivery]
updated: 2026-11-12
---

# Homelab deployment

> Git says what should run; one command makes the server match. Every service is a [[Helm]] release, [[helmfile]] lists them all with their order and versions — the *release train* — and `make apply` deploys only what changed.

Previous: [[Homelab server]] · Next: [[Homelab gateway and sign-in]]

**Do it:** [[Homelab - Deploy a change]] · [[Homelab - Release an app]] · [[Homelab - Roll back]] · [[Homelab - Change a chart]] · [[Homelab - First deploy]]

## The mental model: desired state
You never "start a container" by hand. You **describe** what you want (this image, this config, these ports) in files, and a tool makes reality match. If reality drifts (a pod dies), [[Kubernetes]] repairs it. If the files change, `make apply` pushes the difference. This is *declarative* infrastructure — the most important idea in this whole project.

```text
 git (homelab-infra)      helmfile             Helm                 Kubernetes
 ───────────────────      ─────────            ────                 ──────────
 versions.yaml       ─┐   renders every        installs/upgrades    controllers make
 default.yaml         ├─► release, diffs   ─►  one release =    ─►  pods match the
 <group>/<release>/   │   against the          a set of             manifests, and
   values.yaml.gotmpl ┘   cluster              manifests            keep them so
```

## Three repositories, one release
| Repository | Holds | Published as |
|---|---|---|
| An app (homelab-ui, agent-runtime, agent-toolbox) | Code, `devops/docker/Dockerfile`, `devops/helm/values.yml` (how it runs) | On a git tag `vX.Y.Z`: image `toufik142/<app>:X.Y.Z` on Docker Hub **and** chart `oci://ghcr.io/s-toufik/charts/<app>:X.Y.Z` |
| [[kube-charts]] | The generic `app` chart, `pg-cluster`, `homelab-lib` | Charts on GHCR when their version changes |
| [[homelab-infra]] | Which version of everything runs, and this server's own settings | Nothing: the server `git pull`s it |

**Why the app's chart has the same version as its image:** one number describes a release completely. `make rollback` goes back to the previous chart *and* image at once. See [[Semantic versioning]] and [[CI with GitHub Actions]].

## The generic chart
Instead of writing a Helm chart per service, every service uses kube-charts' `app` chart. A service only says *what's different* about it — image, ports, env, probes, volumes — in a values file. The chart turns that into a Deployment (or StatefulSet), a Service, ConfigMaps, a NetworkPolicy, RBAC, Jobs and CronJobs, all with secure defaults. See [[kube-charts]].

Public charts are used where they exist and are good: CloudNativePG and Reloader (`platform` group).

## Where a setting comes from
Each layer overrides the one before:
1. **`app` chart defaults** — security context, labels, what every pod gets.
2. **The app's `devops/helm/values.yml`** — baked into its chart at release (apps only).
3. **`environments/global.yaml.gotmpl`** — `global.domain`, `global.hostIP` (the Tailscale address), `global.timezone`; it *fails* the deploy if `local.yaml` isn't a valid Tailscale name and address.
4. **`<group>/<release>/values.yaml.gotmpl`** — this server's choices. It can read `environments/*.yaml` (versions, settings) and the files beside it (`readFile "Caddyfile"`).

`.gotmpl` means helmfile renders the file with Go templates first: `{{ .Values.images.caddy }}` becomes `2.11.7`.

## The environment files
| File | Holds | In git? |
|---|---|---|
| `versions.yaml` | Every chart, image and app version — *the* release train | yes |
| `default.yaml` | Settings: timezone, LLM provider URL, retention, backup schedule, MCP write switches | yes |
| `local.yaml` | This server's Tailscale name and address (`make local` writes it) | **no** — it identifies your server |

## What `make apply` does, step by step
`make apply` runs `helmfile apply`:
1. **Reads `environments/`**; stops if `local.yaml` is missing or wrong.
2. **Renders every release** and runs `helm diff` against what's on the cluster. Unchanged releases are skipped.
3. **Deploys the changed ones in `needs:` order** (independent ones in parallel). For each:
   - a **presync hook** runs `scripts/secrets.sh check …` — fails early if a Secret it needs is missing;
   - `helm upgrade --install` applies the manifests;
   - helmfile **waits** until pods are Ready and Jobs done (`wait`, `waitForJobs`, 10 min; the LLM 60 min because models download);
   - a **postsync hook** runs where needed (PostgreSQL: wait until the cluster is Ready).
4. **Pods restart only when needed:** a config file changed (its checksum is a pod annotation, so the pod template changes) or a Secret it reads changed ([[Secrets management|Reloader]] watches them).
5. **A failure stops the train:** releases after the failed one don't run. Fix, commit, `make apply` again.

`R=<release>` limits to one release (`helmfile -l name=<release>`), `G=<group>` to a group (`-l group=<group>`).

## The `needs:` graph
```text
cnpg ─► postgres ─► db-migrate ─► postgrest
                 ├─► keycloak ─► oauth2-proxy (also needs caddy)
                 │            └► grafana (also prometheus, loki, tempo)
                 ├─► postgres-mcp ─┐
mongodb ─► mongodb-mcp ───────────┼─► agent-toolbox ─► agent-runtime (also mongodb)
grafana ─► grafana-mcp ───────────┘                └► mcp-inspector
kafka ─► kafka-ui, kafka-exporter          prometheus, loki ─► alloy, otel-collector
```
Why order matters: Keycloak can't start without its database; the agent-toolbox discovers its MCP servers' tools *at start-up*, so they must be up first.

## The commands you'll use
| Command | Does | Raw |
|---|---|---|
| `make diff [R=…]` | What would change | `helmfile diff` |
| `make apply [R=…]` | Deploy what changed | `helmfile apply` |
| `make sync R=…` | Deploy even without a change (re-runs Jobs) | `helmfile sync` |
| `make template R=…` | Print the rendered manifests | `helmfile template` |
| `make releases` | Each release's chart and app version | `helm list -A` |
| `make rollback R=…` | Previous revision | `helm rollback` |
| `make restart R=…` | Same version, new pods | `kubectl rollout restart` |
| `make validate` | Pre-flight: tools, firewall, Secrets, renders, port clashes, configs | `scripts/validate.sh` |
| `make verify` | Post-flight: every group really works | `scripts/verify.sh` |

## Releasing an app
1. Merge to `main`, tag `vX.Y.Z`, push the tag → CI publishes image and chart.
2. In homelab-infra: `apps.<app>: X.Y.Z` in `versions.yaml`, commit, push.
3. On the server: `git pull`, `make apply R=<app>`.

Pushes publish nothing; a tag `vX.Y.Z-rc.N` on `develop` publishes the image `X.Y.Z-rc.N` (and `dev`), never a chart — to try one, see [[Homelab - Release an app#Try a dev image]].

## Edge cases
- **Rebuilding under the same tag doesn't reach the server.** Helmfile caches the chart, k3s caches the image (`IfNotPresent`). Either bump the version (right way) or clear both caches — [[Homelab - Release an app#A version rebuilt under the same tag]]. This is why tags must be immutable.
- **Something deleted by hand stays deleted.** `apply` only acts on diffs between git and the *Helm release*; a pod deleted by Kubernetes comes back, but a Deployment you `kubectl delete`d needs `make sync R=…`.
- **`another operation is in progress`.** A Helm upgrade was interrupted; the release is stuck in `pending-upgrade`. `make rollback R=…`.
- **Volumes and Secrets survive `destroy`.** Uninstalling a release keeps its data (`/var/lib/rancher/k3s/storage/`). Reinstalling finds it again — and an old password in the data won't match a new Secret.
- **Hooks run on the server, not in the cluster.** `secrets.sh check` needs `kubectl` access: run `make` as a user in `k3s-admin`.

## Check yourself
1. You change one line in `observability/prometheus/prometheus.yml`. Which releases does `make apply` touch, and why does the Prometheus pod restart?
2. Why is `local.yaml` git-ignored while `versions.yaml` is committed?
3. A deploy of `keycloak` fails. What happens to `oauth2-proxy` and `grafana` in that same `make apply`?
4. Where would you set an env variable for agent-runtime that only this server needs? And one every install of it needs?

## Go further
- [helmfile docs](https://helmfile.readthedocs.io/) — environments, `needs`, hooks, templates.
- [Helm: chart hooks](https://helm.sh/docs/topics/charts_hooks/) — what runs when.
- [Kubernetes: declarative management](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/) — the desired-state idea.
- [The Twelve-Factor App: config](https://12factor.net/config) — why config lives in the environment.
