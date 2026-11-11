---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Kubernetes

> **Route** `/kubernetes` · **for** admins only (role `admin`) · **reads** the Kubernetes API through `kube-api` (`/api/kube/…`) · **code** `src/app/features/kubernetes/`
> The cluster from inside the homelab: what runs, what's wrong, and admin actions (scale, restart, delete, edit YAML, logs, shell).

![[Homelab UI - Kubernetes overview.webp]]

## The overview
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Namespace | Which namespace ([[Kubernetes]]) the lists show (`homelab` holds our releases; `kube-system` holds k3s' own). |
| 2 | Kinds | Every object type, grouped: Workloads ([[Pod]]s, [[Deployment and StatefulSet|Deployment]]s, [[Deployment and StatefulSet|StatefulSet]]s, DaemonSets, CronJobs, Jobs), Network ([[Service]]s, [[NetworkPolicy\|Network policies]]), Config and storage (ConfigMaps, [[ConfigMap and Secret|Secret]]s, volume claims), Cluster (events, nodes, namespaces, volumes). |
| 3 | Node | The one node — `<server>` — its CPU and memory now, Kubernetes version (`v1.36.5+k3s1`), 16 CPUs, ~31 GiB of memory. |
| 4 | Pods | Running and ready, in every namespace (41/41). |
| 5 | Warnings in the last hour | Warning events: the first place to look when something restarts. |

![[Homelab UI - Kubernetes pod.webp]]

## A pod opened
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Pods | The kind being listed. |
| 2 | Name and namespace | `caddy-587df489c5-xj57b`: Deployment `caddy` + ReplicaSet hash `587df489c5` + a random suffix ([[Deployment and StatefulSet]]). |
| 3 | Delete · Refresh · Close | **Delete** removes this pod; its ReplicaSet makes a new one at once, so for a Deployment's pod it's a restart. Asks to confirm. |
| 4 | Tabs | **Overview**; **YAML** (the object as the API has it, editable by admins); **Logs** (the container's stdout); **Shell** (a terminal in the container); **Events** (5). |
| 5 | Labels | `app.kubernetes.io/instance=caddy`, `…/name=caddy`, `pod-template-hash=…` — what Services and NetworkPolicies select on ([[Service]], [[NetworkPolicy]]). |
| 6 | Containers | Image (`docker.io/library/caddy:2.11.7`), Ready, restarts, state *running since…*. |
| 7 | Conditions | The pod's checklist: scheduled → initialised → containers ready → Ready. A `False` here names the stuck step ([[Pod]], [[Probes]]). |
| 8 | Pods list | Every pod of the namespace, with status, ready containers, restarts, node, CPU and memory used, age. Filter by name. |
| 9 | Namespace | Switch namespace. |

## Use it to
- **Investigate a restart:** Warnings → the pod → *Events* (why: OOMKilled, probe failed, BackOff) → *Logs* (what it said before).
- **Restart one pod** (Delete) or a workload (scale / restart on the Deployment), like `make restart R=<release>`.
- **Look inside a container** with *Shell*, like `kubectl exec -it`.

Not for changes that should last: an edit here is overwritten by the next `make apply`. Change homelab-infra instead ([[Homelab change cookbook]]).

## How it works
`/api/kube/…` goes to **kube-api**, which is `kubectl proxy` in a pod (`gateway/kube-api/`): it forwards requests to the Kubernetes API with its own service account, and that account may do **everything** in the cluster (`verbs: ["*"]`), except attaching to a pod (`--reject-paths=…/attach`). So the gate is in front of it: Caddy's `admin_only` snippet asks oauth2-proxy `allowed_groups=role:admin` before any `/api/kube/…` request goes through ([[Homelab gateway and sign-in]], [[RBAC]]). The Shell tab is a WebSocket to the API's `exec` endpoint, drawn with xterm.js.

> [!warning] Why this matters
> Anyone who can reach `kube-api:8001` inside the cluster is cluster admin. Its NetworkPolicy lets in only Caddy and Headlamp, and Caddy lets in only `role:admin`. Two layers; break either and the cluster is open ([[Least privilege and defence in depth]]).

## What the real homelab showed (2026-11-11)
The one warning: `Pod/caddy-587df489c5-xj57b: Readiness probe failed: dial tcp <pod-ip>:443: connect: connection refused` at 17:21 — the probe's first try ran before Caddy opened port 443. One at start-up is normal; repeated ones mean a real problem.

## Try it
1. 👀 Pods → `caddy-…` → **Events** → you see *Scheduled, Pulled, Created, Started* and the one probe warning.
2. 👀 **YAML** → find `hostPort: 443` and the volume `tailscale` → `/run/tailscale` ([[Path - Networks you can reason about]], lesson 4).
3. ✋ **Delete** the `homelab-ui` pod → the list shows a new pod within seconds; this page reloads. (Undo: nothing — that's the point of a Deployment.)

> [!question]- Check: you delete a pod of the `postgres` cluster from here. What happens, and why is it different from homelab-ui?
> PostgreSQL's pods belong to CloudNativePG's `Cluster`, not a Deployment: the operator recreates the instance, and if it was the primary, a failover happens first. With one instance, the database is briefly unavailable ([[Operator]], [[Homelab data]]).

Back to [[Homelab UI pages]].
