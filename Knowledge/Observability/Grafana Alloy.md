---
type: concept
domain: Observability
level: intermediate
tags: [concept, observability]
updated: 2026-11-08
---

# Grafana Alloy

> A telemetry collector that runs next to your workloads and gathers what they don't send themselves — host metrics, container metrics, log files — wired as a graph of **components** in its own config language.

## Why it matters
Apps report their own behaviour, but the machine, the containers' resource usage and the stdout of third-party images need an agent. Alloy (successor of Grafana Agent and Promtail) does all three in one process, and speaks OTLP and Prometheus too.

## How it works
- Config in "Alloy syntax" (HCL-like): `component "label" { … }`, outputs wired to inputs: `forward_to = [prometheus.remote_write.default.receiver]`.
- Typical chain: `discovery.*` (find targets) → `discovery.relabel` (shape labels) → `prometheus.scrape` / `loki.source.*` → `*.write` (send).
- `prometheus.exporter.unix` embeds node_exporter.
- A UI (`/graph`) shows the live component graph and each component's health.

## In our projects
`observability/alloy/config.alloy` ([[Homelab observability]]):
- host metrics from `/host/proc`, `/host/sys`, `/host/root` (hostPath mounts);
- cAdvisor metrics of every container, through the API server's node proxy, with its service-account token ([[RBAC]]);
- logs of every pod in `homelab` (except those annotated `homelab.io/logs: otlp`), labelled `namespace/pod/container/service_name`;
- all sent to Prometheus (remote write) and Loki.
Runs with `hostNetwork`, listening on `10.250.0.1:12346`; UI behind Caddy on `:12345`.

## Check yourself
1. Why does Alloy need `hostNetwork` and hostPath mounts, and what's the risk?
> [!success]- Answer
> `hostNetwork` lets it see the server's real network interfaces and traffic; the `/proc`, `/sys` and `/` mounts let node_exporter read the host's metrics. The risk: a compromised Alloy sees the host's files and sits on the host's network. Hence it listens only on `10.250.0.1:12346`, not on every interface.
2. Follow one log line from a pod to Loki through the components.
> [!success]- Answer
> `discovery.kubernetes "pods"` lists the pods in namespace `homelab` → `discovery.relabel "pods"` drops those annotated `homelab.io/logs: otlp` and sets the labels `namespace`, `pod`, `container`, `service_name` → `loki.source.kubernetes "pods"` reads each container's log through the Kubernetes API → `loki.write "default"` pushes it to `http://loki:3100/loki/api/v1/push`, adding `host`.

## Go further
- [Alloy docs](https://grafana.com/docs/alloy/latest/), [components reference](https://grafana.com/docs/alloy/latest/reference/components/).
