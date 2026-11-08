---
type: architecture
project: "[[Homelab]]"
order: 1
tags: [homelab, architecture, linux]
updated: 2026-11-08
---

# Homelab server

> An Ubuntu laptop, made to behave like a data-centre machine: always on, a fixed address, its Kubernetes ports hidden, and able to recover by itself.

Previous: [[Homelab]] · Next: [[Homelab deployment]]

## Why a laptop
A laptop is a server with a built-in UPS (the battery), a screen for emergencies and low power use. The price is that it was designed to *sleep, roam and save power* — exactly what a server must not do. Most of the server setup undoes those habits. Every step is in [[homelab-infra - DevOps guide]], *Prepare the server*.

## What was changed, and why
| Problem a laptop has | What we did | Concept |
|---|---|---|
| Sleeps when idle or when the lid closes | Masked the sleep targets, `HandleLidSwitch=ignore` in logind | [[systemd]] |
| Runs a desktop that eats memory | Boots to `multi-user.target` (no graphical session) | [[systemd]] |
| Switches between Ethernet and Wi-Fi, so its IP changes | Ethernet preferred, Wi-Fi as fallback; Kubernetes uses a **dummy interface** `k3s0` with a fixed `10.250.0.1/32` that never changes | [[IP addresses and CIDR]] |
| Is on a home network anyone at home can reach | An nftables table drops Kubernetes' ports (6443, 10250, 8472) arriving from the LAN; services listen only on the Tailscale address | [[Firewall and nftables]], [[Tailscale]] |
| Can freeze (kernel bug, out of memory) with nobody around | Kernel panics reboot after 10 s; a hardware **watchdog** reboots if userspace stops answering | [[systemd]] |
| Tailscale can get stuck, making the server unreachable | A watchdog timer restarts `tailscaled` after ~4 min, reboots after ~16 min (only if the internet works and uptime > 30 min) | [[systemd]] |
| Battery wears out when always at 100 % | Charge capped at 80 % | |
| You don't know when it's down | A heartbeat to an external monitor; if it stops, you get notified | |
| Security patches | Unattended upgrades, rebooting at 04:00 | |
| Internet speed problems are invisible | A speed test every 2 h, written to Grafana's *Server Health* dashboard | [[Prometheus and PromQL]] |

## The fixed node address, explained
Kubernetes remembers the node's IP address in certificates and in its database. If the laptop moves from Ethernet (`192.168.x.a`) to Wi-Fi (`192.168.x.b`), a normal k3s would break. The trick: create a **virtual network interface** that exists only inside the machine, give it an address that never changes, and tell k3s *that* is the node IP (`node-ip: 10.250.0.1`). Pods talk to the node through it; it doesn't matter which real network is up.

- `/32` means "exactly this one address" (see [[IP addresses and CIDR]]).
- Because nothing outside the machine can route to `10.250.0.1`, it's private by construction — and the LAN guard drops it anyway (`ip daddr 10.250.0.1 drop`) in case a device on the LAN tries.

## What's installed on the host, and nothing else
- **k3s** (pinned version), with its built-in Traefik and ServiceLB turned off (Caddy is the gateway), secrets encryption on — see [[k3s]].
- **Helm 4, helm-diff, helmfile** — to deploy, see [[Helm]] and [[helmfile]].
- **Tailscale** — the only way in, see [[Tailscale]].
- Docker was removed: images are built by GitHub Actions, the server only pulls them (k3s has its own container runtime, containerd).

## Where things live on the server
| What | Where |
|---|---|
| k3s settings | `/etc/rancher/k3s/config.yaml`, `registries.yaml` (Docker Hub login), `resolv.conf` (the DNS server pods use) |
| Volumes | `/var/lib/rancher/k3s/storage/` — one folder per volume |
| Backups | `/var/backups/homelab/` (root only) |
| LAN guard | `/etc/homelab/k3s-lan-guard.nft` and the `k3s-lan-guard` service |
| The repository | `~/homelab-infra` (a git clone; `git pull` then `make …`) |

## Edge cases
- **Never `systemctl enable nftables`.** Ubuntu's default nftables config starts with `flush ruleset`, which deletes the rules k3s and Tailscale installed: pods lose networking. Our table is loaded by its own service instead.
- **Two networks up = the router listed twice** as a DNS server. Linux allows 3 nameservers; Kubernetes warns (`DNSConfigForming`) every minute. Fixed by giving k3s its own `resolv.conf` — see [[CoreDNS]] and [[Homelab failure modes]].
- **The laptop reboots by itself** after a freeze. Everything must therefore come back without you: k3s starts at boot, pods restart, PostgreSQL recovers from its write-ahead log.

## Check yourself
1. Why does Kubernetes need a node IP that never changes, and how does the dummy interface give it one?
2. What would happen to the homelab if someone at home ran `curl https://<laptop-lan-ip>:6443`? And `:443`?
3. Which of the server's protections would bring it back if the kernel froze at 3 a.m.? If Tailscale crashed?

## Go further
- [k3s configuration options](https://docs.k3s.io/installation/configuration) — `node-ip`, `resolv-conf`, disabling components.
- [systemd watchdog support](https://0pointer.de/blog/projects/watchdog.html) — Lennart Poettering's explanation.
- [NetworkManager dummy interfaces](https://networkmanager.dev/docs/api/latest/nmcli.html) — `nmcli connection add type dummy`.
