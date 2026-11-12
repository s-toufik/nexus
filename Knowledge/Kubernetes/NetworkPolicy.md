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
> [!success]- Answer
> ```yaml
> apiVersion: networking.k8s.io/v1
> kind: NetworkPolicy
> metadata: { name: postgres-from-web }
> spec:
>   podSelector: { matchLabels: { app: postgres } }
>   policyTypes: [Ingress]
>   ingress:
>     - from: [{ podSelector: { matchLabels: { app: web } } }]
>       ports: [{ protocol: TCP, port: 5432 }]
> ```
> Once `postgres` is selected for Ingress, everything else is denied.
2. Why does an egress policy without a DNS rule break *everything*?
> [!success]- Answer
> Every connection starts with a name lookup. With egress restricted and no rule to `kube-dns` on port 53, lookups time out, so nothing can be reached by name, even destinations the policy allows.
3. Why use `except` for private ranges instead of listing allowed internet hosts?
> [!success]- Answer
> The internet is too big and changes too often to list what the agent may need. What must be protected is known: the cluster and the home network. Allowing the internet except private ranges fences those off without breaking ordinary fetches.

## Go further
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/).
- [NetworkPolicy editor and recipes](https://github.com/ahmetb/kubernetes-network-policy-recipes).
