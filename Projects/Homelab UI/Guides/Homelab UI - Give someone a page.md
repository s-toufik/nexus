---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui, access]
updated: 2026-11-15
---

# Homelab UI - Give someone a page

> Add a person, give or take a page, and make a new page grantable.

**Where:** homelab-ui in the browser, or the server for `make` commands · **All guides:** [[Homelab UI guides]]

## 1. Add a person
1. homelab-ui → **People** → **Add a person**.
2. Fill first name, username (lowercase), optional last name and email → **Next**.
3. Tick the pages (for example Kitchen and Travel) → **Create …'s account**.
4. Check: the last step shows the username and a temporary password, once → **Copy the password** and give it to the person.
5. Check: at their first sign-in, Keycloak asks them for a new password.

## 2. Give or take a page
1. homelab-ui → **People** → **Access** → tap the box in the person's column.
   - or `make user-grant ACCOUNT=<name> PAGE=<page id>`
   - raw: `./scripts/users.sh grant <name> <page id>`
   - take it back: `make user-revoke ACCOUNT=<name> PAGE=<page id>` — raw: `./scripts/users.sh revoke <name> <page id>`
2. Check: within 4 minutes, the page appears on their Home (or disappears, and its address sends them home).

## 3. Make a new page grantable
1. In homelab-ui, on the page's feature: `access: 'page:<name>'`; on its route: `canMatch: [requireAccess('page:<name>')]`.
2. In homelab-infra, add `page:<name>` to `gateway/keycloak/pages.txt`, and `import page_access * role:admin,role:page:<name>` on its `/api/` route in the Caddyfile.
3. Apply:
   - `make apply R=keycloak` — raw: `helmfile -l name=keycloak apply`
   - `make apply R=caddy` — raw: `helmfile -l name=caddy apply`
4. Check: `make verify` → `every homelab-ui page has its role`.

## 4. Install it on an iPhone
1. On the iPhone, open the homelab in Safari and sign in.
2. **Share** → **Add to Home Screen** → **Add**.
3. Check: the Homelab icon opens full screen, on Home.

## If it goes wrong
- A page stays hidden after granting: sign out and in again (forces a new session).
- 403 on a page's data: its gateway route lacks the role, step 3.

## Why it works
- [[Homelab UI decisions]] (2026-11-15) — one realm role per page, two locks.
- [[Homelab gateway and sign-in]] — oauth2-proxy groups and `allowed_groups`.
