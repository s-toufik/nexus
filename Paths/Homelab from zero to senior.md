---
type: path
domain: Platform engineering
tags: [path, homelab]
updated: 2026-11-08
---

# Homelab from zero to senior

> From "what's a pod?" to being able to operate, change, debug and defend the whole homelab — and explain every choice in it. Six stages, a few evenings each. Each step: read the note, answer its *Check yourself*, then do the practice on the real homelab.

**How to use it:** tick a step when you can answer its questions *without looking*. Practice commands marked 👀 only read; the others change something — do them when you're ready to fix what you break (that's the point).

## Stage 1 — The machine and the network
*Goal: know where the homelab physically is and how you reach it.*
- [ ] 1. [[IP addresses and CIDR]] — read every range in the homelab at a glance.
- [ ] 2. [[DNS]] — who answers which name, from where.
- [ ] 3. [[Tailscale]] — the only way in.
- [ ] 4. [[Firewall and nftables]] and [[systemd]].
- [ ] 5. [[Homelab server]].

**Practice:** 👀 `tailscale status`; 👀 `ip -4 addr show k3s0`; 👀 `sudo nft list table inet homelab_lan_guard`; 👀 `systemctl list-timers`; 👀 `journalctl -u k3s --since today | tail`.

## Stage 2 — Kubernetes
*Goal: read any pod's state and explain it.*
- [ ] 6. [[Kubernetes]] and [[k3s]].
- [ ] 7. [[Pod]], [[Deployment and StatefulSet]], [[Service]].
- [ ] 8. [[ConfigMap and Secret]], [[Volumes]], [[Probes]].
- [ ] 9. [[Jobs and CronJobs]], [[Operator]], [[CoreDNS]].

**Practice:** 👀 `make status`; 👀 `kubectl -n homelab describe pod <any>` and explain every section; 👀 `kubectl -n homelab get svc,endpointslices`; 👀 `kubectl -n homelab get pvc` then find one volume in `/var/lib/rancher/k3s/storage/`; delete the homelab-ui pod (`kubectl -n homelab delete pod -l app.kubernetes.io/name=homelab-ui`) and watch the Deployment replace it.

## Stage 3 — Shipping changes
*Goal: change anything in the homelab safely and know what happened.*
- [ ] 10. [[Container image]], [[Semantic versioning]], [[CI with GitHub Actions]].
- [ ] 11. [[Helm]], [[helmfile]].
- [ ] 12. [[Homelab deployment]], [[kube-charts]], [[homelab-infra]].
- [ ] 13. [[Homelab change cookbook]].

**Practice:** 👀 `make releases`; 👀 `make template R=caddy | less` and find the hostPorts; change Loki's retention to 31 days on a branch, `make diff R=loki` and read it (then revert); 👀 `helm -n homelab history homelab-ui`; tag a patch release of homelab-ui and deploy it.

## Stage 4 — The front door and its security
*Goal: trace a request end to end and name every security layer on its path.*
- [ ] 14. [[Reverse proxy]], [[TLS and certificates]].
- [ ] 15. [[OAuth 2.0 and OpenID Connect]], [[Forward authentication]], [[Cookies and sessions]], [[CSRF]].
- [ ] 16. [[Password hashing]], [[Secrets management]], [[Least privilege and defence in depth]].
- [ ] 17. [[RBAC]], [[Pod security context]], [[NetworkPolicy]], [[hostPort and hostNetwork]].
- [ ] 18. [[Homelab gateway and sign-in]], [[Homelab security model]].

**Practice:** in a private window, open `https://<domain>/` with the browser's network tab open and match each redirect to the 10 steps; 👀 decode the ID token at jwt.io (your own); 👀 `curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/api/prometheus/api/v1/query` without a cookie → 401; 👀 `kubectl -n homelab get networkpolicy agent-toolbox -o yaml`; 👀 `make verify` and explain three of its checks.

## Stage 5 — Data and observability
*Goal: know where every byte lives, how to get it back, and how to see what the system does.*
- [ ] 19. [[PostgreSQL roles and privileges]], [[Row-level security]], [[PostgREST]], [[Database migrations]].
- [ ] 20. [[MongoDB]], [[Kafka]], [[Backups and restores]].
- [ ] 21. [[Homelab data]].
- [ ] 22. [[Observability]], [[Prometheus and PromQL]], [[Loki and LogQL]], [[Distributed tracing and Tempo]].
- [ ] 23. [[OpenTelemetry]], [[Grafana Alloy]], [[Grafana]], [[Homelab observability]].

**Practice:** `make psql`, then `\du` and explain each role; `SET ROLE tasker_web; SELECT count(*) FROM tasker.workflows;` (0 rows — why?); 👀 `make migrate-status`; 👀 `make backups`; restore last night's `homelab` dump into a scratch database (`createdb scratch`, `pg_restore -d scratch …`) and compare; in Grafana Explore, go from a log line with a `trace_id` to its trace; write the PromQL for p95 latency of one service.

## Stage 6 — AI, failure and judgement
*Goal: operate the agent safely, debug anything, and argue the design.*
- [ ] 24. [[Running LLMs locally]], [[llama-swap]], [[OpenAI-compatible API]].
- [ ] 25. [[Model Context Protocol]], [[AI agents and sandboxing]], [[Homelab LLM and agent]].
- [ ] 26. [[Homelab failure modes]].
- [ ] 27. [[Homelab decisions]] — for each, would you decide the same? Write your answer in a [[Log]] entry.
- [ ] 28. Read [[Site Reliability Engineering]] (monitoring, SLOs, postmortems).

**Practice:** 👀 `make llm-running`; `make llm-ask Q="hello"` and watch the model load in `make logs R=llm`; in the MCP Inspector, call a `postgres_*` tool; from `make sh R=agent-toolbox`, try to reach `postgres-rw:5432` and explain the timeout; break something on purpose (e.g. `make secret-set` a wrong `pg-role-postgrest` password), find it with only `status`, `describe`, `logs`, then fix it.

## You're done when
- You can draw the [[Homelab]] canvas from memory and walk a request through it.
- For any pod state, you know the next command to run.
- You can add a new API with a database account, a route and telemetry, alone.
- You can name each security layer and what it stops — and the homelab's known limits.
- You can defend or challenge every entry in [[Homelab decisions]].
