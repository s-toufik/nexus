---
type: repository
project: "[[Homelab]]"
repo: https://github.com/s-toufik/homelab-infra
language: YAML, Go templates, Bash
status: active
tags: [repository, homelab]
updated: 2026-11-08
---

# homelab-infra

> The release train: every release on the server, its version, its settings and the config files it reads, plus the `make` commands and the guides to operate it.

## Layout
| Path | What it holds |
|---|---|
| `helmfile.yaml.gotmpl` | Every release: chart, group label, `needs:`, hooks — [[helmfile]] |
| `environments/versions.yaml` | Every chart, image and app version |
| `environments/default.yaml` | Settings: timezone, LLM URL, retention, backups, MCP switches |
| `environments/global.yaml.gotmpl` | `global.*` every release gets; validates `local.yaml` |
| `environments/local.yaml` | This server's Tailscale name and IP — git-ignored, `make local` |
| `<group>/<release>/values.yaml.gotmpl` | One release's settings, and its config files beside it |
| `scripts/` | What `make` runs: `secrets.sh`, `validate.sh`, `verify.sh`, `users.sh`, `backups.sh`… |
| `Makefile` | Every command (`make help`) |
| `templates/myapi-a/` | A starting point for a new Python API |
| `devops_guide.md`, `Q&A.md` | Copied into the nexus as [[homelab-infra - DevOps guide]] and [[homelab-infra - Q&A]] |

## The one rule
Release `<release>` in group `<group>` → `<group>/<release>/values.yaml.gotmpl`. Config files next to it are pulled in with `readFile` and mounted through `configFiles:`; a checksum restarts the pod when they change.

## How it runs
Cloned on the server; every operation is `make <target>` there, as a user in `k3s-admin`. The `make` targets print their raw command in the guide, so you always know what really happens. See [[Homelab deployment]].

## Scripts worth reading
| Script | Teaches you |
|---|---|
| `secrets.sh` | Idempotent Secret creation, hidden prompts, stdin, base64 in manifests |
| `validate.sh` | Pre-flight checks: tool versions, firewall, port clashes, every config checked by its own tool (`caddy validate`, `promtool check config`, `loki -verify-config`, `otelcol validate`, `alloy fmt`), each run as a throwaway pod with the exact image version that will run it |
| `verify.sh` | Post-deploy proof: HTTPS, sign-in redirects, data paths, NetworkPolicy fences tested from inside pods |
| `users.sh` | Driving Keycloak's `kcadm.sh` inside its pod, passwords on stdin |
| `_common.sh` | Shared helpers: `k` = kubectl in namespace `homelab`, reading `local.yaml`, finding the PostgreSQL primary |

## Knowledge it uses
[[helmfile]], [[Helm]], [[Kubernetes]], [[Secrets management]], [[Reverse proxy]], [[Row-level security]], [[Database migrations]].
