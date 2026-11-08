---
type: concept
domain: Networking
level: beginner
tags: [concept, networking]
updated: 2026-11-08
---

# IP addresses and CIDR

> An IPv4 address is 32 bits, written `a.b.c.d`. **CIDR** notation `10.42.0.0/16` names a range: the first 16 bits are fixed, the rest vary — 65 536 addresses. Some ranges are reserved for private use and never routed on the internet.

## Why it matters
Firewalls, NetworkPolicies, Kubernetes networking and VPNs all speak CIDR. Reading `/32`, `/16`, `/10` at a glance — and knowing which ranges are private — is daily work.

## How it works
- `/32` = one address; `/24` = 256; `/16` = 65 536; `/8` = 16.7 M.
- **Private (RFC 1918)**: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` — home and company networks.
- **Carrier-grade NAT (RFC 6598)**: `100.64.0.0/10` — used by Tailscale.
- **Link-local**: `169.254.0.0/16` — includes cloud metadata servers (`169.254.169.254`), a classic attack target.
- **Loopback**: `127.0.0.0/8`.

## In our projects
| Range | What |
|---|---|
| `100.64.0.0/10` | Tailscale addresses (the server's, your devices') |
| `10.42.0.0/16` | k3s pod network (`10.42.0.1` = the CNI bridge on the node) |
| `10.43.0.0/16` | k3s Service IPs |
| `10.250.0.1/32` | The node IP on the dummy interface `k3s0` ([[Homelab server]]) |
| `192.168.x.0/24` | The home LAN (kept off Kubernetes' ports) |

The agent-toolbox fence allows `0.0.0.0/0` except `10/8`, `172.16/12`, `192.168/16`, `100.64/10`, `169.254/16`: the internet, nothing internal ([[NetworkPolicy]]).

## Check yourself
1. How many addresses in `100.64.0.0/10`? Is `100.127.255.1` inside it?
2. Why exclude `169.254.0.0/16` from an agent's internet access?

## Go further
- [CIDR on Wikipedia](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing).
- [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918), [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598).
- [cidr.xyz](https://cidr.xyz/) — an interactive CIDR calculator.
