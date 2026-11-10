---
type: path
level: 2
module: 5
time: ~7 h
projects: ["[[Homelab]]", "[[Homelab UI]]"]
tags: [path, journey]
updated: 2026-11-10
---

# Module 05 - The front door

> **Goal:** understand single sign-on end to end — the gateway, OIDC, sessions, the web attacks it stops — and manage accounts.
> **Time:** ~7 h. Previous: [[Module 04 - Shipping changes]] · Next: [[Module 06 - Data]]

## Warm-up
1. Which header does Caddy use to pick a site, and which certificate does it present on `:443`?
> [!success]- Answer
> `Host` (and the TLS SNI); the Let's Encrypt certificate for `<HOMELAB_DOMAIN>` it gets from tailscaled.

## 5.1 The gateway · ~1.5 h
**Read:** [[Reverse proxy]] · [[Forward authentication]]

**Do:**
1. 👀 Read `gateway/caddy/Caddyfile`: find `strip_identity`, `signed_in_page`, `signed_in_api`, `admin_only`, `no_cross_site_writes`, and one `/api/<tool>/*` route with its allowed paths.
2. 👀 `curl -s -o /dev/null -w '%{http_code}\n' -H 'Remote-User: admin' https://<HOMELAB_DOMAIN>/api/prometheus/api/v1/query` → still `401`: the forged header is stripped and you have no session.

**Check:**
1. Why is `strip_identity` the most important line of the Caddyfile?
> [!success]- Answer
> Backends trust `Remote-User`. If clients could send it, anyone on the tailnet could claim any identity. Caddy deletes it from every request and sets it only from oauth2-proxy's answer.

## 5.2 Sign-in with OIDC · ~2 h
**Read:** [[OAuth 2.0 and OpenID Connect]] · [[Homelab gateway and sign-in]] · source: [[OAuth 2.0 Simplified]] (authorization code + PKCE chapters)

**Do:**
1. In a private browser window with the network tab open (preserve log), open `https://<HOMELAB_DOMAIN>/` and sign in. Match each redirect to the 10 steps of [[Homelab gateway and sign-in]]: `/oauth2/sign_in` → Keycloak `…/auth?…code_challenge=…` → `/oauth2/callback?code=…` → `/`.
2. 👀 `curl -s https://<HOMELAB_DOMAIN>:8443/realms/homelab/.well-known/openid-configuration | jq '.issuer, .authorization_endpoint, .token_endpoint'`.
3. 👀 Read `gateway/keycloak/sync.sh`: the password policy and lockout lines.

**Check:**
1. Why does the code travel through your browser, but the token exchange happen server to server?
> [!success]- Answer
> The browser is untrusted ground (extensions, history, URLs). A short-lived code is all it carries; the client (oauth2-proxy) swaps it for tokens directly with Keycloak using its client secret and the PKCE verifier, so tokens never pass through the browser's URL.

2. What does PKCE add?
> [!success]- Answer
> A secret verifier created by the client and sent only as a hash at the start; at the exchange the client proves it has the original. A stolen code is useless without it.

## 5.3 Sessions and cookies · ~1 h
**Read:** [[Cookies and sessions]]

**Do:**
1. In the browser's storage panel, find `__Host-homelab`: `Secure`, `HttpOnly`, `SameSite=Lax`, no Domain, Path `/`.

**Check:**
1. How does `make sessions-revoke` sign everyone out without touching their browsers?
> [!success]- Answer
> It rotates oauth2-proxy's cookie secret: every existing cookie was encrypted with the old secret and can no longer be read, so every request looks signed out. It also ends Keycloak's sessions.

## 5.4 Web attacks it stops · ~1 h
**Read:** [[CSRF]] · [[Password hashing]]

**Do:**
1. 👀 In homelab-ui, read `src/app/shared/infrastructure/gateway-api.ts`: where `X-Homelab-Request` is added.

**Check:**
1. A page on another site runs `fetch('https://<HOMELAB_DOMAIN>/api/kube/…', {method: 'DELETE', credentials: 'include', headers: {'X-Homelab-Request': '1'}})` while you're signed in. What happens?
> [!success]- Answer
> The custom header makes it a non-simple request, so the browser first sends a CORS preflight; Caddy doesn't approve that origin, so the browser never sends the DELETE. And `SameSite=Lax` would keep the cookie off a cross-site `fetch` anyway — two layers.

## 5.5 Accounts in practice · ~45 min
**Read:** [[Homelab - Manage accounts]]

**Do** ✋: `make user-add ACCOUNT=test-junior`, sign in with it in a private window, see that the Kubernetes page isn't in its menu; then `make user-remove ACCOUNT=test-junior`.

**Milestone:** you can explain SSO, sessions and CSRF defences to a colleague, and say what each line of the Caddyfile is for.
