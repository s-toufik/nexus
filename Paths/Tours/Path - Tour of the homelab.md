---
type: path
track: Tours
time: ~5 h
projects: ["[[Homelab]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the homelab

> **Goal:** know the whole homelab end to end — what runs, why, how it's organised, how a change reaches it, how the other projects sit on it — and which principles hold it together.
> **Time:** ~5 h. A first pass: the topic paths go deep afterwards.
> **Before:** nothing — start here. **Then:** [[Path - Tour of Homelab UI]] · [[Path - Tour of the agent runtime]]. **All paths:** [[Paths]]

👀 = only looks. ✋ = changes something (the undo is given).

## 1. What it is, and why · ~45 min
**Read:** [[Homelab]] and its canvas.

**Do:**
1. 👀 Open `https://<HOMELAB_DOMAIN>/status`: every container, grouped Gateway, Repository, Message broker, Observability, LLM, Apps.
2. 👀 Open the control center (`/`), then **Tool UIs**: each tool's own interface.
3. 👀 On the server: `make status` → the same pods as the Status page.

**Check:**
1. In two sentences, what is the homelab for?
> [!success]- Answer
> It runs your own projects (the UI, the agent, its tools, your APIs) on one always-on laptop, with the building blocks companies use: HTTPS and one sign-in, databases, events, metrics/logs/traces, local LLMs. And it's where you learn those building blocks by operating them.

## 2. The layers, one by one · ~2 h
**Read**, in order, a first time (don't stop on details): [[Homelab server]] → [[Homelab deployment]] → [[Homelab gateway and sign-in]] → [[Homelab data]] → [[Homelab observability]] → [[Homelab LLM and agent]].

**Do:** for each note, write one line: *what this layer gives the others*.

**Check:**
1. Which layer would you look at first for each symptom: "sign-in loops", "Tasker shows nothing", "the agent is slow", "the server vanished from the tailnet"?
> [!success]- Answer
> Sign-in loops → gateway (CoreDNS rewrite, oauth2-proxy, Keycloak). Tasker empty → data (PostgREST, RLS, the gateway secret). Agent slow → LLM and agent, then observability (traces). Server gone → the server (Tailscale watchdog, freeze protection).

## 3. The repositories · ~1 h
**Read:** [[homelab-infra]] · [[kube-charts]]

**Do:**
1. 👀 In `homelab-infra`, the one rule: open `gateway/caddy/values.yaml.gotmpl` and the `Caddyfile` beside it; `observability/prometheus/values.yaml.gotmpl` and `prometheus.yml`.
2. 👀 `environments/versions.yaml`: find Caddy's version, the `app` chart's version and homelab-ui's version.
3. 👀 In `kube-charts`, skim `charts/app/values.yaml`: what every service can set.

**Check:**
1. Where is Loki's retention set, and which command applies a change to it?
> [!success]- Answer
> `observability/loki/config.yml` (`retention_period`), read into `observability/loki/values.yaml.gotmpl`; `make apply R=loki` after commit, push and `git pull` on the server.

## 4. How the other projects sit on it · ~30 min
**Read:** [[Projects]] (*How they fit*).

**Check:**
1. homelab-ui, agent-runtime and agent-toolbox have their own repositories. What does the homelab add to them when it deploys them?
> [!success]- Answer
> Only what is this server's: its domain and Tailscale address (`global`), its own overrides in `apps/<app>/values.yaml.gotmpl` (e.g. the agent's LLM provider, the toolbox's NetworkPolicy), the gateway routes, and the version to run in `versions.yaml`. How each app runs comes from its own `devops/helm/values.yml`, baked into its chart.

## 5. Running it · ~30 min
**Read:** [[Homelab guides]] (the index only) and [[Homelab change cookbook]].

**Do:** 👀 `make verify` → every group ✓. Pick one line and find the check behind it in `scripts/verify.sh`.

## 6. The principles inside
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Desired state, reconciled | [[Kubernetes]] | every release; pods recreated by controllers | [[Path - Containers and Kubernetes]] |
| Configuration as code, one release train | [[helmfile]], [[Helm]] | `helmfile.yaml.gotmpl`, `versions.yaml`, kube-charts' `app` | [[Path - Shipping changes]] |
| One door, one sign-in | [[Reverse proxy]], [[Forward authentication]], [[OAuth 2.0 and OpenID Connect]] | Caddyfile, oauth2-proxy, Keycloak `sync.sh` | [[Path - The front door]] |
| Least privilege, defence in depth | [[Least privilege and defence in depth]] | NetworkPolicies, pod security, DB roles, RLS | [[Path - Security and failure]] |
| Security in the data layer | [[Row-level security]] | Tasker's tables | [[Path - Data]] |
| Operators for stateful software | [[Operator]] | CloudNativePG | [[Path - Data]] |
| Three signals, linked | [[Observability]] | OTel Collector, Alloy, Prometheus, Loki, Tempo, Grafana | [[Path - Seeing inside]] |
| Private by network | [[Tailscale]], [[Firewall and nftables]] | hostPorts on the Tailscale IP, the LAN guard | [[Path - Networks you can reason about]] |
| Self-healing machine | [[systemd]] | watchdogs, timers | [[Path - Linux, Git and the server]] |

**Milestone:** you can give a 10-minute tour of the homelab to another engineer: what runs, why, how it changes, how it's protected.
