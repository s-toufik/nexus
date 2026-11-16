---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, frontend, design, gateway]
---

# 2026-11-16 Center sky, Agents map, role ids

## What we did
- **"Role not found"** when giving a new person pages: Keycloak's role-mapping endpoint looks a role up by name and then requires its id to match, so a body with only the name fails. homelab-ui now reads the role's id from the person's own lists (`/users/<id>/role-mappings/realm/available` to give, `/role-mappings/realm` to take; both need only `manage-users`, unlike `/roles/<name>` which needs `view-realm`) and caches it. The Caddy allowlist adds `/available`. Creating a person now still shows the password if giving pages fails, and says so.
- **Center** (`/`, the new first page): a canvas globe of the sky, every page a star in a constellation (Assistant with each agent, Observe, Operate, Automate, Home). Drag to turn with inertia, scroll or pinch to zoom on the pointer, shift- or right-drag to move, click a star to fly to it and get a card with Open, double-click to open, keys too; slow idle spin; the Assistant star pulses while a plan waits; a hidden list for screen readers. Today moved to `/today`.
- **Agents map**: the Assistant (supervisor) as the hub, the agents around it (two columns under it on a phone), curved links that light up and flow with an "asking Kitchen…" chip when the supervisor and an agent work at the same time. Scenes redrawn with much more detail (rooms, props, several moving parts each).
- Style budget per component raised to 16 kB warning / 24 kB error for the scenes.

## What I learned
- The supervisor asks peers with a blocking, non-streaming A2A `SendMessage`; its stream never names the peer while it works, so the UI can only infer delegations from simultaneous activity. A `step_started` event carrying the peer name in agent-runtime would make the lines exact.
- An orthographic globe needs only two rotations; facing a point is `yaw = atan2(x, z)`, `pitch = atan2(y, hypot(x, z))`, which also gives smooth fly-to with the shortest yaw.

## Next
- [ ] homelab-infra: commit the `/available` allowlist, pull on the server, `make validate`, `make apply R=caddy`; give Claire her pages and a new password from People.
- [ ] Release homelab-ui.
- [ ] agent-runtime: emit which peer `ask_agents` is asking, so the Agents map draws real lines.
