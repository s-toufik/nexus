---
type: concept
domain: Networking
level: beginner
tags: [concept, networking, dns]
updated: 2026-11-08
---

# DNS

> The internet's phone book: it turns names (`grafana.example.com`) into addresses (`100.101.102.103`). A **resolver** asks on your behalf, following delegations from the root down to the server **authoritative** for the name.

## Why it matters
Every connection begins with a lookup, and *who answers* can differ by where you ask from — your Mac, a pod, the server. Many "it works here but not there" bugs are DNS answering differently in two places.

## How it works
- **Records**: `A` (IPv4), `AAAA` (IPv6), `CNAME` (alias), `TXT`, `MX`, `SRV`…
- **Resolution**: client → its configured resolver (`/etc/resolv.conf`) → root → `.net` → `ts.net` → the authoritative answer, **cached** for its **TTL**.
- **Search domains** expand short names (`keycloak` → `keycloak.homelab.svc.cluster.local`).
- **Split-horizon DNS**: the same name gets different answers inside and outside a network — on purpose.
- Tools: `dig +short name`, `nslookup`, `resolvectl query name`.

## In our projects
Three DNS worlds meet:
| Where | Who answers `<machine>.<tailnet>.ts.net` |
|---|---|
| Your devices | Tailscale's **MagicDNS** → the server's Tailscale IP |
| Pods | [[CoreDNS]], rewritten → Caddy's Service (split horizon) |
| Other names from pods | CoreDNS forwards to the router (k3s' `resolv.conf`) |

## Pitfalls we met
- Linux uses at most 3 `nameserver` lines; more → Kubernetes' `DNSConfigForming` warning.
- Caches: after a change, old answers live until their TTL ends.

## Check yourself
1. Why does a pod get a different answer than your Mac for the server's name — and why is that what we want?
> [!success]- Answer
> Your Mac asks Tailscale's MagicDNS, which answers the server's Tailscale IP. A pod asks CoreDNS, whose rewrite answers Caddy's Service IP. That's split horizon on purpose: pods reach Caddy inside the cluster, under the same name and certificate as your browser, without leaving the cluster.
2. What's a TTL, and why does it matter when you move a service?
> [!success]- Answer
> Time to live: how long a resolver may cache an answer. When you move a service to a new address, clients keep the old one until their cached copy expires, so lower the TTL before a move.

## Go further
- [How DNS works (comic)](https://howdns.works/).
- [Cloudflare: what is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Julia Evans: DNS zine](https://wizardzines.com/zines/dns/).
