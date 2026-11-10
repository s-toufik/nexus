---
type: path
track: Platform
time: ~8 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Containers and Kubernetes

> **Goal:** read any pod's state and explain it; know what each Kubernetes object is for and which one to reach for.
> **Time:** ~8 h over 3–4 sessions.
> **Before:** [[Path - Linux, Git and the server]] · [[Path - Networks you can reason about]]. **Then:** [[Path - Shipping changes]] · [[Project - Follow a request]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. What does `10.43.0.0/16` hold in k3s?
> [!success]- Answer
> Service IPs (virtual addresses in front of pods). Pods are in `10.42.0.0/16`.

## 1. Containers are processes · ~1 h
**Read:** [[Containers]] · [[Container image]]

**Do:**
1. 👀 `sudo k3s crictl ps | head` → running containers; `sudo k3s crictl images | grep toufik142` → your apps' images and tags.
2. 👀 `ps -eo pid,user,comm | grep -E 'caddy|postgres|mongod'` → the same containers are host processes, under numeric users.
3. 👀 `kubectl -n homelab get pod -l app.kubernetes.io/name=homelab-ui -o jsonpath='{.items[0].status.containerStatuses[0].imageID}'; echo` → the image digest actually running.

**Check:**
1. Why is `mongod` visible in the host's `ps`, and what does that tell you about containers versus VMs?
> [!success]- Answer
> A container is a host process isolated by namespaces and cgroups; the kernel is shared, so the host sees it. A VM runs its own kernel, invisible to the host's process list.

## 2. The control loop · ~1 h
**Read:** [[Kubernetes]] · [[k3s]]

**Do:**
1. 👀 `kubectl get nodes -o wide` → one node, `INTERNAL-IP 10.250.0.1`.
2. ✋ `kubectl -n homelab delete pod -l app.kubernetes.io/name=homelab-ui`, then `kubectl -n homelab get pods -l app.kubernetes.io/name=homelab-ui -w` → a new pod appears within seconds (Ctrl-C to stop). Nothing to undo: the Deployment did it.

**Check:**
1. You deleted a pod. Who created the new one, and how did it know to?
> [!success]- Answer
> The Deployment's controller (via its ReplicaSet). It keeps comparing desired state (1 replica) with actual state (0) and creates a pod to close the gap — the reconciliation loop.

## 3. Workloads and their identity · ~1.5 h
**Read:** [[Pod]] · [[Deployment and StatefulSet]] · [[Operator]]

**Do:**
1. 👀 `kubectl -n homelab get deploy,statefulset` → which releases are which. Why is `mongodb` a StatefulSet?
2. 👀 `kubectl -n homelab get clusters.postgresql.cnpg.io` → PostgreSQL isn't either: an operator runs it.
3. 👀 `make top` → memory per pod; compare with the limits table in [[homelab-infra]].
4. 👀 `kubectl -n homelab describe pod -l app.kubernetes.io/name=keycloak | sed -n '/Limits/,/Requests/p'` → its limit and request.

**Check:**
1. A pod shows `OOMKilled` in `describe`. What happened and what do you change?
> [!success]- Answer
> The container exceeded its memory **limit** (a cgroup limit) and the kernel killed it. Either fix a leak or raise `resources.limits.memory` in its values file, then `make apply R=<release>`.

## 4. Finding each other: Services and DNS · ~45 min
**Read:** [[Service]]

**Do:**
1. 👀 `kubectl -n homelab get svc postgres-rw keycloak` and `kubectl -n homelab get endpointslices -l kubernetes.io/service-name=keycloak` → the Service and the pod IP behind it.

**Check:**
1. A pod is `Running` but `0/1` Ready. Does its Service send it traffic?
> [!success]- Answer
> No. Only Ready pods are listed in the Service's endpoints.

## 5. Config, secrets and data · ~1.5 h
**Read:** [[ConfigMap and Secret]] · [[Volumes]] · [[YAML and templating]]

**Do:**
1. 👀 `kubectl -n homelab get configmap | head` and `kubectl -n homelab get configmap caddy-caddyfile -o yaml | head -30` → the Caddyfile from git, mounted as a file.
2. 👀 `make secrets-list` → every Secret and its keys, no values.
3. 👀 `kubectl -n homelab get pvc` and `sudo ls /var/lib/rancher/k3s/storage/ | head` → each volume is a folder on the disk.

**Check:**
1. You change the Caddyfile in git and apply. Why does the Caddy pod restart, when Kubernetes doesn't restart pods on ConfigMap changes?
> [!success]- Answer
> The `app` chart puts a checksum of the config files in a pod-template annotation. A changed file changes the checksum, so the pod template changes, so the Deployment rolls out a new pod.

## 6. Health and tasks · ~1.5 h
**Read:** [[Probes]] · [[Jobs and CronJobs]]

**Do:**
1. 👀 `kubectl -n homelab get pod -l app.kubernetes.io/name=keycloak -o yaml | grep -A4 -E 'startupProbe|readinessProbe|livenessProbe'` → three probes on port 9000.
2. 👀 `kubectl -n homelab get jobs,cronjobs` → `keycloak-sync`, `db-migrate-migrate`, the two backup CronJobs.
3. 👀 `kubectl -n homelab logs job/keycloak-sync | tail -5` → `keycloak sync done`.

**Check:**
1. Why should a liveness probe never check the database?
> [!success]- Answer
> If the database blips, every pod's liveness fails and Kubernetes restarts them all — making an outage worse. Dependencies belong in readiness (stop sending traffic), not liveness (restart).

**Milestone:** given `make status`, you can say what each state means and the next command to run ([[Homelab failure modes]]).
