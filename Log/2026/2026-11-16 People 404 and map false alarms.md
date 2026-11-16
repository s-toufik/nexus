---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, gateway, frontend]
---

# 2026-11-16 People 404 and map false alarms

## What we did
- People gave 404 even after `make apply R=keycloak` and `make apply R=caddy`. Cause in homelab-infra's Caddyfile: inside a block Caddy sorts directives, and `rewrite` runs before `respond`, so the allowlist `^/users…$` saw `/admin/realms/homelab/users` and refused every request. The `/api/people` directives now sit in `route { }`, which keeps the written order. Rule written in the Caddy README.
- The map showed keycloak and mongodb as failing (1/2). Each release also runs a one-shot Job (keycloak-sync, MongoDB's user setup) whose pod carries the release label; the card counted the finished Job pod as an unready replica. homelab-ui now leaves Job pods out of a service's count and warns only when the release's last Job failed.
- Phone: the history was only reachable in landscape (desktop layout). The menu now has Today, Assistant, Map, a folded **Pages** group, then every conversation by day with delete.
- Checks: 168 tests, lint, typecheck, production build. The Caddyfile was not validated locally (no caddy binary here); `make validate` on the server runs `caddy validate`.

## What I learned
- Caddy's directive order: `rewrite` and `forward_auth` run before `respond` and `reverse_proxy` whatever the written order; use `route { }` when a check must see the original path.
- A forward_auth test as a non-admin (403) can hide a route that refuses everyone else with 404; check the admin path too.

## Next
- [ ] homelab-infra: commit and push the Caddyfile fix, then on the server `git pull`, `make validate`, `make apply R=caddy`.
- [ ] Release homelab-ui with the map, menu and theme changes.
