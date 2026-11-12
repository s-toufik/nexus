---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Pod

> The smallest thing Kubernetes runs: one or more containers that share a network address and can share volumes, scheduled together on one node.

## Why it matters
Everything you deploy ends up as pods. Knowing what a pod is — and isn't — explains most behaviour: why pods get new IPs, why a crashed container restarts, why two containers in a pod reach each other on `localhost`.

## How it works
- A pod gets **its own IP** in the cluster's pod network (k3s: `10.42.0.0/16`). Containers inside share it; they talk over `localhost`.
- Pods are **disposable**: you don't repair a pod, its controller ([[Deployment and StatefulSet]]) replaces it. A replacement has a new name and IP — that's why you reach pods through a [[Service]].
- **Restart policy**: a crashing container is restarted in place, with growing delays → `CrashLoopBackOff`.
- **Init containers** run to completion before the main ones; **sidecars** run alongside.
- **Resources**: `requests` (what the scheduler reserves) and `limits` (the ceiling; above the memory limit the container is `OOMKilled`).
- **Lifecycle**: `Pending` → `Running` → (`Succeeded` | `Failed`); readiness decides if it gets traffic ([[Probes]]).

## In our projects
Each Homelab release normally runs one pod. `make status` lists them; `make sh R=<release>` opens a shell in one; `make top` shows CPU and memory against their limits (see the table in [[homelab-infra]]'s README).

## Pitfalls we met
- An `OOMKilled` pod looks like a crash loop; `kubectl describe pod` shows `Last State: Terminated, Reason: OOMKilled`.
- Writing to the container's file system is lost on restart — and impossible with `readOnlyRootFilesystem` ([[Pod security context]]); use [[Volumes]].

## Check yourself
1. Why shouldn't you connect to a pod by its IP?
> [!success]- Answer
> Pods are disposable: a replacement gets a new IP, so the address you saved points to nothing, or later to another pod. A Service gives a name and address that stay.
2. What's the difference between a memory request and a memory limit?
> [!success]- Answer
> The request is what the scheduler reserves on a node to place the pod. The limit is the ceiling: above it the container is `OOMKilled`.

## Go further
- [Pods](https://kubernetes.io/docs/concepts/workloads/pods/) and [pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/).
- [Resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).
