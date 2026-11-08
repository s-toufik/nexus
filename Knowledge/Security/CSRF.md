---
type: concept
domain: Security
level: intermediate
tags: [concept, security, web]
updated: 2026-11-08
---

# CSRF

> Cross-site request forgery: a page on another site makes *your* browser send a request to *your* app — with your cookies attached — to do something you didn't intend.

## Why it matters
Cookie-based sessions are sent automatically. Without a defence, any web page you visit could POST "delete this", "unload that model", "restart that pod" to your homelab while you're signed in.

## How it works
- The attack needs: a state-changing request, authenticated by cookie only, with parameters the attacker can guess.
- **Defences**:
  - `SameSite=Lax/Strict` cookies — cross-site sub-requests carry no cookie ([[Cookies and sessions]]).
  - **A custom header** on writes: a cross-site page *can* call `fetch()` with a custom header only if the target answers a CORS preflight allowing it; ours doesn't, so the browser never sends the request.
  - CSRF tokens (a secret per session in forms).
  - Checking `Origin` / `Sec-Fetch-Site`.
- Never change state on `GET`.

## In our projects
- Caddy's `no_cross_site_writes`: every non-GET to `/api/*` must carry `X-Homelab-Request: 1`, else 403. homelab-ui's API client adds it ([[Homelab gateway and sign-in]]).
- Plus `SameSite=Lax` on the session cookie — two independent layers.
- `read_only` routes refuse writes outright.

## Check yourself
1. Why is a custom header a CSRF defence even though anyone can write `fetch(url, {headers: …})`?
2. Why must `GET` never change state?

## Go further
- [OWASP: CSRF](https://community.owasp.org/attacks/csrf), [CSRF prevention cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) — preflight requests.
