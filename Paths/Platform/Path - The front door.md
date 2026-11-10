---
type: path
track: Platform
time: ~8 h
projects: ["[[Homelab]]", "[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - The front door

> **Goal:** understand single sign-on end to end — the gateway, OIDC, sessions, the web attacks it stops — and manage accounts.
> **Time:** ~8 h.
> **Before:** [[Path - Networks you can reason about]] · [[Path - Containers and Kubernetes]]. **Then:** [[Path - Security and failure]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| A reverse proxy as the only door | Caddy: every port, every route |
| Forward authentication | `forward_auth oauth2-proxy:4180` snippets |
| OpenID Connect with PKCE | oauth2-proxy ↔ Keycloak; Grafana's own client |
| Never trust client identity headers | `strip_identity` |
| Secure session cookies | `__Host-homelab`, 8 h, refreshed every 4 min |
| CSRF defence | `X-Homelab-Request` + `SameSite=Lax`; `GatewayApi` adds the header |
| Identity configured as code | Keycloak's `sync.sh` Job |

## Warm-up (optional, from the paths before)
1. Which header does Caddy use to pick a site?
> [!success]- Answer
> `Host` (and the TLS SNI).

## 1. The gateway · ~2 h

### Learn
**Definitions**
- **Reverse proxy** — receives clients' requests and forwards them to backends; terminates TLS ([[Reverse proxy]]).
- **Route / matcher** — which requests a block handles (by path, method, header).
- **Snippet** — a reusable Caddyfile block, `(name) { … }`, used with `import name`.
- **Forward auth** — a subrequest to an auth service; 2xx = pass, else stop ([[Forward authentication]]).

**How it works**
For every request on `:443`: strip identity headers → (for `/api/*`) ask oauth2-proxy, answer 401 if signed out → pick the tool's route → check its allowed paths → (writes) require `X-Homelab-Request` → (some) require the `admin` role → forward with clean headers.

**Example from our projects** — three snippets from `gateway/caddy/Caddyfile`:
```text
(strip_identity) {
    request_header -Remote-User
    request_header -X-Auth-Request-User
    request_header -X-Gateway-Secret
    …
}

(admin_only) {
    forward_auth {args[0]} oauth2-proxy:4180 {
        uri /oauth2/auth?allowed_groups=role:admin
        …
    }
}

(no_cross_site_writes) {
    @cross_site_write {
        not method GET HEAD OPTIONS
        not header X-Homelab-Request 1
    }
    respond @cross_site_write "Missing X-Homelab-Request" 403
}
```
And a route using them:
```text
handle_path /api/kafka/* {
    @blocked not path /api/clusters /api/clusters/*
    respond @blocked 404
    import no_cross_site_writes
    @kafka_write not method GET HEAD
    import admin_only @kafka_write
    reverse_proxy kafka-ui:8080 { … }
}
```
Read: only Kafka UI's cluster API is reachable; any write needs the CSRF header *and* the `admin` role; reads need only a session.

**Common mistake** — forgetting the allow-list when adding a route: the whole tool API, admin endpoints included, becomes reachable to every signed-in user.

### Do
1. 👀 Read the Caddyfile; for each `/api/<tool>/*` route, say what's allowed and who may write.
2. 👀 `curl -s -o /dev/null -w '%{http_code}\n' -H 'Remote-User: admin' https://<HOMELAB_DOMAIN>/api/prometheus/api/v1/query` → `401`.

### Check
1. Why is `strip_identity` the most important snippet?
> [!success]- Answer
> Backends trust `Remote-User`. If clients could send it, anyone on the tailnet could claim any identity; Caddy deletes it from every request and sets it only from oauth2-proxy's answer.

## 2. Sign-in with OIDC · ~2.5 h

### Learn
**Definitions**
- **Identity provider (IdP)** — holds accounts and signs people in: Keycloak, realm `homelab` ([[OAuth 2.0 and OpenID Connect]]).
- **Client** — an app that delegates sign-in to the IdP: `oauth2-proxy`, `grafana`.
- **Authorization code** — a short-lived code the IdP gives the browser after sign-in, swapped server-side for tokens.
- **PKCE** — the client sends a hash of a random verifier at the start and the verifier at the exchange; a stolen code is useless.
- **ID token / access token / refresh token** — who you are / permission to call APIs (5 min here) / get new ones.
- **Issuer** — the IdP's base URL; its `/.well-known/openid-configuration` lists its endpoints.

**How it works**
```text
browser → Caddy (no cookie) → /oauth2/sign_in → Keycloak /auth?client_id=oauth2-proxy&code_challenge=…
       → sign in (Argon2id check, lockout) → back to /oauth2/callback?code=…
oauth2-proxy → Keycloak /token (code + verifier + client secret) → tokens → sets __Host-homelab → redirect to /
```

**Example from our projects** — oauth2-proxy's arguments (`gateway/oauth2-proxy/values.yaml.gotmpl`, excerpt):
```yaml
args:
  - --provider=keycloak-oidc
  - --client-id=oauth2-proxy
  - --oidc-issuer-url=https://{{ .Values.domain }}:8443/realms/homelab
  - --redirect-url=https://{{ .Values.domain }}/oauth2/callback
  - --code-challenge-method=S256
  - --upstream=static://202
  - --set-xauthrequest=true
  - --cookie-name=__Host-homelab
  - --cookie-expire=8h
  - --cookie-refresh=4m
```
1. `upstream=static://202` — it proxies nothing: it only answers Caddy's question.
2. `set-xauthrequest` — the 202 carries `X-Auth-Request-User/Email/Groups` for Caddy to copy.
3. `cookie-refresh=4m` — refresh tokens before the 5-minute access tokens expire.

**Common mistake** — the issuer URL unreachable *from the pod*: the exchange fails and sign-in loops. Hence the CoreDNS rewrite to Caddy.

### Do
1. Private window, network tab (preserve log): sign in; match each redirect to the flow above.
2. 👀 `curl -s https://<HOMELAB_DOMAIN>:8443/realms/homelab/.well-known/openid-configuration | jq '.issuer, .authorization_endpoint, .token_endpoint'`.
3. 👀 Read `gateway/keycloak/sync.sh`: password policy and lockout.

### Check
1. Why does the code go through your browser, but the token exchange happen server to server?
> [!success]- Answer
> The browser is untrusted ground (history, extensions, URLs). It carries only a short-lived code; oauth2-proxy swaps it for tokens directly with Keycloak using its client secret and the PKCE verifier.

## 3. Sessions and cookies · ~1 h

### Learn
**Definitions**
- **Cookie attributes** — `Secure` (HTTPS only), `HttpOnly` (no JavaScript), `SameSite=Lax` (not on cross-site sub-requests), `__Host-` prefix (must be Secure, Path `/`, no Domain) ([[Cookies and sessions]]).
- **Client-side session** — the session data encrypted inside the cookie with a server secret (oauth2-proxy's `cookie-secret`).

**How it works** — every request carries the cookie; oauth2-proxy decrypts it, checks expiry, refreshes tokens when needed.

**Example from our projects** — signing everyone out (`make sessions-revoke`):
```bash
./scripts/secrets.sh rotate oauth2-proxy cookie-secret
./scripts/users.sh logout-all
```
A new cookie secret makes every existing cookie unreadable; Keycloak's sessions are ended too.

**Common mistake** — believing cookies are per port: `:3000` and `:9090` share the domain's cookies. Caddy removes `Cookie` before most backends (`header_up -Cookie`).

### Do
👀 Browser storage panel: `__Host-homelab` with `Secure`, `HttpOnly`, `SameSite=Lax`, Path `/`.

## 4. Web attacks it stops · ~1.5 h

### Learn
**Definitions**
- **CSRF** — another site making your browser send a request with your cookies ([[CSRF]]).
- **CORS preflight** — an `OPTIONS` request the browser sends before a "non-simple" cross-origin request (custom headers, PUT/DELETE…); without approval, the real request isn't sent.
- **Password hashing** — storing a slow salted hash (Argon2id), never the password ([[Password hashing]]).

**Example from our projects** — homelab-ui adds the header on every request (`shared/infrastructure/gateway-api.ts`):
```ts
const headers: Record<string, string> = {
  'X-Homelab-Request': '1',
  Accept: request.accept ?? 'application/json',
};
```

**Common mistake** — changing state on GET: `SameSite=Lax` still sends cookies on top-level GET navigations, and a CSRF header check doesn't cover GET.

### Check
1. A page on another site runs `fetch('https://<HOMELAB_DOMAIN>/api/kube/…', {method: 'DELETE', credentials: 'include', headers: {'X-Homelab-Request': '1'}})`. What happens?
> [!success]- Answer
> The custom header and DELETE make it non-simple: the browser sends a CORS preflight; Caddy doesn't approve other origins; the DELETE is never sent. `SameSite=Lax` would also keep the cookie off a cross-site fetch.

## 5. Accounts in practice · ~1 h

### Learn
**Example from our projects** — the realm's password and lockout policy (`gateway/keycloak/sync.sh`, excerpt):
```bash
-s 'passwordPolicy=length(12) and passwordHistory(5) and forceExpiredPasswordChange(90)' \
-s bruteForceProtected=true -s permanentLockout=false -s failureFactor=5 \
-s ssoSessionIdleTimeout=28800 -s ssoSessionMaxLifespan=28800 -s accessTokenLifespan=300
```
12+ characters, not one of the last 5, change every 90 days; 5 failures lock temporarily; sessions 8 h; access tokens 5 min.

### Do ✋
`make user-add ACCOUNT=test-junior`; sign in with it in a private window (no Kubernetes page in its menu); `make user-remove ACCOUNT=test-junior`.

**Milestone:** you can explain SSO, sessions and CSRF defences to a colleague, and say what each line of the Caddyfile is for. Deep dive: [[Homelab gateway and sign-in]].
