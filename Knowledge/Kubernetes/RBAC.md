---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, security]
updated: 2026-11-08
---

# RBAC

> Role-based access control: who (a user or a pod's **service account**) may do which **verbs** (get, list, create, delete…) on which **resources** (pods, secrets…), granted by **Roles** bound to **subjects**.

## Why it matters
Every call to the Kubernetes API is authorised by RBAC. A pod with too many rights is a cluster takeover waiting for a bug. And "role" thinking is general: Keycloak's `admin` role, PostgreSQL roles, MongoDB roles all follow the same idea.

## How it works
- `Role` (in a namespace) / `ClusterRole` (cluster-wide): a list of rules `{apiGroups, resources, verbs}`.
- `RoleBinding` / `ClusterRoleBinding`: gives a role to subjects (users, groups, ServiceAccounts).
- A pod runs as a **ServiceAccount**; its token is mounted at `/var/run/secrets/kubernetes.io/serviceaccount/` — unless `automountServiceAccountToken: false`.
- `kubectl auth can-i list pods --as=system:serviceaccount:homelab:alloy` tests it.

## In our projects
- The chart mounts **no token** by default; a release gets a ServiceAccount only when it declares `rbac.rules` or `clusterRules` ([[kube-charts]]).
- **Alloy** reads nodes and pods (for discovery and cAdvisor); **Prometheus** lists pods to scrape; **kube-api** has `cluster-admin` — the one release with full power, fenced ([[Homelab security model]]).
- At the application level, `admin` is a Keycloak realm role checked by Caddy (`allowed_groups=role:admin`).

## Pitfalls we met
- Kubernetes Dashboard / Headlamp normally want a token per user; here kube-api holds one, so the UI never sees it.

## Check yourself
1. What's the difference between a Role and a ClusterRole, and when do you need the latter?
2. Why does the chart default to no service-account token?

## Go further
- [Using RBAC authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/).
- [RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/).
