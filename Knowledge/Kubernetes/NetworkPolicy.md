---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, security, networking]
updated: 2026-11-08
---

# NetworkPolicy

> A firewall rule for pods, written as labels: "pods labelled X may receive traffic only from pods labelled Y, on port Z". Once a pod is selected by a policy for a direction, everything not allowed in that direction is denied.

## Why it matters
By default every pod can reach every other pod. If one is compromised, it can reach your database. NetworkPolicies let you shrink each pod's reach to what it needs — the network form of [[Least privilege and defence in depth|least privilege]].

## How it works
- `podSelector` picks the pods the policy protects; `policyTypes: [Ingress, Egress]`.
- `ingress.from` / `egress.to` list allowed peers: `podSelector`, `namespaceSelector`, `ipBlock` (CIDR with `except`), plus `ports`.
- **Additive**: several policies on one pod combine (union of what they allow). There's no "deny" rule — denial is the absence of an allow.
- **Egress needs DNS**: if you restrict egress, allow UDP/TCP 53 to `kube-dns` or nothing resolves.
- Enforced by the network plugin (k3s ships a policy controller with Flannel). A cluster without one ignores policies silently.

## In our projects
- The chart's `networkPolicy: { ingress, egress }` renders one policy per release ([[kube-charts]]).
- **agent-toolbox**: in from agent-runtime, MCP Inspector, Caddy, tailnet devices; out to DNS, OTel Collector, the three MCP servers, and the internet *except* private ranges — the fence in [[Homelab LLM and agent]].
- **kube-api**: in from Caddy and Headlamp only. The **MCP servers**: in from agent-toolbox only, out to their backend.
- `make verify` tests the fences from inside the pods: the toolbox must *fail* to reach PostgreSQL.

## Pitfalls we met
- Traffic from the node itself (kubelet probes, hostNetwork pods like Alloy, hostPort traffic) arrives from the node's addresses — `10.250.0.1` and the CNI gateway `10.42.0.1` had to be allowed explicitly for agent-toolbox.
- A timeout (not "refused") is the signature of a NetworkPolicy drop.

## Check yourself
1. Write a policy that lets only pods labelled `app: web` reach `postgres` on 5432.
2. Why does an egress policy without a DNS rule break *everything*?
3. Why use `except` for private ranges instead of listing allowed internet hosts?

## Go further
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/).
- [NetworkPolicy editor and recipes](https://github.com/ahmetb/kubernetes-network-policy-recipes).
