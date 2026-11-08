---
type: decisions
project: "[[Homelab]]"
tags: [homelab, decisions]
updated: 2026-11-08
---

# Homelab decisions

Why the homelab is built this way, and what was turned down. Newest first. Read one, then ask yourself whether you'd choose the same today.

## 2026-11-08 — MCP servers' write access is a deployment switch
- **Context:** the agent can use Grafana, MongoDB and PostgreSQL through their MCP servers. Writing is useful sometimes, dangerous always.
- **Decision:** one switch per server, `mcp.<server>.write` (default `false`), that sets both the server's mode flag and its database account's rights.
- **Why:** two independent locks; a bug in one doesn't open the other. Changing it needs a commit, so it's deliberate and visible in history.
- **Alternatives:** read-only forever (too limiting); write always on (one prompt injection away from damage); a runtime toggle in the UI (invisible, easy to forget on).
- **Consequences:** turning write on is a deploy and a toolbox restart.

## 2026-11-07 — Headlamp for admins, through kube-api
- **Context:** a full Kubernetes dashboard was wanted; Kubernetes Dashboard was retired in January 2026.
- **Decision:** Headlamp on `:4466`, admins only, pointed at `kube-api` (a `kubectl proxy` with cluster-admin) — no token of its own.
- **Why:** one place holds the admin credentials, fenced by NetworkPolicy and the `admin` role at Caddy.
- **Alternatives:** Headlamp with its own service-account token (a second copy of admin power); only homelab-ui's own Kubernetes page (less complete).

## 2026-11-07 — Rebuild every tool UI natively in homelab-ui
- **Context:** Grafana, Kafka UI etc. each have their own look; iframes can't share the theme or the assistant panel.
- **Decision:** homelab-ui calls the tools' APIs through Caddy's `/api/<tool>/*` routes (path-allow-listed) and draws its own pages; the original UIs stay on their ports.
- **Why:** one coherent control center with the agent beside every page.
- **Consequences:** Caddy grew one allow-listed route per tool API; writes need `X-Homelab-Request` and sometimes `admin`.

## 2026-11-06 — One folder per release, grouped
- **Decision:** `<group>/<release>/values.yaml.gotmpl` with the config files it reads beside it; groups `platform`, `repository`, `message-broker`, `observability`, `gateway`, `llm`, `apps` — also helmfile labels (`make apply G=…`).
- **Why:** one rule to find any file; groups map to how you think about the system.
- **Alternatives:** a flat list (hard to navigate at 30 releases), an `ai` group (rejected: `apps` is only *your* apps).

## 2026-11-03 — MongoDB pinned to 7.0
- **Context:** MongoDB 8 refuses to start on Linux 6.19–7.0.13; the server runs 7.0.0.
- **Decision:** 7.0.x until the kernel or MongoDB changes.
- **Lesson:** upgrades have platform requirements; read release notes.

## 2026-10-30 — Greenfield on Kubernetes, no Docker Compose
- **Context:** the homelab ran on Docker Compose.
- **Decision:** stop Compose, rebuild on k3s with Helm and helmfile, no coexistence, no data migration; Docker removed from the server.
- **Why:** declarative desired state, self-healing, probes, NetworkPolicies, RBAC, operators (CloudNativePG), and the same skills as in companies.
- **Alternatives:** keep Compose (simpler, but no policies, no operators, manual ordering); full Kubernetes with kubeadm (heavy for one node); Nomad (smaller ecosystem).
- **Consequences:** more concepts to learn — that's the point.

## 2026-10-30 — k3s, pinned, without Traefik and ServiceLB
- **Why k3s:** a certified Kubernetes in one binary, low memory, built-in containerd, local-path storage, CoreDNS, metrics-server.
- **Why without Traefik:** Caddy stays the gateway — it handles Tailscale certificates natively and `forward_auth` simply.
- **Why without ServiceLB:** ports are published with `hostPort` on the Tailscale address instead of `LoadBalancer` Services that would bind every address.
- **Alternatives:** minikube / kind (dev tools, not for always-on), MicroK8s (snap-based), kubeadm (more to maintain).

## 2026-10-30 — One generic `app` chart for everything
- **Decision:** kube-charts' `app` chart runs every service; each release only sets what differs.
- **Why:** secure defaults in one place; a fix there fixes all; values files read alike.
- **Alternatives:** upstream charts per service (Bitnami etc.: each with its own conventions, often more than needed; Bitnami's free images also changed terms in 2025); a chart per app (duplication).
- **Exceptions:** CloudNativePG and Reloader (public charts are the right tool).

## 2026-10-30 — App release = git tag; image and chart share the version
- **Decision:** `vX.Y.Z` on an app → image `toufik142/<app>:X.Y.Z` and chart `ghcr.io/s-toufik/charts/<app>:X.Y.Z`; the app's `devops/helm/values.yml` is baked into its chart. The server picks a version in `versions.yaml`.
- **Why:** one number = one release; rollback is one command; the app owns how it runs, the server only adds what's local.
- **Alternatives:** `latest` tags (no rollback, no idea what runs); GitOps controller (Argo CD, Flux) — more moving parts for one server, though it's the natural next step.

## 2026-10-30 — CloudNativePG for PostgreSQL
- **Why:** declarative roles and databases (replaces hand-written provisioning scripts), password reload, TLS, metrics, a path to replicas and backups to object storage.
- **Alternatives:** a plain StatefulSet (you write the operations yourself), Bitnami chart.

## 2026-10-30 — Secrets created on the server, never in git
- **Decision:** `scripts/secrets.sh` with a `SPECS` list generates or prompts for every Secret; k3s encrypts them at rest; Reloader restarts pods on change.
- **Why:** nothing secret in the repository, which is shareable; simple for one server.
- **Alternatives:** SOPS / sealed-secrets (secrets in git, encrypted: good for teams and rebuilds), External Secrets with a vault (heavier).
- **Consequences:** a rebuilt server gets *new* secrets; data restored from backup needs its passwords re-applied.

## 2026-10-30 — Tailnet only, a fixed node IP
- **Decision:** every published port binds to the Tailscale address; Kubernetes uses `10.250.0.1` on a dummy interface; nftables keeps Kubernetes' ports off the LAN.
- **Why:** nothing exposed to the internet or the home network; Ethernet↔Wi-Fi failover doesn't break the cluster.
- **Alternatives:** expose through a reverse tunnel (Cloudflare Tunnel) — more reach, more attack surface.

## Before the move — Caddy + oauth2-proxy + Keycloak for single sign-on
- **Why:** every tool behind one sign-in without each needing OIDC support; accounts with a real password policy; Caddy's `forward_auth` keeps the gateway config readable.
- **Alternatives:** Authelia / Authentik (all-in-one, also good), each tool's own login (N passwords), basic auth (no policy, no logout).
