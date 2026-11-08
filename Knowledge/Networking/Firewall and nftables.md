---
type: concept
domain: Networking
level: intermediate
tags: [concept, networking, security, linux]
updated: 2026-11-08
---

# Firewall and nftables

> A firewall decides, packet by packet, what may enter, leave or cross a machine. **nftables** is Linux's current firewall framework: **tables** of **chains** hooked into the kernel's packet path, each a list of **rules** that match and act (`accept`, `drop`).

## Why it matters
Listening on an address doesn't mean you want everyone on that network to connect. A host firewall is the last line when a service binds more widely than intended — and Kubernetes and Tailscale write firewall rules themselves, so you must add yours without breaking theirs.

## How it works
- **Table** (`inet` = IPv4 + IPv6) → **chain** with `type filter hook input priority …; policy accept;` → rules.
- Rules match interfaces (`iifname`), ports (`tcp dport { 6443, 10250 }`), addresses (`ip daddr`), then act.
- **Priority** orders chains on the same hook; lower runs first.
- `nft list ruleset` shows everything (k3s' and Tailscale's tables too). iptables commands are translated into nftables on modern systems.

## In our projects
`/etc/homelab/k3s-lan-guard.nft`, loaded by its own `k3s-lan-guard` service *before* k3s ([[Homelab server]]):
- accept anything from `lo`, `tailscale0`, `k3s0`, `cni0`, `flannel.1`;
- drop the Kubernetes API (6443), kubelet (10250), Flannel VXLAN (8472/udp) from everywhere else — i.e. the LAN;
- drop traffic to the node address `10.250.0.1` arriving from the LAN.
It starts with `table … ; delete table …` so reloading replaces only *our* table.

## Pitfalls we met
- **Never enable Ubuntu's `nftables` service**: its default config does `flush ruleset` — every table, including k3s' and Tailscale's.
- `make validate` checks the guard has the `10.250.0.1` line (added after the first install).

## Check yourself
1. Why accept by interface first, then drop by port?
2. Why does reloading our file not touch k3s' rules?

## Go further
- [nftables wiki](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page), [quick reference](https://wiki.nftables.org/wiki-nftables/index.php/Quick_reference-nftables_in_10_minutes).
- [Arch wiki: nftables](https://wiki.archlinux.org/title/Nftables).
