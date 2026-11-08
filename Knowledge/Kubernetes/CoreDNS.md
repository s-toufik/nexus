---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, networking, dns]
updated: 2026-11-08
---

# CoreDNS

> The cluster's DNS server: it answers names like `keycloak.homelab.svc.cluster.local` with Service IPs, and forwards every other name to an upstream resolver.

## Why it matters
Every connection between services starts with a DNS lookup. When DNS is wrong, everything fails in confusing ways — timeouts, wrong certificates, sign-in loops. Knowing who answers what is half of network debugging ([[DNS]]).

## How it works
- Each pod's `/etc/resolv.conf` points to CoreDNS' Service, with **search domains** (`homelab.svc.cluster.local`, `svc.cluster.local`, …) so `keycloak` expands to the full name.
- CoreDNS answers cluster names itself (the `kubernetes` plugin) and `forward`s the rest to the upstream servers it read from the node's resolv.conf (or the file k3s' `resolv-conf` names).
- Config is a Corefile; [[k3s]] lets you add server blocks / rewrites through the `coredns-custom` ConfigMap in `kube-system`.

## In our projects
- **The rewrite:** `rewrite name exact <domain> caddy.homelab.svc.cluster.local`. Pods asking for the server's Tailscale name get Caddy's Service, so oauth2-proxy and Grafana reach Keycloak at the same `https://<domain>:8443` as browsers, with a certificate that matches. Deployed by the Caddy release ([[Homelab gateway and sign-in]]).
- **The upstream:** k3s reads `/etc/rancher/k3s/resolv.conf`, one line `nameserver <router-ip>`.

## Pitfalls we met
- **`DNSConfigForming` / `Nameserver limits were exceeded`**: with Ethernet and Wi-Fi up, the host's resolv.conf lists the router twice plus others; glibc uses at most 3 nameservers, so kubelet drops some and warns every minute. A dedicated one-line file fixes it.
- `ndots:5` in pods: names with fewer than 5 dots are tried with every search domain first — external lookups do several queries. Harmless here, a latency classic elsewhere.

## Check yourself
1. Trace what happens when oauth2-proxy resolves `<domain>`, with and without the rewrite.
2. Why did two network interfaces cause a DNS warning in Kubernetes?

## Go further
- [Customizing DNS service](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/).
- [CoreDNS manual](https://coredns.io/manual/toc/) and the [rewrite plugin](https://coredns.io/plugins/rewrite/).
- [Debugging DNS resolution](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/).
