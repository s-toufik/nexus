---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]"]
tags: [log, frontend, design]
---

# 2026-11-16 Homelab UI rebuilt on Briefing

## What we did
- Rebuilt homelab-ui on Draft 5 · Briefing ([[2026-11-16 Homelab UI Briefing design]]), not released, not committed yet.
- Shell: receding sidebar with folding sections, toolbar with the ⌘K field, command palette fed by `COMMAND_SOURCES` (pages, conversations, "Ask Kitchen: …", themes), phone tab bar and a More page.
- Today: the briefing sentences come from a pure function (`briefing()`), with waiting plans, admins' alerts and warnings, the homelab's numbers, recent conversations.
- Assistant: the agent store now keeps a list of conversations, each with its agent and title (the older one-per-agent format is read and kept); plans wait in a card under the conversation.
- Map: the layout from homelab-infra (`map-layout.ts`) with live states from the pods in namespace homelab (`app.kubernetes.io/instance`, `cnpg.io/cluster` for postgres), node numbers from Prometheus, a details drawer with Open, Logs, Metrics, Restart (asks first) and Ask about it.
- People: a list beside the person's pages as switches.
- Themes: Navy (default), Light, Contrast; Geist and Geist Mono bundled; rows 2 rem with a mouse, 2.75 rem on touch.
- Checks: 158 tests, lint, typecheck, production build; checked in the browser at 1440 px and on a phone, in Navy and Light.

## What I learned
- Container queries size the Map's overview by its own width, so it behaves the same with or without the details drawer.
- An Angular component's host element is inline by default; give it `display: block` before giving it a width.

## Next
- [ ] Commit and release homelab-ui (1.3.0) with homelab-infra's page access changes, then deploy.
- [ ] New screenshots for the README and page notes for Today, Assistant, Map and People.
