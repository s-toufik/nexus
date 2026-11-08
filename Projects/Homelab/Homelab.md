---
type: project
status: active
started: 2026-10-30
repos: [homelab-infra, kube-charts, homelab-ui, agent-runtime, agent-toolbox]
tags: [project, homelab, kubernetes]
updated: 2026-11-08
---

# Homelab

> One laptop turned into an always-on server that runs a small company's worth of platform: HTTPS and one sign-in in front of every tool, databases, Kafka, metrics, logs and traces, local LLMs and an AI agent — all on Kubernetes, all deployed by one command, all reachable only from your own devices.

## In one picture
![[Homelab.canvas]]

## Why it exists
- **To run your own projects** (Tasker, the agent, future APIs) on infrastructure you own, with the same building blocks companies use.
- **To learn by operating it.** Every piece here is something a senior engineer is expected to understand: a gateway, single sign-on, an operator-managed database, an observability pipeline, network isolation, a release process. Running them yourself is the fastest way to really know them.

## What it does, in five sentences
1. Your browser, on any device in your [[Tailscale]] network, opens `https://<domain>/`.
2. [[Reverse proxy|Caddy]], the gateway, asks [[Forward authentication|oauth2-proxy]] whether you're signed in; if not, [[OAuth 2.0 and OpenID Connect|Keycloak]] shows the sign-in page once for every tool.
3. Behind the gateway run homelab-ui (the control center), Grafana, Prometheus, Kafka UI, the LLM playground and the agent's API, each in its own [[Pod]].
4. The data lives in PostgreSQL (run by the [[Operator|CloudNativePG operator]]) and [[MongoDB]], with every night a [[Backups and restores|backup]] outside the cluster; events go through [[Kafka]].
5. Everything reports metrics, logs and traces to Prometheus, Loki and Tempo through [[OpenTelemetry]] and [[Grafana Alloy|Alloy]], and Grafana shows them linked together.

## How it's built
| Part | Repository | Role |
|---|---|---|
| The release train | [[homelab-infra]] | Every release, its settings and its version; the `make` commands; the guides |
| The charts | [[kube-charts]] | The generic `app` [[Helm]] chart every service runs on, and `pg-cluster` for PostgreSQL |
| The front door | homelab-ui | Angular control center: status, every tool as a page, the agent beside every page, Tasker |
| The agent | agent-runtime, agent-toolbox | The AI agent and its tools ([[Model Context Protocol|MCP]]), fenced off by [[NetworkPolicy]] |

The platform runs on [[k3s]], a small [[Kubernetes]]. Every service is a Helm release; [[helmfile]] deploys them together, in order — the *release train*.

## Read it in this order
The architecture notes walk through the homelab one layer at a time. Each links the concepts it needs; read those when a word is new.

1. [[Homelab server]] — the machine: why a laptop, how it never sleeps, survives network changes and freezes.
2. [[Homelab deployment]] — how a change goes from git to a running pod: the release train, the settings layers, `make apply` step by step.
3. [[Homelab gateway and sign-in]] — one request, from the browser to a pod and back, and how single sign-on works.
4. [[Homelab data]] — PostgreSQL, row-level security, MongoDB, migrations, backups.
5. [[Homelab observability]] — how a metric, a log line and a trace reach Grafana.
6. [[Homelab LLM and agent]] — local models, the agent, its tools and its fence.
7. [[Homelab security model]] — every layer of defence, and what each one stops.
8. [[Homelab failure modes]] — what breaks, why, and how to tell. The edge cases.
9. [[Homelab change cookbook]] — to change X, edit Y, then run Z.

Then [[Decisions]] — why it's built this way and what was turned down — and the learning path [[Homelab from zero to senior]].

## Knowledge it uses
- **Kubernetes:** [[Kubernetes]], [[k3s]], [[Pod]], [[Deployment and StatefulSet]], [[Service]], [[ConfigMap and Secret]], [[Volumes]], [[Probes]], [[Jobs and CronJobs]], [[NetworkPolicy]], [[RBAC]], [[Pod security context]], [[hostPort and hostNetwork]], [[Operator]], [[CoreDNS]]
- **Delivery:** [[Container image]], [[Helm]], [[helmfile]], [[Semantic versioning]], [[CI with GitHub Actions]]
- **Networking:** [[DNS]], [[TLS and certificates]], [[Reverse proxy]], [[Tailscale]], [[Firewall and nftables]], [[IP addresses and CIDR]]
- **Security:** [[OAuth 2.0 and OpenID Connect]], [[Forward authentication]], [[Cookies and sessions]], [[CSRF]], [[Password hashing]], [[Secrets management]], [[Least privilege and defence in depth]]
- **Data:** [[PostgreSQL roles and privileges]], [[Row-level security]], [[Database migrations]], [[PostgREST]], [[MongoDB]], [[Kafka]], [[Backups and restores]]
- **Observability:** [[Observability]], [[Prometheus and PromQL]], [[Loki and LogQL]], [[Distributed tracing and Tempo]], [[OpenTelemetry]], [[Grafana Alloy]], [[Grafana]]
- **AI:** [[Running LLMs locally]], [[llama-swap]], [[OpenAI-compatible API]], [[Model Context Protocol]], [[AI agents and sandboxing]]
- **Linux:** [[systemd]]

## Where it stands (2026-11-08)
- **Done:** all three phases are deployed on the server: core (charts, PostgreSQL, Keycloak, oauth2-proxy, Caddy, homelab-ui), data and agent (MongoDB, Kafka, PostgREST, migrations, agent-runtime, agent-toolbox), observability, LLM and backups. homelab-ui rebuilt every tool UI natively; Headlamp is there for admins.
- **In flight:** the Grafana, MongoDB and PostgreSQL MCP servers for the agent's toolbox (written, being rolled out), `make restart`, the pod DNS fix.
- **Next:** see the latest note in [[Log]].

## Guides
[[Homelab guides]] — one guide per job, steps only: setting up the server, deploying, releasing, accounts, secrets, databases, backups, the LLM, troubleshooting. Start with:
- [[Homelab - Deploy a change]] and [[Homelab - Release an app]] — the everyday ones.
- [[Homelab - Check the homelab]] and [[Homelab - Troubleshooting]] — when something looks wrong.
- [[Homelab - Develop homelab-ui]] — working on the UI.
