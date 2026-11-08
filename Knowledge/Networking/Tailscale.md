---
type: concept
domain: Networking
level: beginner
tags: [concept, networking, security]
updated: 2026-11-08
---

# Tailscale

> A private network ("tailnet") between your devices, wherever they are, built on WireGuard: each device gets a stable `100.x.y.z` address and a name, connections are encrypted end to end, and nothing needs to be open on your router.

## Why it matters
Reaching a home server from outside usually means port forwarding — exposing it to the whole internet. Tailscale flips that: only your authenticated devices can reach it at all. It's the zero-trust idea ("the network isn't trusted, identity is") made simple.

## How it works
- **WireGuard** tunnels between every pair of devices (a mesh), with keys distributed by Tailscale's coordination server; traffic goes directly peer to peer, or through a relay (DERP) if NAT blocks it.
- **Addresses** from `100.64.0.0/10` (carrier-grade NAT range, never on the public internet) ([[IP addresses and CIDR]]).
- **MagicDNS**: names `<machine>.<tailnet>.ts.net` for every device.
- **HTTPS certificates** for those names, issued through Tailscale.
- **ACLs**: rules for who may reach what inside the tailnet.

## In our projects
- The only way into the homelab. Every published port binds to the server's Tailscale IP ([[hostPort and hostNetwork]]).
- `HOMELAB_DOMAIN` *is* the server's MagicDNS name; `make local` reads it and the IP into `environments/local.yaml`; `global.yaml.gotmpl` refuses anything that doesn't look like `*.ts.net` and `100.64.0.0/10`.
- Caddy gets the certificate from `tailscaled`'s socket.
- A watchdog restarts Tailscale if it stops being `Running` ([[Homelab server]]).

## Pitfalls we met
- Without MagicDNS and HTTPS enabled in the admin console, Caddy can't get a certificate.
- Every tailnet device is trusted by the non-sign-in ports (MongoDB, Kafka, OTLP): ACLs could narrow this.

## Check yourself
1. Why is `100.64.0.0/10` a safe range for a private overlay network?
2. What does Tailscale replace that a classic home-server setup would need?

## Go further
- [How Tailscale works](https://tailscale.com/blog/how-tailscale-works).
- [MagicDNS](https://tailscale.com/kb/1081/magicdns), [HTTPS certificates](https://tailscale.com/kb/1153/enabling-https), [ACLs](https://tailscale.com/kb/1018/acls).
- [WireGuard](https://www.wireguard.com/).
