---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Kubernetes

> A system that keeps your containers running the way you described them: you write the desired state ("3 copies of this image, with this config, reachable on this name"), and Kubernetes' controllers work non-stop to make reality match.

## Why it matters
Without it, you start containers by hand or with scripts, and when one dies, the server reboots, or you change a setting, *you* fix it. Kubernetes turns operations into data: files you can review, diff, version and re-apply. It's the standard way companies run software, so its vocabulary (pod, deployment, service) is the shared language of infrastructure.

## How it works
- **The API server** is the front door: every object (Pod, Deployment, Secret…) is a YAML/JSON document stored in a database (etcd; in k3s, SQLite or etcd).
- **Controllers** watch objects and act: the Deployment controller sees "3 replicas wanted, 2 running" and creates one. This **reconciliation loop** — observe, compare, act, repeat — is the whole idea.
- **The scheduler** picks a node for each new pod.
- **The kubelet** on each node starts the pod's containers through a container runtime (containerd) and reports their health.
- **Everything is declarative**: `kubectl apply -f` sends the desired state; you never say "start", you say "this should exist".

```text
you ── YAML ──► API server ──► etcd (desired state)
                    ▲  │
     controllers ───┘  └──► scheduler ──► kubelet on the node ──► containers
     (compare & act)                       (reports actual state back)
```

The main objects, each with its own note: [[Pod]], [[Deployment and StatefulSet]], [[Service]], [[ConfigMap and Secret]], [[Volumes]], [[Probes]], [[Jobs and CronJobs]], [[NetworkPolicy]], [[RBAC]], [[Operator]].

Objects live in **namespaces** (folders for objects); **labels** (`app.kubernetes.io/name: caddy`) tie them together — a Service finds its pods by label, not by name.

## In our projects
- [[Homelab]] runs on single-node [[k3s]]; everything is in namespace `homelab` (operators in `cnpg-system`, `reloader`).
- You rarely write raw YAML: the [[Helm]] chart `app` renders it from values ([[kube-charts]]).
- `kubectl get pods -n homelab`, `kubectl describe`, `kubectl logs` are your eyes ([[Homelab failure modes]]).

## Pitfalls we met
- Deleting a pod doesn't "stop" a service: its Deployment makes a new one. To stop, scale to 0 or uninstall the release.
- `kubectl edit` on the cluster is undone at the next deploy — change the files in git instead.

## Check yourself
1. Explain the reconciliation loop with the example of a pod that crashes.
> [!success]- Answer
> The pod's container crashes; the kubelet restarts it and reports the status. If the pod is gone (deleted, node lost), the Deployment's ReplicaSet controller observes 0 pods running against 1 wanted, creates a new pod, the scheduler places it, and the kubelet starts it. Observe, compare, act, repeat.
2. What's the difference between `kubectl create` and `kubectl apply`?
> [!success]- Answer
> `create` makes a new object and fails if it exists. `apply` sends the desired state: it creates the object, or updates it to match the file if it exists, so you can re-run it after every change.
3. How does a Service know which pods to send traffic to?
> [!success]- Answer
> By labels: its `selector` matches pod labels, and Kubernetes keeps the list of matching Ready pods' addresses (EndpointSlices) up to date.

## Go further
- [Kubernetes overview](https://kubernetes.io/docs/concepts/overview/) and [components](https://kubernetes.io/docs/concepts/overview/components/).
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) — build one by hand to see every piece.
- [[Kubernetes Up and Running]] (book, in Sources).
