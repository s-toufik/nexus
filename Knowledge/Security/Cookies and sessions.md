---
type: concept
domain: Security
level: beginner
tags: [concept, security, web]
updated: 2026-11-08
---

# Cookies and sessions

> HTTP forgets everything between requests; a **cookie** is a small value the server asks the browser to send back on every request to that site. A **session** is "this cookie = this signed-in user, until it expires".

## Why it matters
Cookies carry your identity, so their attributes decide who can steal or misuse them. Getting `Secure`, `HttpOnly`, `SameSite` and the prefixes right is a core web-security skill.

## How it works
`Set-Cookie: __Host-homelab=…; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`
| Attribute | Effect |
|---|---|
| `Secure` | Sent over HTTPS only |
| `HttpOnly` | Invisible to JavaScript (XSS can't read it) |
| `SameSite=Lax` | Not sent on cross-site sub-requests (fetch, forms POSTed from another site); sent on top-level navigations |
| `SameSite=Strict` / `None` | Never cross-site / always (needs `Secure`) |
| `Domain` | Shared with subdomains — usually avoid |
| `__Host-` prefix | Browser enforces `Secure`, `Path=/`, no `Domain`: pinned to this exact host |
| `Max-Age` / `Expires` | Lifetime |

- **Server-side session** (an ID pointing to stored data) vs **client-side** (the data itself, encrypted and signed in the cookie — oauth2-proxy's way, keyed by `cookie-secret`).

## In our projects
- oauth2-proxy's `__Host-homelab`: `Secure`, `SameSite=Lax`, 8 h, refreshed every 4 min ([[Homelab gateway and sign-in]]).
- One cookie for every tool, because they're the same host (different ports share cookies — cookies aren't port-specific).
- `make sessions-revoke` rotates the cookie secret: every existing cookie becomes unreadable.

## Pitfalls we met
- Cookies ignore ports: `:3000` and `:9090` see the same cookies. Caddy drops `Cookie` before most backends (`header_up -Cookie`) so tools never receive the session.

## Check yourself
1. Why does the `__Host-` prefix matter, and what does it forbid?
> [!success]- Answer
> The browser enforces it: the cookie must be `Secure`, have `Path=/` and no `Domain`, so it's pinned to this exact host. A sibling subdomain or a page over plain HTTP can't set or overwrite it with a cookie of the same name.
2. How does rotating a secret sign everyone out without touching their browsers?
> [!success]- Answer
> oauth2-proxy's session lives in the cookie itself, encrypted and signed with `cookie-secret`. With a new secret, oauth2-proxy can't read any existing cookie, so every one counts as no session and everyone signs in again.

## Go further
- [MDN: using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
- [OWASP session management cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
