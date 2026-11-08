---
type: concept
domain: Frontend
level: beginner
tags: [concept, frontend, web]
updated: 2026-11-08
---

# Single-page application

> A web app delivered as one HTML page plus JavaScript bundles; navigation happens in the browser (the router swaps views) and data comes from APIs, instead of the server rendering a new page per click.

## Why it matters
SPAs feel like apps and can be served as static files from any web server or CDN — but they bring their own concerns: bundle size, client-side routing on refresh, auth with cookies vs tokens, SEO.

## How it works
- **Static hosting:** `index.html` + hashed JS/CSS; the server must answer every app route with `index.html` (fallback) so a refresh on `/status` works.
- **Lazy loading:** split bundles per route; load on first visit.
- **Same-origin APIs** avoid CORS and let the session cookie flow ([[Cookies and sessions]]).
- **Caching:** hashed file names cache forever; `index.html` must not be cached long — else users keep the old app (hence Cmd+Shift+R after a deploy).

## In our projects
[[Homelab UI]] is an SPA served by unprivileged nginx behind Caddy; all APIs on the same origin under `/api/` ([[Homelab UI delivery]]).

## Check yourself
1. Why must nginx serve `index.html` for unknown paths?
2. Why are hashed asset names safe to cache forever?

## Go further
- [MDN: SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA).
- [web.dev: code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting).
