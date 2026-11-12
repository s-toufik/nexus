---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes, networking]
updated: 2026-11-08
---

# Service

> A stable name and address in front of a changing set of pods. Pods come and go; `http://keycloak:8080` always works.

## Why it matters
Pods get new IPs every time they're replaced. A Service gives clients one fixed virtual IP and a DNS name, and load-balances across the pods that match its **label selector**. It's how every component in the cluster finds every other.

## How it works
- A Service selects pods by labels (`app.kubernetes.io/name: keycloak`) and tracks their IPs in **EndpointSlices** — only pods that are **Ready** ([[Probes]]).
- **DNS**: `<service>.<namespace>.svc.cluster.local`; inside the same namespace, just `<service>` ([[CoreDNS]]).
- **Types**: `ClusterIP` (default, internal only), `NodePort` (a port on every node), `LoadBalancer` (an external IP — needs a load-balancer provider), `ExternalName` (a DNS alias).
- `kube-proxy` (or equivalent) programs the node so traffic to the virtual IP reaches a pod.

## In our projects
- Every release gets a `ClusterIP` Service named after it — that's why configs say `postgres-rw:5432`, `loki:3100`, `otel-collector:4318`.
- Nothing uses `LoadBalancer`: ServiceLB is disabled in [[k3s]]; ports reach the outside world as [[hostPort and hostNetwork|hostPorts]] on the Tailscale address.
- CloudNativePG creates `postgres-rw` (primary), `postgres-ro`, `postgres-r`.

## Pitfalls we met
- A Service with no Ready pods behind it accepts the connection nowhere: "connection refused" or a timeout. Check `kubectl get endpointslices`.
- Kubernetes injects `<SERVICE>_PORT`-style env variables for every Service into pods; Kafka's image misreads them as settings → `enableServiceLinks: false` in the chart.

## Check yourself
1. Why does a pod that's Running but not Ready get no traffic?
> [!success]- Answer
> The Service only lists Ready pods in its EndpointSlices. Not Ready means it said it can't serve yet (starting, or a dependency missing), so traffic goes to other pods or nowhere.
2. What does `postgres-rw` resolve to, and why not use a pod's name?
> [!success]- Answer
> The Service IP of CloudNativePG's `postgres-rw`, which always points to the current primary. A pod name changes on failover or replacement, and might be a replica that refuses writes.

## Go further
- [Service](https://kubernetes.io/docs/concepts/services-networking/service/).
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/).
