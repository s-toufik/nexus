---
type: concept
domain: Security
level: intermediate
tags: [concept, security, identity]
updated: 2026-11-08
---

# OAuth 2.0 and OpenID Connect

> **OAuth 2.0** lets an application get a token to act for a user without seeing their password. **OpenID Connect (OIDC)** adds identity on top: an **ID token** saying who signed in. Together they're how "Sign in with …" and single sign-on work.

## Why it matters
Every modern login — corporate SSO, Google, GitHub — is OIDC. Understanding the **authorization code flow** lets you debug sign-in loops, configure any identity provider and reason about tokens and their lifetimes.

## How it works
Actors: the **user**, the **client** (the app: oauth2-proxy, Grafana), the **identity provider / authorization server** (Keycloak).

The authorization code flow with PKCE:
1. The client redirects the browser to the provider's `/authorize` with `client_id`, `redirect_uri`, `scope=openid email profile`, and a **code challenge** (hash of a random secret — PKCE).
2. The user signs in **at the provider** (the app never sees the password).
3. The provider redirects back to `redirect_uri?code=…`.
4. The client exchanges the code + the PKCE verifier + its client secret at `/token`, server to server.
5. It gets an **ID token** (a signed JWT: who, when, for which client), an **access token** (to call APIs, short-lived), a **refresh token** (to get new ones).

- **Discovery**: `/.well-known/openid-configuration` lists the provider's endpoints and keys.
- **Scopes** and **claims** say what the client gets (`email`, `groups`, roles…).
- **JWT**: `header.payload.signature`, base64url; verify the signature with the provider's public keys (JWKS).

## In our projects
- **Keycloak** is the provider; realm `homelab`, clients `oauth2-proxy` and `grafana`, defined as code by `sync.sh` ([[Homelab gateway and sign-in]]).
- **oauth2-proxy** is the client for every tool: `--provider=keycloak-oidc`, `--code-challenge-method=S256`, issuer `https://<domain>:8443/realms/homelab`.
- **Grafana** is its own client, mapping Keycloak roles to Grafana roles.
- Access tokens live 5 min (`accessTokenLifespan=300`); oauth2-proxy refreshes every 4 min; SSO sessions 8 h.
- `/api/account/*` passes the user's access token to Keycloak's account API.

## Pitfalls we met
- The issuer URL must be reachable *and identical* from the browser and from the client's pod — hence the [[CoreDNS]] rewrite.
- Redirect URIs must match exactly what's registered in the client.

## Check yourself
1. Why does the code go through the browser but the token exchange not?
> [!success]- Answer
> The browser is the only way to bring the user back to the client after signing in, but anything in the browser can leak (history, logs, extensions). So only a one-time code goes through it; the tokens come from a server-to-server call that needs the client secret and the PKCE verifier, which never touch the browser.
2. What does PKCE protect against?
> [!success]- Answer
> A stolen authorization code: without the verifier, which never left the client that started the flow, nobody else can exchange it for tokens.
3. ID token vs access token: who is each for?
> [!success]- Answer
> The ID token is for the client: it tells the app who signed in, when, and for which client. The access token is for APIs: the client sends it to a resource server to act for the user, which checks it.

## Go further
- [OAuth 2.0 simplified](https://www.oauth.com/) (Aaron Parecki) — the clearest introduction.
- [OpenID Connect: how it works](https://openid.net/developers/how-connect-works/).
- [PKCE](https://oauth.net/2/pkce/), [jwt.io](https://jwt.io/) to decode tokens.
- [Keycloak docs](https://www.keycloak.org/documentation).
