---
type: path
track: Tours
time: ~6 h
projects: ["[[Homelab]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the homelab

> **Goal:** know the whole homelab end to end — what runs, why, how it's organised, how a change reaches it, how your other projects sit on it — and the principles that hold it together.
> **Time:** ~6 h. A complete first pass; the topic paths go deeper afterwards.
> **Before:** nothing — start here. **Then:** [[Path - Tour of Homelab UI]] · [[Path - Tour of the agent runtime]]. **All paths:** [[Paths]]

How each lesson works: **Learn** (definitions, how it works, an example from our code, a common mistake) → **Do** (👀 only looks, ✋ changes something, with its undo) → **Check** (answer before opening) → **You can now**.

## 1. What the homelab is · ~1 h

### Learn
**Definitions**
- **Homelab** — servers you run at home to host your own services and to learn operations. Ours is one laptop.
- **Platform** — the shared services other software runs on: a gateway, sign-in, databases, a message broker, observability, a model server. Applications (the UI, the agent) use them instead of each reinventing them.
- **Cluster** — the set of machines Kubernetes manages; here a single *node* (the laptop) running [[k3s]].
- **Release** — one deployed unit: a Helm chart installed with its settings, e.g. `caddy`, `postgres`, `agent-runtime`. The homelab is about 30 releases.
- **Release train** — all releases with their versions, deployed together in order by one command (`make apply`).
- **Tailnet** — your private network of devices joined by [[Tailscale]]; the only way in.

**How it works**
The homelab is a stack of layers, each giving something to the ones above:
```text
 your apps        homelab-ui · agent-runtime · agent-toolbox · your APIs
 platform         gateway (Caddy, Keycloak, oauth2-proxy) · data (PostgreSQL, MongoDB, Kafka)
                  observability (Prometheus, Loki, Tempo, Grafana) · LLM (llama-swap)
 orchestration    Kubernetes (k3s): runs, connects, heals every container
 machine          Ubuntu laptop: never sleeps, fixed node address, LAN guard, watchdogs
 network          Tailscale: private, encrypted, the only way in
```
A request from your phone travels down this stack from the network to an app; a change from your Mac travels through git, `make apply` and Kubernetes to a new pod.

**Example from our projects** — the groups of releases, as `helmfile.yaml.gotmpl` labels them and the Status page shows them:
| Group | Releases | Gives |
|---|---|---|
| platform | cnpg, reloader | the PostgreSQL operator; restarts on Secret change |
| repository | postgres, db-migrate, postgrest, mongodb, backups | data and its API |
| message-broker | kafka, kafka-ui | events |
| observability | prometheus, loki, tempo, otel-collector, alloy, exporters, grafana | the three signals |
| gateway | caddy, keycloak, oauth2-proxy, kube-api, headlamp | the front door |
| llm | llm, llm-sd, mcp-inspector, grafana-mcp, mongodb-mcp, postgres-mcp | models and MCP servers |
| apps | homelab-ui, agent-runtime, agent-toolbox | your own software |

**Common mistake** — seeing it as "a bunch of containers". It's a *system*: groups depend on each other (Keycloak on PostgreSQL, Grafana on Keycloak, the toolbox on the MCP servers). When something fails, ask "what depends on it, and what does it depend on?".

### Do
1. 👀 Open `https://<HOMELAB_DOMAIN>/status`: every container in the groups above, Ready or not.
2. 👀 Open the control center (`/`) and **Tool UIs**: the tools' own interfaces.
3. 👀 On the server: `make status` → the same pods; `make releases` → each release with its chart and version.

### Check
1. In two sentences, what is the homelab for?
> [!success]- Answer
> It runs your own projects (the UI, the agent, its tools, your APIs) on one always-on laptop, on top of the building blocks companies use: HTTPS and one sign-in, databases, events, metrics/logs/traces, local LLMs. And it's where you learn those building blocks by operating them.

2. Grafana is down. Which groups could be the cause?
> [!success]- Answer
> observability (Grafana itself, or Prometheus/Loki/Tempo behind it), gateway (Grafana signs in with Keycloak) and repository (Keycloak needs PostgreSQL). Follow the `needs:` chain.

**You can now:** name every group of the homelab and what it gives the others.

## 2. The machine and the network · ~45 min

### Learn
**Definitions**
- **Dummy interface** — a virtual network interface that exists only inside the machine; `k3s0` holds `10.250.0.1/32`, the node address that never changes.
- **hostPort** — a pod port published on the node; here always on the Tailscale IP only ([[hostPort and hostNetwork]]).
- **Watchdog** — something that resets a system that stopped responding: the hardware watchdog (fed by systemd) and our Tailscale watchdog timer.
- **LAN guard** — our nftables table that drops Kubernetes' ports arriving from the home network.

**How it works**
A laptop wants to sleep, roam between networks and save power. The server setup undoes each habit: masked sleep targets, lid ignored, no desktop, Ethernet preferred with Wi-Fi as fallback, a fixed node address on `k3s0`, the LAN guard, reboot on kernel panic, a hardware watchdog, a Tailscale watchdog, a heartbeat to an outside monitor, automatic security updates at 04:00.

**Example from our projects** — k3s' configuration on the server (`/etc/rancher/k3s/config.yaml`), read line by line:
```yaml
node-ip: 10.250.0.1
flannel-iface: k3s0
write-kubeconfig-mode: "0640"
write-kubeconfig-group: k3s-admin
secrets-encryption: true
resolv-conf: /etc/rancher/k3s/resolv.conf
disable:
  - traefik
  - servicelb
tls-san:
  - <HOMELAB_DOMAIN>
  - <tailscale-ip>
```
1. `node-ip` / `flannel-iface` — Kubernetes and the pod network use the dummy interface, so switching Ethernet ↔ Wi-Fi changes nothing for them.
2. `write-kubeconfig-*` — the admin kubeconfig is readable by group `k3s-admin`, so you run `kubectl` without `sudo`.
3. `secrets-encryption` — Secrets are encrypted in k3s' database on disk.
4. `resolv-conf` — CoreDNS forwards to one nameserver (the router); avoids the 3-nameserver limit warning.
5. `disable` — no Traefik (Caddy is the gateway) and no ServiceLB (ports are hostPorts on the Tailscale IP).
6. `tls-san` — the API server's certificate is valid for the Tailscale name and IP.

**Common mistake** — enabling Ubuntu's `nftables` service: its config starts with `flush ruleset` and wipes k3s' and Tailscale's own rules.

### Do
1. 👀 `ip -4 -br addr` → LAN (`192.168…`), Tailscale (`100.…`), `k3s0` (`10.250.0.1`), CNI (`10.42.0.1`).
2. 👀 `sudo cat /etc/rancher/k3s/config.yaml` → the file above.

### Check
1. Why can't a guest on your Wi-Fi reach the homelab?
> [!success]- Answer
> Published ports bind only to the Tailscale address; the LAN guard drops Kubernetes' ports and the node address from the LAN; nothing is forwarded on the router.

**You can now:** explain why the server stays reachable, private and alive. Deep dive: [[Homelab server]].

## 3. How a change reaches the server · ~1 h

### Learn
**Definitions**
- **Desired state** — what you declare should run (files in git); tools make reality match. The opposite of running commands by hand.
- **Chart** — a Helm package of templated Kubernetes manifests; ours: kube-charts' generic `app`, plus `pg-cluster`.
- **Values** — the settings a chart is rendered with.
- **helmfile** — the file listing every release, its chart, version, values and order (`needs:`).
- **Hook** — a command helmfile runs before (`presync`) or after (`postsync`) a release.

**How it works**
```text
Mac: edit → commit → push
server: git pull → make diff (preview) → make apply (only changed releases, in needs: order)
                                              └─► helm upgrade → Kubernetes rolls out new pods → helmfile waits for Ready
```
A setting comes from four layers, each overriding the one before: kube-charts' `app` defaults → the app's own `devops/helm/values.yml` (apps only) → `environments/global.yaml.gotmpl` (domain, Tailscale IP, timezone) → `<group>/<release>/values.yaml.gotmpl` (this server's choices).

**Example from our projects** — oauth2-proxy's entry in `helmfile.yaml.gotmpl`:
```yaml
- name: oauth2-proxy
  inherit: [{ template: homelab }]
  labels: { group: gateway }
  needs: [homelab/keycloak, homelab/caddy]
  hooks:
    - { events: [presync], showlogs: true, command: ./scripts/secrets.sh, args: [check, oauth2-proxy] }
```
1. `inherit: homelab` — namespace `homelab`, the `app` chart, and two values files: `global.yaml.gotmpl` and `gateway/oauth2-proxy/values.yaml.gotmpl` (the path built from the `group` label).
2. `labels.group` — also lets you deploy a group: `make apply G=gateway`.
3. `needs` — deployed after Keycloak and Caddy; if Keycloak fails, this one doesn't run.
4. `presync` hook — fails early if its Secret `oauth2-proxy` is missing.

**Common mistake** — editing the cluster directly (`kubectl edit`). The next `make apply` puts git's version back, and nobody knows what was changed.

### Do
1. 👀 On the server: `make diff` → empty: the server runs exactly what git says.
2. 👀 Open `environments/versions.yaml`: every chart, image and app version in one file.

### Check
1. Where would you change Loki's retention, and how does it reach Loki?
> [!success]- Answer
> In `observability/loki/config.yml` (`retention_period`), on your Mac; commit, push; on the server `git pull`, `make diff R=loki`, `make apply R=loki`. The file is read into Loki's values and mounted as a ConfigMap; its checksum changes, so the pod restarts with it.

**You can now:** say where any setting lives and the path a change takes. Deep dive: [[Homelab deployment]].

## 4. The front door and the data · ~1 h

### Learn
**Definitions**
- **Gateway / reverse proxy** — the single entry point that terminates HTTPS and routes each request to a service (Caddy).
- **Single sign-on (SSO)** — sign in once, use every tool (Keycloak as identity provider, oauth2-proxy holding the session).
- **Forward auth** — the gateway asks an auth service "is this request signed in?" before forwarding it.
- **Row-level security (RLS)** — the database filters rows per user on every query.

**How it works**
Every browser request: Caddy strips forged identity headers → asks oauth2-proxy → if signed out, Keycloak's sign-in page → a session cookie → Caddy forwards to the tool with `Remote-User`. For Tasker: Caddy adds a secret and the user → PostgREST → PostgreSQL's RLS returns only that user's rows.

**Example from our projects** — the Tasker route in `gateway/caddy/Caddyfile`:
```text
handle_path /api/tasker/* {
    reverse_proxy postgrest:3000 {
        header_up X-Gateway-Secret {$TASKER_GATEWAY_SECRET}
        header_up -Authorization
        header_up -Cookie
    }
}
```
1. `handle_path` — matches `/api/tasker/…` and strips that prefix before forwarding.
2. `X-Gateway-Secret` — a secret only Caddy holds (from Secret `tasker-gateway`); PostgREST refuses requests without it.
3. `-Authorization`, `-Cookie` — the client's credentials never reach PostgREST.

**Common mistake** — trusting a header the client could set. That's why `strip_identity` removes `Remote-User` from every incoming request before anything else.

### Check
1. Why can't someone on the tailnet call PostgREST directly and read your workflows?
> [!success]- Answer
> PostgREST runs `tasker.check_request()` before every request and refuses (403) unless `X-Gateway-Secret` matches the secret only Caddy holds; and RLS returns only rows whose `owner` is the user Caddy set.

**You can now:** explain how one sign-in protects every tool and every account's data. Deep dives: [[Homelab gateway and sign-in]] · [[Homelab data]].

## 5. Seeing inside, and the AI layer · ~1 h

### Learn
**Definitions**
- **Metrics / logs / traces** — numbers over time / events in text / one request's path across services ([[Observability]]).
- **OTLP** — the OpenTelemetry protocol apps use to send all three.
- **Model server** — a process serving a language model over an API (llama-swap in front of llama.cpp).
- **MCP server** — a service publishing tools for AI agents ([[Model Context Protocol]]).

**How it works**
Apps send OTLP to the OTel Collector → Prometheus, Loki, Tempo; Alloy collects the machine's metrics and every pod's logs; Grafana shows them linked by trace id. Alongside, `llm` serves local models, `agent-runtime` thinks, `agent-toolbox` acts — fenced by a NetworkPolicy, with read-only MCP servers for Grafana, MongoDB and PostgreSQL.

**Example from our projects** — the OTel Collector's three pipelines (`observability/otel-collector/config.yml`, condensed to one line each):
```yaml
pipelines:
  traces:  { receivers: [otlp], processors: [memory_limiter, resource, batch], exporters: [otlp/tempo] }
  metrics: { receivers: [otlp], processors: [memory_limiter, resource, batch], exporters: [otlphttp/prometheus] }
  logs:    { receivers: [otlp], processors: [memory_limiter, resource, batch], exporters: [otlphttp/loki] }
```
One receiver, the same processors (protect memory, tag `deployment.environment=homelab`, batch), one store per signal. A new app only sets `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318`.

**Common mistake** — high-cardinality metric labels (a user id): every value is a new time series, and Prometheus runs out of memory.

### Check
1. The agent was slow at 10:00. Which tool do you open first, and what do you look for?
> [!success]- Answer
> Traces (homelab-ui's Traces page or Grafana → Tempo): agent-runtime's trace around 10:00 and its slowest span (a model call? a tool?). Then that request's log lines.

**You can now:** find what the system is doing and where the agent lives in it. Deep dives: [[Homelab observability]] · [[Homelab LLM and agent]].

## 6. Running it, and the principles inside · ~45 min

### Learn
The guides are one per job ([[Homelab guides]]); `make validate` checks before a deploy, `make verify` proves after. The table is your map for the rest of the journey: each principle, where it lives here, and the path that teaches it fully.

| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Desired state, reconciled | [[Kubernetes]] | every release; pods recreated by controllers | [[Path - Containers and Kubernetes]] |
| Configuration as code, a release train | [[helmfile]], [[Helm]] | `helmfile.yaml.gotmpl`, `versions.yaml`, the `app` chart | [[Path - Shipping changes]] |
| One door, one sign-in | [[Reverse proxy]], [[Forward authentication]], [[OAuth 2.0 and OpenID Connect]] | Caddyfile, oauth2-proxy, Keycloak `sync.sh` | [[Path - The front door]] |
| Least privilege, defence in depth | [[Least privilege and defence in depth]] | NetworkPolicies, pod security, database roles, RLS | [[Path - Security and failure]] |
| Security in the data layer | [[Row-level security]] | Tasker's tables | [[Path - Data]] |
| Operators for stateful software | [[Operator]] | CloudNativePG | [[Path - Data]] |
| Three signals, linked | [[Observability]] | OTel Collector, Alloy, Prometheus, Loki, Tempo, Grafana | [[Path - Seeing inside]] |
| Private by network | [[Tailscale]], [[Firewall and nftables]] | hostPorts on the Tailscale IP, the LAN guard | [[Path - Networks you can reason about]] |
| A self-healing machine | [[systemd]] | watchdogs, timers | [[Path - Linux, Git and the server]] |

### Do
👀 `make verify` → every line ✓. Pick one line and find the check that prints it in `scripts/verify.sh`.

**Milestone:** you can give a 10-minute tour of the homelab to another engineer: what runs, why, how a change reaches it, how it's protected, and where to look when it breaks.
