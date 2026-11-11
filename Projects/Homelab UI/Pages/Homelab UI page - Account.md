---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Account

> **Route** `/account` · **for** everyone (your own account) · **reads** Keycloak's account API (`/api/account/…`) · **code** `src/app/features/account/`
> Your profile, your password, and every place you're signed in.

![[Homelab UI - Account.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Profile | Username (fixed), first and last name, email — stored in Keycloak ([[OAuth 2.0 and OpenID Connect]]). |
| 2 | Save | Writes the profile to Keycloak. |
| 3 | Signing in | Your password and when it was set. |
| 4 | Credential label | Shows `password-display-name` — Keycloak's raw message key, not translated by the page: a small bug (it should read *Password*). |
| 5 | Change password | Opens Keycloak's own page (passwords never pass through the UI), then you sign in again. Passwords expire after 90 days. |
| 6 | Devices and sessions | Each browser or device signed in, grouped by device. |
| 7 | this device | The session you're using now. |
| 8 | Session line | The address Keycloak saw, when it started and ends (8 h), and the clients used (*Homelab gateway* = oauth2-proxy). |
| 9 | Sign out (a session) | Ends that one session — a lost phone, an old laptop. |
| 10 | Sign out other sessions | Ends every session but this one. |
| 11 | Sign out | Ends your session everywhere: the cookie is cleared and Keycloak forgets it. |

## Use it to
- Change your password before it expires, or after you typed it on a shared screen.
- Check where you're signed in, and cut off a device you no longer have.

## How it works
The page calls Keycloak's account REST API through the gateway with your session; Caddy's forward auth proves who you are ([[Homelab gateway and sign-in]]). **Change password** sends you to Keycloak's sign-in page with `kc_action=UPDATE_PASSWORD` (`account-page.ts`): Keycloak asks for the new password itself, so the UI never sees it.

## What the real homelab showed (2026-11-11)
- **Every session's address is the same pod-network address** (masked as `<pod-ip>` in the picture). Port 443 reaches Caddy through a [[hostPort and hostNetwork|hostPort]], a NAT rule that rewrites your device's address to the pod network's gateway on the way in. So Keycloak never sees your real Tailscale address — one more reason the [[Homelab UI page - Logs|logs]] show the same source for every request.
- Two sessions for one device: the browser signed in twice (two tabs before the cookie existed). Harmless; each ends after 8 h.

## Try it
1. 👀 Open the homelab on your phone, come back here → a second device appears.
2. ✋ Click **Sign out** on the phone's line → the phone's next click asks it to sign in again.

> [!question]- Check: why does the address column not help you tell your Mac from your phone?
> The hostPort NAT replaces the source address before Caddy, Keycloak and oauth2-proxy see it; only the device and browser names differ.

Back to [[Homelab UI pages]].
