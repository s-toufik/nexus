---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, networking]
updated: 2026-11-08
---

# hostPort and hostNetwork

> Two ways for a pod to use the node's own network. A **hostPort** maps one port of the node to the pod; **hostNetwork** puts the pod directly in the node's network namespace, seeing every interface.

## Why it matters
Services are reachable inside the cluster only. To let your devices in, something must listen on the machine's address. In big clusters that's a LoadBalancer or an Ingress controller; on one node, a hostPort bound to a chosen IP is the simplest, most explicit way.

## How it works
- `ports: [{ containerPort: 443, hostPort: 443, hostIP: 100.x.y.z }]`: the CNI forwards `100.x.y.z:443` on the node to the pod. Without `hostIP`, it binds **every** address of the node.
- Only one pod per node can hold a given `hostIP:hostPort` → the scheduler leaves a second one `Pending` (`didn't have free ports`).
- `hostNetwork: true`: the pod's processes listen on the node's interfaces directly; useful to observe the node's own network; dangerous because a `0.0.0.0` listener is on the LAN too.

## In our projects
- Every published port is a hostPort with `hostIP` = the Tailscale address (`global.hostIP`). The chart **refuses** to render a hostPort without it ([[kube-charts]]).
- Caddy publishes 443, 8443, 3000, 9090, …; MongoDB 27017; Kafka 9094; OTLP 4317/4318; agent-runtime 8000; agent-toolbox 8001.
- **Alloy** uses `hostNetwork` (to see the server's network traffic) and listens only on the node address `10.250.0.1:12346`.
- `make validate` checks no two releases want the same host port; `make verify` checks every listener is on the Tailscale address.

## Pitfalls we met
- hostPorts force `Recreate` updates on one node.
- A hostNetwork pod needs `dnsPolicy: ClusterFirstWithHostNet` to still resolve cluster names.
- `ss -tlnp` on the host doesn't show hostPorts at all: the CNI's portmap plugin implements them as NAT rules (`sudo iptables-save -t nat | grep CNI-HOSTPORT`), not listening sockets.

## Check yourself
1. What would happen if `hostIP` were left out for MongoDB's 27017?
2. Why does Alloy need `hostNetwork`, and what did we do to keep it off the LAN?

## Go further
- [Configuration good practices](https://kubernetes.io/blog/2025/11/25/configuration-good-practices/) — including why to avoid hostPort when you can.
- [Linux network namespaces, explained](https://lwn.net/Articles/580893/).
