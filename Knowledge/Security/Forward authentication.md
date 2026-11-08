---
type: concept
domain: Security
level: intermediate
tags: [concept, security, networking]
updated: 2026-11-08
---

# Forward authentication

> The reverse proxy asks a separate auth service, for every request, "is this request allowed?". A 2xx means pass (often with identity headers to forward); 401/403 means stop or redirect to sign-in. Apps behind it don't implement login at all.

## Why it matters
Most self-hosted tools have weak or no authentication, and each would need its own accounts. Forward auth puts one sign-in in front of all of them — the same pattern companies use with identity-aware proxies (Google IAP, Cloudflare Access, Pomerium).

## How it works
```text
client ─► proxy ── subrequest with the client's headers/cookie ──► auth service
            │◄──────── 202 + X-Auth-Request-User: alice ───────────┘
            └─► backend (with Remote-User: alice)
```
- The auth service checks its session cookie; if absent, the proxy redirects to a sign-in URL with "return to" (`rd=`).
- **Header trust**: the backend trusts identity headers, so the proxy **must delete** any the client sent. This is the critical line.
- **Authorization** can live there too: `allowed_groups=role:admin`.

## In our projects
- Caddy `forward_auth oauth2-proxy:4180 { uri /oauth2/auth }` in snippets `signed_in_page` (redirect), `signed_in_api` (401), `admin_only` (role check) ([[Homelab gateway and sign-in]]).
- oauth2-proxy runs with `--upstream=static://202`: it proxies nothing, it only answers.
- `strip_identity` removes `Remote-User`, `X-Auth-Request-*`, `X-Gateway-Secret` from every client request.
- PostgREST trusts `Remote-User` *only* together with a secret only Caddy knows ([[Homelab data]]).

## Pitfalls we met
- An endpoint reachable *without* going through the proxy bypasses everything. Backends must not be reachable directly — NetworkPolicy, or a shared secret like Tasker's.

## Check yourself
1. What happens if the proxy forgets to strip `Remote-User`?
2. Why does `/api/*` answer 401 instead of redirecting?

## Go further
- [Caddy forward_auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth).
- [oauth2-proxy: auth endpoint and integration](https://oauth2-proxy.github.io/oauth2-proxy/features/endpoints).
- [BeyondCorp](https://cloud.google.com/beyondcorp) — Google's identity-aware access model.
