---
type: log
date: 2026-11-15
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, frontend, design, access]
---

# 2026-11-15 Homelab UI Draft 2 built

## What we did
- Built Draft 2 · Bright from [[2026-11-15 Homelab UI redesign draft]] in homelab-ui (version 1.3.0, not released yet): Home with assistant cards and an Ask bar, an app rail on iPad and computer, coloured page headers with a back arrow on phones, the chat's plan panel (Go ahead / Change it / Not now), one remembered conversation per agent.
- Five themes replace the nine palettes: Bright, Midnight, Sand, Pastel, Contrast, or "Match my device". Tokens come from `scripts/themes.mjs`, which checks every text pair at 4.5:1; fonts are bundled (Plus Jakarta Sans, Fraunces, Atkinson Hyperlegible). The theme is saved on the Keycloak account (`homelabTheme` attribute).
- Access per page: `AccessStore` reads `role:<page>` groups, routes have guards, a non-admin sees only their pages. People pages (cards, Access grid, Add a person) call `/api/people`.
- Every tool page restyled through the shared header and `hl-*` classes; Status and Tasker moved onto them.
- iPhone: web app manifest, home-screen icons, safe areas, no zoom on inputs.
- homelab-infra (not committed): page roles from `gateway/keycloak/pages.txt`, the `admin` role's realm-management grants, the user profile's unmanaged attributes, `(page_access)` on every API route, the `/api/people` route, `make user-grant` / `user-revoke`, verify checks, docs.

## What I learned
- oauth2-proxy's keycloak-oidc provider already turns realm roles into `role:<name>` groups: per-page access needed no oauth2-proxy change.
- Keycloak's role-mapping endpoints accept a role by name only, so the UI never needs `view-realm` to look roles up.
- A CSS variable set on `[data-theme='sand']` applies to any element, so the Appearance swatches render each theme for real.

## Decisions
- [[Homelab UI decisions]] (2026-11-15) and [[Homelab decisions]] (2026-11-15).

## Next
- [ ] Deploy: `make apply R=keycloak`, `make apply R=caddy` (after `make validate`), release homelab-ui 1.3.0, `make pull R=homelab-ui`, `make verify`.
- [ ] Add Dora, give her Kitchen and Travel, install on her iPhone ([[Homelab UI - Give someone a page]]).
- [ ] New screenshots for the README and page notes for Home, People and Appearance.
- [ ] Draft 4's idea, later: the supervisor calling only the agents the signed-in person may use.
