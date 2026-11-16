---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, frontend, design, gateway]
---

# 2026-11-16 Agents scenes, chart zoom, account deletion

## What we did
- **Agents page** (`/agents`): each assistant as an animated SVG scene that gets busy while it works: the Assistant conducts orbiting agents, Kitchen's chef tosses a pan, Travel's plane circles the globe, Observation's radar sweeps, Analysis's bars move under a magnifier, Coding types, Security scans a shield. Working = this browser is streaming to it, or Prometheus sees open requests (`http_server_active_requests` by `job="agent-<name>"`, from the agents' OpenTelemetry FastAPI instrumentation), polled every 10 s for people with Metrics or Dashboards. Waiting plans and failures show a badge. Reduced motion stops the animations.
- **Charts**: box zoom by dragging (time, or time and values for a tall box), wheel on an axis to zoom it, drag an axis to move, ⌘/Ctrl + wheel or pinch for time, double-click or Reset zoom. Lines clipped to the plot.
- **Delete**: one shared button, a bin or a double bin for all, red with a ✓ on the first tap. Conversations on the Assistant page and in the phone menu (which also gained delete all).
- **Accounts**: admins delete an account from People (not their own); everyone can delete their own from Account through Keycloak's `kc_action=delete_account`. homelab-infra `sync.sh` turns on the Delete Account required action and adds `account/delete-account` to `default-roles-homelab`.
- Add a person and Appearance are centered (`.hl-page--narrow`); dashboard tab labels are centered (links need `inline-flex` to center like buttons).
- People's 404 message now says whether Caddy or Keycloak refused, from the error body.

## What I learned
- In SVG with `transform-box: fill-box` on everything, a rotation meant to turn around the scene's centre needs `transform-box: view-box`, and a rule specific enough to win.
- `setPointerCapture` throws for a pointer the browser does not know (synthetic events); guard it so a drag still works.
- Keycloak has no account REST call to delete yourself; the supported way is the Delete Account application-initiated action.

## Next
- [ ] homelab-infra: pull on the server, `make validate`, `make apply R=keycloak`, `make apply R=caddy` (People route fix and self-deletion).
- [ ] Release homelab-ui.
- [ ] Check on the server that `http_server_active_requests` arrives in Prometheus for the agents; if not, the Agents page only shows the browser's own activity.
