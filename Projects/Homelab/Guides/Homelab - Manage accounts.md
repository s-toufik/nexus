---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-08
---

# Homelab - Manage accounts

> Sign-in accounts: create, change passwords, admin role, lock and unlock, remove, sign everyone out.

**Where:** on the server, in `homelab-infra`, unless a step says otherwise · **All guides:** [[Homelab guides]]

## List accounts
- `make users` — raw: `./scripts/users.sh list`

## Create an account
1. `make user-add ACCOUNT=<name>` — raw: `./scripts/users.sh add <name>`
2. Enter email, first name, last name, then the password twice (12+ characters).
3. Optional admin: `make user-admin ACCOUNT=<name>`.
4. Send the person `https://<HOMELAB_DOMAIN>/`.

## Set a new password for someone
1. `make user-password ACCOUNT=<name>` — raw: `./scripts/users.sh password <name>`
2. Enter the new password twice.

## Change your own password
1. Open `https://<HOMELAB_DOMAIN>:8443/realms/homelab/account` (or the **Account** tile in homelab-ui).
2. **Account security → Signing in → Password → Update**.

## A password expired (90 days)
1. Sign in as usual.
2. Enter a new password on the **Update password** page.

## Give / take the admin role
- give: `make user-admin ACCOUNT=<name>` — raw: `./scripts/users.sh admin <name>`
- take: `make user-unadmin ACCOUNT=<name>` — raw: `./scripts/users.sh unadmin <name>`
- The person signs out and in again.
- What it opens: homelab-ui's Kubernetes page, Headlamp (`:4466`), Kafka changes (topics, messages), unloading a model, Grafana's Admin role.

## Block an account for a while
1. `make user-disable ACCOUNT=<name>` — raw: `./scripts/users.sh disable <name>`
2. To end its open sessions now too: `make sessions-revoke`.
3. Later: `make user-enable ACCOUNT=<name>` — raw: `./scripts/users.sh enable <name>`

## Unlock after too many wrong passwords
- `make user-unlock ACCOUNT=<name>` — raw: `./scripts/users.sh unlock <name>`

## Remove an account
1. `make backup` (to keep its Tasker data restorable).
2. `make user-remove ACCOUNT=<name>` — raw: `./scripts/users.sh remove <name>`
3. Type the account name to confirm.
4. Answer whether to delete its Tasker workflows and favorites.
5. `make sessions-revoke` to end its open sessions now.

## Sign everyone out now
- `make sessions-revoke`
- raw:
  ```bash
  ./scripts/secrets.sh rotate oauth2-proxy cookie-secret
  ./scripts/users.sh logout-all
  ```

## Sign out yourself
- **Sign out** in homelab-ui's left sidebar, or open `https://<HOMELAB_DOMAIN>/oauth2/sign_out?rd=%2F`.

## If it goes wrong
- Sign-in errors or a redirect loop: [[Homelab - Troubleshooting]].

## Why it works
- [[Homelab gateway and sign-in]] — Keycloak, oauth2-proxy and the session cookie.
- [[OAuth 2.0 and OpenID Connect]] · [[Password hashing]] · [[Cookies and sessions]]
