---
type: concept
domain: Linux
level: beginner
tags: [concept, linux, containers]
updated: 2026-11-10
---

# Containers

> A container is an ordinary Linux process that the kernel *isolates*: **namespaces** give it its own view (process list, network, mounts, hostname, users), **cgroups** cap its resources (CPU, memory), and its files come from an [[Container image|image]]. Not a virtual machine: same kernel, much lighter.

## Why it matters
Every service in the homelab runs in one. Knowing they're "just processes with walls" explains why a container can see `/proc` only if mounted, why `OOMKilled` happens at a cgroup limit, why root in a container is dangerous, and what `hostNetwork` removes.

## How it works
| Kernel feature | Gives the container | Kubernetes knob |
|---|---|---|
| PID namespace | its own process tree (PID 1 = the app) | — |
| network namespace | its own interfaces and IP | `hostNetwork: true` removes it |
| mount namespace | its own filesystem (the image) | volumes, `readOnlyRootFilesystem` |
| user namespace | (optional) its own user ids | `runAsUser` |
| cgroups | CPU and memory limits | `resources.limits` |
| capabilities, seccomp | fewer powers, fewer syscalls | [[Pod security context]] |
- A **runtime** (containerd in k3s, Docker Desktop on a Mac) creates them; Kubernetes asks the runtime through the kubelet.
- PID 1 must handle signals (TERM on shutdown) — or the pod waits for the grace period before KILL.

## In our projects
- k3s' containerd runs every pod; `sudo k3s crictl ps` lists containers ([[k3s]]).
- Alloy drops the network namespace (`hostNetwork`) to see the server's traffic ([[hostPort and hostNetwork]]).
- Memory limits per release are cgroup limits ([[Pod]]).

## Check yourself
1. Why can a container use 26 GiB on a 32 GiB host only if its limit allows it?
> [!success]- Answer
> The container sees the host's memory, but its cgroup caps what it may use. Its memory limit decides, not the host's total: above the limit the kernel's OOM killer kills it (`OOMKilled`). With a 26 GiB limit it can use 26 GiB; with 3 GiB, it dies at 3.
2. What does `hostNetwork: true` give up?
> [!success]- Answer
> The network namespace: the pod uses the node's interfaces and addresses directly. It gets no IP of its own, and anything it listens on `0.0.0.0` is reachable on every network the node is on.

## Go further
- [Julia Evans: How containers work (zine)](https://wizardzines.com/zines/containers/).
- [Liz Rice: Containers from scratch (video)](https://www.youtube.com/watch?v=8fi7uSYlOdc).
