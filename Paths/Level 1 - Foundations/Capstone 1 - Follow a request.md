---
type: path
level: 1
module: capstone
time: ~3 h
projects: ["[[Homelab]]"]
tags: [path, journey, capstone]
updated: 2026-11-10
---

# Capstone 1 - Follow a request

> **Prove Level 1:** follow one request from your phone to a pod and back, naming every layer, without notes. Then explain it to someone (or to a recording of yourself).
> Previous: [[Module 03 - Containers and Kubernetes]] · Next level: [[Module 04 - Shipping changes]]

## The task
On a blank page (Excalidraw or paper), draw what happens when you open `https://<HOMELAB_DOMAIN>/status` on your phone, already signed in. Include:
1. The name lookup on the phone, and the address it returns.
2. The TCP connection: which IP and port, through which network.
3. The TLS handshake: who presents which certificate, where it came from.
4. Which process accepts the connection on the server (hint: a hostPort NAT rule to a pod).
5. What Caddy does before forwarding (the header it removes, the question it asks, to whom).
6. The Service and pod that serve the page, and how the Service picks the pod.
7. The pages' API calls that follow (`/api/health/<name>`), and why they don't redirect.

## Check your drawing
Compare with [[Homelab gateway and sign-in]] (steps 1–4 and 10) and [[Homelab UI structure]]. For each layer you missed, reread its note.

## Prove it on the server
- `kubectl -n homelab logs deploy/caddy --tail=20` while you reload the page → your request in Caddy's log.
- `kubectl -n homelab get endpointslices -l kubernetes.io/service-name=homelab-ui` → the pod IP you drew.

## Reward
You now hold the mental model senior engineers use for every "it doesn't load" bug: name → address → port → TLS → proxy → auth → Service → pod. Write one paragraph about what surprised you in a [[Log]] entry.
