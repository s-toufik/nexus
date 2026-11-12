---
type: concept
domain: Kubernetes
level: beginner
tags: [concept, kubernetes]
updated: 2026-11-08
---

# k3s

> A complete, certified Kubernetes in one small binary, made for single machines and small clusters: same API, same objects, far less memory and setup.

## Why it matters
Full Kubernetes (kubeadm) needs several components to install, upgrade and secure. k3s packs them into one process with sensible defaults, so a laptop can run a real cluster — and everything you learn transfers to big clusters, because the API is the same.

## How it works
- One `k3s server` process runs the API server, scheduler, controllers and kubelet; containerd is built in.
- **Bundled extras** (each can be disabled): CoreDNS ([[CoreDNS]]), Traefik (ingress), ServiceLB (LoadBalancer Services on the node), local-path-provisioner (volumes as folders), metrics-server (`kubectl top`), Flannel (pod network).
- **Config** in `/etc/rancher/k3s/config.yaml`: every CLI flag as a YAML key.
- **Kubeconfig** at `/etc/rancher/k3s/k3s.yaml` — who can read it is admin.
- **Upgrades**: re-run the installer with a new `INSTALL_K3S_VERSION`.

## In our projects
`config.yaml` on the server sets `node-ip: 10.250.0.1` and `flannel-iface: k3s0` (the dummy interface, [[Homelab server]]), `secrets-encryption: true`, `resolv-conf:` (its own DNS file), disables `traefik` and `servicelb` (Caddy is the gateway, ports are hostPorts), adds the Tailscale name and IP to the API certificate (`tls-san`), and makes the kubeconfig readable by group `k3s-admin`. The version is pinned (`v1.36.5+k3s1`).

## Pitfalls we met
- Changing `config.yaml` needs `sudo systemctl restart k3s`; pods keep running during it.
- Images are cached by k3s' containerd: `sudo k3s crictl images` / `rmi` to inspect or remove one.

## Check yourself
1. Which bundled k3s components did we disable, and what replaces each?
> [!success]- Answer
> Traefik, the ingress controller: Caddy is the gateway instead. ServiceLB, which gives LoadBalancer Services an address on the node: ports are published as hostPorts on the Tailscale address instead.
2. Why must `node-ip` be stable?
> [!success]- Answer
> Kubernetes records the node's IP in its certificates and its database, and pods reach the node through it. If it changed, when the laptop moves from Ethernet to Wi-Fi, k3s would break. The dummy interface `k3s0` gives `10.250.0.1`, which never changes.

## Go further
- [k3s docs](https://docs.k3s.io/) — start with [Architecture](https://docs.k3s.io/architecture).
- [k3s configuration](https://docs.k3s.io/installation/configuration).
- [k3s secrets encryption](https://docs.k3s.io/security/secrets-encryption).
