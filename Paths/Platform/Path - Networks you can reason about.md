---
type: path
track: Platform
time: ~7 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Networks you can reason about

> **Goal:** follow a request from your browser to the server — addresses, names, HTTP, encryption, and what's allowed through — and reason about any "it doesn't connect".
> **Time:** ~7 h.
> **Before:** [[Path - Linux, Git and the server]]. **Then:** [[Path - Containers and Kubernetes]] · [[Path - The front door]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Address ranges (CIDR) | Tailscale `100.64/10`, pods `10.42/16`, Services `10.43/16`, node `10.250.0.1/32`; the toolbox's egress `except` list |
| DNS, split horizon | MagicDNS for devices; CoreDNS rewrite of the domain to Caddy for pods |
| HTTP semantics | 302/401/403/406/421 you'll meet on the homelab; `/v1/stream` |
| TLS and certificates | Caddy with the Tailscale-issued certificate |
| A private network, a host firewall | Tailscale only; hostPorts on the Tailscale IP; the LAN guard |

## Warm-up (optional, from the paths before)
1. Who can read `/etc/rancher/k3s/k3s.yaml`?
> [!success]- Answer
> root and members of `k3s-admin`.

## 1. Addresses and ranges · ~1 h

### Learn
**Definitions**
- **IPv4 address** — 32 bits written as four numbers, `100.101.102.103`.
- **CIDR** — `address/prefix`: the first *prefix* bits are fixed. `/32` = one address, `/24` = 256, `/16` = 65 536, `/10` = 4 194 304.
- **Private ranges** — `10/8`, `172.16/12`, `192.168/16` (RFC 1918), `100.64/10` (carrier-grade NAT, used by Tailscale), `169.254/16` (link-local, cloud metadata).
- **Interface** — a network attachment with its addresses (`eth0`, `wlan0`, `tailscale0`, `k3s0`, `cni0`).

**How it works**
A packet's destination address picks the route and the interface. Inside the cluster there are two virtual ranges: **pod IPs** (each pod gets one) and **Service IPs** (stable virtual addresses that forward to pods).

**Example from our projects** — the toolbox may reach the internet but no internal range (`apps/agent-toolbox/values.yaml.gotmpl`):
```yaml
- to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except: [10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10, 169.254.0.0/16]
```
`0.0.0.0/0` is every IPv4 address; the `except` list removes the pod and Service networks, your LAN, the tailnet and link-local.

**Common mistake** — writing `100.64.0.0/16` for Tailscale: it covers only 65 536 of the 4 M addresses Tailscale may use.

### Do
1. 👀 On the server: `ip -4 -br addr` → name each address: LAN, Tailscale, node, CNI.
2. 👀 `kubectl get pods -A -o wide | head` (pod IPs `10.42.…`) and `kubectl get svc -A | head` (Service IPs `10.43.…`).
3. Use [cidr.xyz](https://cidr.xyz/) on `100.64.0.0/10`.

### Check
1. Is `100.127.255.254` a Tailscale address? `100.128.0.1`?
> [!success]- Answer
> `100.64.0.0/10` spans `100.64.0.0`–`100.127.255.255`: yes for the first, no for the second.

**You can now:** read any address or range on the homelab. Deep dive: [[IP addresses and CIDR]].

## 2. Names · ~1.5 h

### Learn
**Definitions**
- **DNS** — turns names into addresses; a **resolver** asks on your behalf, answers are cached for their **TTL** ([[DNS]]).
- **Record** — `A` (IPv4), `AAAA` (IPv6), `CNAME` (alias)…
- **Search domain** — suffixes tried for short names: in a pod, `keycloak` → `keycloak.homelab.svc.cluster.local`.
- **Split horizon** — the same name answered differently depending on who asks.

**How it works**
Three resolvers answer for the homelab: **MagicDNS** on your devices (the domain → the server's Tailscale IP), **CoreDNS** in the cluster (Service names → Service IPs; the domain → Caddy's Service, by our rewrite; anything else → forwarded to the router).

**Example from our projects** — the CoreDNS rewrite, deployed by the Caddy release:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns-custom
  namespace: kube-system
data:
  homelab.override: |
    rewrite name exact <HOMELAB_DOMAIN> caddy.homelab.svc.cluster.local
```
So oauth2-proxy and Grafana reach Keycloak at the *same* `https://<HOMELAB_DOMAIN>:8443` as browsers, and Caddy's certificate matches.

**Common mistake** — more than 3 nameservers on the host (Ethernet + Wi-Fi both listing the router): Linux keeps 3, Kubernetes warns `DNSConfigForming` every minute. Fixed by k3s' own one-line `resolv.conf`.

### Do
1. 👀 On your Mac: `dig +short <HOMELAB_DOMAIN>` → `100.x.y.z`.
2. 👀 `kubectl -n homelab exec deploy/caddy -- nslookup keycloak` → a `10.43.x.x` and the full name.
3. 👀 `kubectl -n kube-system get configmap coredns-custom -o yaml`; `cat /etc/rancher/k3s/resolv.conf`.

### Check
1. A pod and your Mac both look up `<HOMELAB_DOMAIN>`. What does each get, and why on purpose?
> [!success]- Answer
> Your Mac gets the server's Tailscale IP (MagicDNS); a pod gets Caddy's Service (the rewrite). Pods then reach Keycloak by the same URL as browsers, with a matching certificate — sign-in works from both sides.

**You can now:** say who answers a name, from where. Deep dive: [[CoreDNS]].

## 3. HTTP, by hand · ~1.5 h

### Learn
**Definitions**
- **Request** — method (GET, POST…), path, headers, optional body. **Response** — status code, headers, optional body ([[HTTP]]).
- **Status classes** — 2xx success, 3xx redirect, 4xx your request is wrong, 5xx the server failed.
- **Header** — a `Name: value` line: `Host`, `Cookie`, `Authorization`, `Content-Type`, `Accept`…

**How it works**
Caddy picks the site by port and `Host`, then the route by path; the gateway answers browsers and programs differently.

**Example from our projects** — the codes you'll meet and what they mean here:
| Code | When | Why |
|---|---|---|
| 302 | `GET /` signed out | redirect to the sign-in page |
| 401 | `GET /api/…` signed out | APIs don't redirect |
| 403 | a write without `X-Homelab-Request` | CSRF guard |
| 404 | a path not in a route's allow-list | `@blocked … respond 404` |
| 406 | asked JSON from an endpoint that returns text | the Kubernetes logs bug |
| 421 | wrong `Host` at the toolbox | DNS-rebinding guard |
| 503 | `/health/readiness` before boot | not ready yet |

**Common mistake** — reading only the status line. `curl -v` shows the request you *really* sent (headers included), which is usually where the bug is.

### Do (from your Mac)
1. 👀 `curl -s -o /dev/null -w '%{http_code}\n' https://<HOMELAB_DOMAIN>/` → `302`.
2. 👀 `curl -s -o /dev/null -w '%{http_code}\n' https://<HOMELAB_DOMAIN>/api/prometheus/api/v1/query` → `401`.
3. 👀 `curl -s http://<HOMELAB_DOMAIN>:8000/v1/models | jq` → the agent's models.
4. 👀 `curl -sv http://<HOMELAB_DOMAIN>:8000/actuator/health 2>&1 | head -20` → every line of the exchange.

### Check
1. Why does `/` redirect but `/api/…` return 401?
> [!success]- Answer
> `/` serves browsers: a redirect to sign in is useful. `/api/…` is called by the app's `fetch()`; a redirect would hand JavaScript an HTML page, a 401 lets the app react.

**You can now:** read any HTTP exchange and explain its status. Deep dives: [[HTTP]] · [[REST APIs and OpenAPI]].

## 4. Encryption and trust · ~1 h

### Learn
**Definitions**
- **TLS** — encrypts a connection and proves the server's identity with a **certificate** ([[TLS and certificates]]).
- **Certificate** — a public key plus names (SAN) and dates, signed by a **CA** your device trusts.
- **SNI** — the name the client asks for in the handshake, so one IP can serve several names.
- **Termination** — where TLS is decrypted (Caddy); behind it traffic is plain inside the cluster.

**How it works**
Tailscale obtains a Let's Encrypt certificate for the server's `ts.net` name; Caddy fetches it from `tailscaled` through its socket (mounted into the pod) and presents it on every HTTPS port.

**Example from our projects** — the socket mount in Caddy's values:
```yaml
extraVolumes:
  - name: tailscale
    hostPath:
      path: /run/tailscale/tailscaled.sock
      type: Socket
extraVolumeMounts:
  - name: tailscale
    mountPath: /var/run/tailscale/tailscaled.sock
```

**Common mistake** — MagicDNS or HTTPS certificates left off in the Tailscale admin console: Caddy can't get a certificate and HTTPS fails.

### Do
👀 `openssl s_client -connect <HOMELAB_DOMAIN>:443 -servername <HOMELAB_DOMAIN> </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates` → your domain, Let's Encrypt, ~90 days.

### Check
1. Where is TLS terminated for Grafana on `:3000`, and is Caddy → Grafana encrypted?
> [!success]- Answer
> At Caddy; Caddy → Grafana is plain HTTP inside the cluster.

## 5. What's allowed in · ~1.5 h

### Learn
**Definitions**
- **Tailscale** — a WireGuard mesh between your devices; addresses in `100.64/10`, names via MagicDNS ([[Tailscale]]).
- **hostPort** — a pod port published on the node; with `hostIP`, only on that address. Implemented as NAT rules, not a listening socket ([[hostPort and hostNetwork]]).
- **Host firewall** — rules on the machine itself (nftables) ([[Firewall and nftables]]).

**How it works**
Three layers keep the homelab private: (1) every published port binds only to the Tailscale IP; (2) the LAN guard drops Kubernetes' ports and the node address from the LAN; (3) nothing is forwarded on the router.

**Example from our projects** — Caddy's published ports (`gateway/caddy/values.yaml.gotmpl`, excerpt) and how the `app` chart renders them:
```yaml
ports:
  - { name: https, port: 443, hostPort: 443 }
  - { name: signin, port: 8443, hostPort: 8443 }
```
```yaml
- name: https
  containerPort: 443
  hostPort: 443
  hostIP: "<tailscale-ip>"
```
The chart refuses to render a `hostPort` without `global.hostIP`.

**Common mistake** — looking for these ports with `ss -tlnp`: hostPorts are NAT rules, so `ss` doesn't show them.

### Do
1. 👀 `sudo iptables-save -t nat | grep CNI-HOSTPORT-DNAT | grep -- '--dport 443'` → a rule with `-d <tailscale-ip>/32`.
2. 👀 From a device on the home Wi-Fi without Tailscale: `nc -vz -w 3 <lan-ip> 443` → times out.
3. 👀 `make verify` → the published-ports check is ✓.

### Check
1. Name the three things that keep a guest on your Wi-Fi out.
> [!success]- Answer
> Ports bound only to the Tailscale address; the LAN guard; no router forwarding.

**Milestone:** you can trace a request from your browser to Caddy — name, address, port, encryption, and why it's allowed — and debug "it doesn't connect" layer by layer.
