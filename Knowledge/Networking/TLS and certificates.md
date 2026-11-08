---
type: concept
domain: Networking
level: intermediate
tags: [concept, networking, security]
updated: 2026-11-08
---

# TLS and certificates

> TLS encrypts a connection and proves the server is who it claims to be. The proof is a **certificate**: the server's public key and name, signed by a **certificate authority** your device trusts.

## Why it matters
Without TLS anyone on the path reads passwords and cookies. Without a *valid* certificate, browsers warn, `Secure` cookies don't work, and programs refuse to connect. HTTPS is the baseline for anything with a sign-in.

## How it works
- **Handshake** (TLS 1.3): client says hello with the name it wants (**SNI**); server sends its certificate chain; client checks the signature chain up to a trusted root, the name, the dates; both derive session keys; the rest is encrypted.
- **Certificate**: subject names (SAN: `<machine>.<tailnet>.ts.net`), public key, validity (often 90 days), issuer's signature.
- **CAs** like Let's Encrypt issue certificates after an **ACME challenge** proving you control the name (HTTP or DNS).
- **Termination**: the [[Reverse proxy]] holds the certificate and decrypts; traffic behind it may be plain HTTP inside a trusted network.
- **mTLS**: both sides present certificates.

## In our projects
- Tailscale gets a Let's Encrypt certificate for the server's `ts.net` name (MagicDNS + HTTPS on in the admin console). Caddy asks `tailscaled` for it through its socket, mounted into the pod ([[Homelab gateway and sign-in]]).
- Inside the cluster most traffic is plain HTTP between pods; PostgreSQL connections use TLS (`sslmode=require`) with CloudNativePG's own CA.
- The k3s API certificate includes the Tailscale name and IP (`tls-san`).

## Pitfalls we met
- Pods reaching `https://<domain>` must hit Caddy (which has the certificate) — the [[CoreDNS]] rewrite. Otherwise: wrong host or name mismatch.
- `__Host-` and `Secure` cookies require HTTPS ([[Cookies and sessions]]).

## Check yourself
1. What exactly does a browser check before trusting a certificate?
2. Where is TLS terminated for `https://<domain>:3000`, and is Grafana's traffic encrypted after that?

## Go further
- [Cloudflare: what is TLS?](https://www.cloudflare.com/learning/ssl/what-is-tls/)
- [The illustrated TLS 1.3 connection](https://tls13.xargs.org/) — every byte explained.
- [Let's Encrypt: how it works](https://letsencrypt.org/how-it-works/).
