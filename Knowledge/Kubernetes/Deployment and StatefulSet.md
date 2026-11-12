---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Deployment and StatefulSet

> Controllers that keep pods running. A **Deployment** runs interchangeable pods (any copy will do); a **StatefulSet** runs pods with a stable identity and their own volume each (databases).

## Why it matters
You never create pods directly — a controller does, and recreates them when they die or when you change the template. Picking the right one decides how updates, names and storage behave.

## How it works
| | Deployment | StatefulSet |
|---|---|---|
| Pod names | random (`caddy-7f9c…`) | ordered (`mongodb-0`, `mongodb-1`) |
| Volumes | shared claim, or none | one claim per pod (`volumeClaimTemplates`) that follows it |
| Updates | rolling: new pods up, old down | one at a time, in order |
| Use | stateless services | databases, brokers |

- **Rolling update** (Deployment default): start a new pod, wait until Ready, stop an old one. Zero downtime — if both can run at once.
- **Recreate**: stop all old pods, then start new ones. Needed when two copies can't coexist (same volume, same host port).
- Changing anything in the **pod template** (image, env, an annotation) triggers a rollout; `kubectl rollout restart` changes an annotation on purpose.
- `kubectl rollout status`, `rollout undo` — and Helm's own revisions on top.

## In our projects
- The `app` chart's `kind:` picks `Deployment`, `StatefulSet` (MongoDB, Kafka) or `None` (jobs only: db-migrate, backups) — [[kube-charts]].
- `strategy: Recreate` when a pod has volumes or host ports — on one node, the new pod can't get the port the old one holds.
- PostgreSQL isn't either: the CloudNativePG [[Operator]] manages its pods itself.
- `make restart R=<release>` = `rollout restart` of every Deployment/StatefulSet of a release.

## Pitfalls we met
- A rolling update that hangs: the new pod never gets Ready ([[Probes]]), so the old one stays — the deploy times out after 10 minutes, but nothing breaks.

## Check yourself
1. Why can't a pod with `hostPort: 443` roll with zero downtime on one node?
> [!success]- Answer
> A rolling update starts the new pod before stopping the old one, but the old one holds port 443 on the only node, so the new pod can't be scheduled. Hence `Recreate`: stop, then start, with a short gap.
2. What makes MongoDB a StatefulSet rather than a Deployment?
> [!success]- Answer
> It needs a stable identity and its own volume: `mongodb-0` keeps its name and its claim across restarts, and its data follows it. Deployment pods are interchangeable and would share a claim or have none.

## Go further
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).
- [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/).
