---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]"]
tags: [log, frontend, design, research]
---

# 2026-11-16 Homelab UI Briefing design

## What we did
- Reviewed what was wrong with the built Draft 2 ([[2026-11-15 Homelab UI Draft 2 built]]): the agents were promoted four times on one screen, Home repeated the navigation (and the control center repeated it again), phone-sized cards were stretched across a desktop, and full colour everywhere meant nothing stood out.
- Researched calm desktop apps, Apple's sidebar and split-view guidance, Home Assistant's household dashboards, where AI belongs in an interface, and command palettes.
- Designed Draft 5 · Briefing on the design canvas: a receding sidebar on computer and iPad, a tab bar on the phone, list + detail for Assistant and People, one ⌘K field to find or ask, plans shown inline in the conversation, and Today written as a short briefing ("Kitchen has a plan waiting for you. The homelab is healthy.") with only three sections.
- Added an interactive **Map** of the k3s cluster, laid out like homelab-infra's groups: click a service to light up what it talks to and what uses it, with its state and actions (Open, Logs, Metrics, Restart, Ask Observation) in a side panel.

## What I learned
- "Don't compete for attention you haven't earned" (Linear's 2026 refresh): navigation recedes, content leads, colour only where it means something.
- Apple: at most two levels in a sidebar; list + detail when there's room; a tab bar on the phone.
- Home Assistant: titled sections that keep their arrangement at every size, so people keep their spatial memory.
- Supplementary AI goes inline or behind a shortcut, not on every surface; agents become a property of a conversation, not navigation.
- Density can follow the pointer (`pointer: coarse`) rather than the screen width: compact rows with a mouse, 44 px targets on touch, same layout.

## Decisions
- None yet: the Briefing design waits for the user's verdict before replacing the built Draft 2.

## Next
- [ ] User reviews Draft 5 · Briefing and the Map on the canvas.
- [ ] If approved: rebuild homelab-ui's shell, Today, Assistant, People and the Map on it (keeping the access model, guards, People API and theme tokens already built).
