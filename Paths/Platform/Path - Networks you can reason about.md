---
type: path
track: Platform
time: ~6 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Networks you can reason about

> **Goal:** follow a request from your browser to the server: addresses, names, HTTP, encryption, and what's allowed through.
> **Time:** ~6 h.
> **Before:** [[Path - Linux, Git and the server]]. **Then:** [[Path - Containers and Kubernetes]] · [[Path - The front door]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. Who can read `/etc/rancher/k3s/k3s.yaml`?
> [!success]- Answer
> root and members of `k3s-admin`.

## 1. Addresses and ranges · ~45 min
**Read:** [[IP addresses and CIDR]]

**Do:**
1. 👀 On the server: `ip -4 -br addr` → name each address: LAN (`192.168…`), Tailscale (`100.…`), node (`10.250.0.1`), CNI (`10.42.0.1`).
2. 👀 `kubectl get pods -A -o wide | head` → pod IPs in `10.42.0.0/16`; `kubectl get svc -A | head` → Service IPs in `10.43.0.0/16`.
3. Use [cidr.xyz](https://cidr.xyz/) to see `100.64.0.0/10`: first and last address.

**Check:**
1. Is `100.127.255.254` a Tailscale address? Is `100.128.0.1`?
> [!success]- Answer
> `/10` fixes the first 10 bits: `100.64.0.0` to `100.127.255.255`. So yes for the first, no for the second.

## 2. Names · ~1 h
**Read:** [[DNS]] · [[CoreDNS]]

**Do:**
1. 👀 On your Mac: `dig +short <HOMELAB_DOMAIN>` → the server's `100.x` address (MagicDNS).
2. 👀 On the server: `kubectl -n homelab exec deploy/caddy -- nslookup keycloak` → a `10.43.x.x` Service address and the full name `keycloak.homelab.svc.cluster.local`.
3. 👀 `kubectl -n kube-system get configmap coredns-custom -o yaml` → the rewrite of `<HOMELAB_DOMAIN>` to Caddy.
4. 👀 `cat /etc/rancher/k3s/resolv.conf` → one `nameserver` line: the router.

**Check:**
1. A pod and your Mac both look up `<HOMELAB_DOMAIN>`. What does each get, and why is that on purpose?
> [!success]- Answer
> Your Mac gets the server's Tailscale IP from MagicDNS. A pod gets Caddy's Service from the CoreDNS rewrite. That way pods (oauth2-proxy, Grafana) reach Keycloak at the same `https://<domain>:8443` as browsers, with a certificate that matches the name.

## 3. HTTP, by hand · ~1.5 h
**Read:** [[HTTP]] · [[REST APIs and OpenAPI]]

**Do** (from your Mac, on the tailnet):
1. 👀 `curl -s -o /dev/null -w '%{http_code}\n' https://<HOMELAB_DOMAIN>/` → `302`: not signed in, sent to sign in.
2. 👀 `curl -s -o /dev/null -w '%{http_code}\n' https://<HOMELAB_DOMAIN>/api/prometheus/api/v1/query` → `401`: APIs answer 401 instead of redirecting.
3. 👀 `curl -s http://<HOMELAB_DOMAIN>:8000/v1/models | jq` → the agent's models (no sign-in on the tailnet).
4. 👀 `curl -sv http://<HOMELAB_DOMAIN>:8000/actuator/health 2>&1 | head -20` → read every request and response line.

**Check:**
1. Why does `/` redirect but `/api/…` return 401?
> [!success]- Answer
> `/` is for browsers: a redirect to the sign-in page is useful. `/api/…` is called by homelab-ui's `fetch()`: a redirect would hand JavaScript an HTML sign-in page; a 401 lets the app react (it sends the browser to sign in).

## 4. Encryption and trust · ~1 h
**Read:** [[TLS and certificates]]

**Do:**
1. 👀 `openssl s_client -connect <HOMELAB_DOMAIN>:443 -servername <HOMELAB_DOMAIN> </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates` → your domain, Let's Encrypt, a 90-day validity.
2. In the browser, click the padlock on `https://<HOMELAB_DOMAIN>/` and find the same.

**Check:**
1. Where is TLS terminated for Grafana on `:3000`, and is the traffic between Caddy and Grafana encrypted?
> [!success]- Answer
> At Caddy, which holds the certificate. Caddy → Grafana is plain HTTP inside the cluster; the trust boundary is the gateway.

## 5. What's allowed in · ~1.5 h
**Read:** [[Tailscale]] · [[Firewall and nftables]] · [[hostPort and hostNetwork]]

**Do:**
1. 👀 On the server: `sudo iptables-save -t nat | grep CNI-HOSTPORT-DNAT | grep -- '--dport 443'` → a rule matching `-d <tailscale-ip>/32`: hostPorts are NAT rules, not listening sockets, so `ss` won't show them.
2. 👀 From a device on the home Wi-Fi *without* Tailscale: `nc -vz -w 3 <lan-ip> 443` → times out.
3. 👀 `make verify` → its check that every published port is on the Tailscale address is ✓.

**Check:**
1. Name the three things that keep a guest on your Wi-Fi out of the homelab.
> [!success]- Answer
> (1) Every published port binds only to the Tailscale address, not the LAN IP. (2) The nftables LAN guard drops Kubernetes' own ports (6443, 10250, 8472) and the node address from the LAN. (3) Nothing is forwarded on the router, so the internet can't reach it either.

**Milestone:** you can trace a request from your browser to Caddy: name, address, encryption, and why it's allowed.
