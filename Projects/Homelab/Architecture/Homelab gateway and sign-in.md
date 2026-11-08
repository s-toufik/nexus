---
type: architecture
project: "[[Homelab]]"
order: 3
tags: [homelab, architecture, networking, security]
updated: 2026-11-08
---

# Homelab gateway and sign-in

> Every browser request enters through one door, Caddy. Caddy asks oauth2-proxy "is this browser signed in?"; oauth2-proxy knows because Keycloak signed it in. One sign-in opens every tool.

Previous: [[Homelab deployment]] · Next: [[Homelab data]]

## The actors
| Who | Is | Its job here |
|---|---|---|
| **Tailscale** | A private network between your devices ([[Tailscale]]) | The only way to reach the server; also gives it a name `<machine>.<tailnet>.ts.net` and a real HTTPS certificate |
| **Caddy** | A web server / [[Reverse proxy]] | Terminates HTTPS, routes each URL to a service, enforces sign-in, strips forged headers |
| **oauth2-proxy** | An authentication proxy ([[Forward authentication]]) | Holds the session cookie; answers Caddy's "signed in?" with 202 or 401 |
| **Keycloak** | An identity provider ([[OAuth 2.0 and OpenID Connect]]) | Accounts, passwords, the sign-in page, roles (`admin`) |
| **PostgreSQL** | The database | Keycloak's accounts (database `keycloak`) |

## Follow one request
You open `https://<domain>/status` for the first time today.

1. **DNS.** MagicDNS on your device resolves `<domain>` to the server's Tailscale address `100.x.y.z` ([[DNS]]).
2. **TCP + TLS.** Your browser connects to `100.x.y.z:443`. That port is a [[hostPort and hostNetwork|hostPort]] of the Caddy pod, bound to the Tailscale address only. Caddy presents a certificate for `<domain>` that it got from `tailscaled` through its socket, mounted into the pod ([[TLS and certificates]]).
3. **Strip identity.** Caddy deletes any `Remote-User`, `X-Auth-Request-*`, `X-Gateway-Secret` header the browser sent. Only Caddy may set them. (Without this, anyone could send `Remote-User: admin`.)
4. **Ask.** `forward_auth`: Caddy sends the request's headers (with your cookie) to `oauth2-proxy:4180/oauth2/auth`.
5. **No cookie → 401** → Caddy redirects you to `https://<domain>/oauth2/sign_in?rd=<where you were going>`.
6. **oauth2-proxy starts an OIDC login**: it redirects you to Keycloak (`:8443/realms/homelab/...`) with a PKCE challenge.
7. **Keycloak** shows the sign-in page, checks your password (Argon2id hash), applies the lockout policy, and redirects back to `https://<domain>/oauth2/callback?code=…`.
8. **oauth2-proxy exchanges the code** for tokens with Keycloak — server to server. From inside the cluster `<domain>` must reach Caddy, not your device: a [[CoreDNS]] rewrite answers `<domain>` with the `caddy` Service, so pods use the same name and certificate as browsers.
9. **Cookie.** oauth2-proxy sets `__Host-homelab` (encrypted, `Secure`, `SameSite=Lax`, 8 h, refreshed every 4 min) and redirects to `/status` ([[Cookies and sessions]]).
10. **Ask again → 202** with headers `X-Auth-Request-Preferred-Username`, `-Email`, `-Groups`. Caddy copies them to `Remote-User` / `Remote-Email` and proxies to `homelab-ui:8080`.

Next tool you open (Grafana on `:3000`, Prometheus on `:9090`…): the cookie is already there, step 4 answers 202 directly. That's single sign-on.

## The Caddyfile in five patterns
Read `gateway/caddy/Caddyfile` with these in mind:
| Snippet | Means |
|---|---|
| `strip_identity` | Remove identity headers from the client |
| `signed_in_page` | `forward_auth`; on 401, redirect to the sign-in page (for browsers) |
| `signed_in_api` | Same, but on 401 answer `401` (for `fetch()` calls: a redirect would be useless) |
| `admin_only` | `forward_auth` to `/oauth2/auth?allowed_groups=role:admin`: 403 unless your Keycloak roles include `admin` |
| `no_cross_site_writes` | Any write (POST, PUT, DELETE…) must carry `X-Homelab-Request: 1` — a page on another site can't add custom headers without CORS approval ([[CSRF]]) |
| `read_only` | Only GET and HEAD |

And one habit: every `/api/<tool>/*` route lists **the exact paths allowed** (`@blocked not path …` → 404). homelab-ui needs `/api/v1/query` from Prometheus, not its admin endpoints; so only that is reachable.

## The ports
- `:443` — homelab-ui, and its `/api/*` routes to every tool's API.
- `:8443` — Keycloak (sign-in, account pages); `/admin` is blocked: accounts are managed from the terminal (`make user-*`).
- `:3000` Grafana — the only tool that signs in **with Keycloak itself** (its own OIDC client), so its users and roles map to Keycloak's.
- `:9090 :8080 :12345 :3100 :3200 :9308 :6274` — Prometheus, Kafka UI, Alloy, Loki, Tempo, kafka-exporter, MCP Inspector, each behind `signed_in_page`.
- `:4466` Headlamp — signed in **and** `admin_only`.
- `:8090` the LLM — signed in, *or* `Authorization: Bearer <llm-gateway key>` for programs.
- `:8100` the agent's API docs over HTTPS.

## Keycloak as code
Nobody clicks in Keycloak's console. `gateway/keycloak/sync.sh` runs as a [[Jobs and CronJobs|Job]] after every Keycloak deploy and makes the realm match: password policy (`length(12)`, history 5, expiry 90 days), brute-force lockout (5 failures), session lengths (8 h), the `admin` role, and the two clients (`oauth2-proxy`, `grafana`) with their secrets from Kubernetes Secrets. It's idempotent: run it ten times, same result.

## Edge cases
- **Endless redirect / error after sign-in**: almost always step 8 — pods can't reach `<domain>`. Check the `coredns-custom` ConfigMap (deployed by the Caddy release).
- **Programs vs browsers**: MongoDB, Kafka, OTLP, agent-runtime `:8000`, agent-toolbox `:8001` are *not* behind the sign-in — their clients can't do a browser login. They're reachable from the tailnet only. Never forward them on the router.
- **The cookie is `__Host-`**: the browser only accepts it with `Secure`, `Path=/` and no `Domain` — it can't leak to another subdomain.
- **Signing everyone out**: `make sessions-revoke` rotates oauth2-proxy's cookie secret (every cookie becomes unreadable) and ends Keycloak sessions.
- **Safari web apps upgrade `http://` to `https://`**: that's why the agent's docs moved from `:8000` (plain HTTP) to `:8100` (HTTPS through Caddy).

## Check yourself
1. Draw the 10 steps from memory. Which steps happen in your browser, which inside the cluster?
2. Why must Caddy strip `Remote-User` from incoming requests? What would an attacker on your tailnet do without it?
3. Why does `/api/*` use `signed_in_api` (401) instead of `signed_in_page` (redirect)?
4. You add a new web tool on port 7000. List the three places you edit.

## Go further
- [Caddy: forward_auth](https://caddyserver.com/docs/caddyfile/directives/forward_auth) — the exact mechanism.
- [oauth2-proxy: overview](https://oauth2-proxy.github.io/oauth2-proxy/) — and its `/oauth2/auth` endpoint.
- [OpenID Connect, how it works](https://openid.net/developers/how-connect-works/).
- [Tailscale HTTPS certificates](https://tailscale.com/docs/how-to/set-up-https-certificates).
