---
type: log
date: 2026-11-15
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, frontend, design, access]
---

# 2026-11-15 Homelab UI redesign draft

## What we did
- Drafted a new look for homelab-ui, "Calm": light, iOS-native (large titles, grouped inset lists, bottom tab bar on the phone, sidebar on iPad and computer), 44 pt targets, one soft color per app.
- Six screens: a family member's home with only her apps (Kitchen, Travel) and her recent conversations; a phone chat where a plan is approved with one big button; the iPad and computer layout; and, for the admin, People, a person's access (switches per page, grouped by app, with profiles), and adding a person from the phone with a set-up link.

- Draft 1 is "Calm". Draft 2, "Bright": full-color app cards that show something live (tonight's dinner, days to the next trip), one floating Ask bar instead of a tab bar, a waiting plan that takes over the bottom of the chat, People as cards, and everyone's access in one grid (people across, pages down). Draft 3, "Night": dark, the apps as a phone home screen (icon grid, dock, a widget for what waits), the plan as a bottom sheet, and an admin view where you pick a person and tap their app icons on or off. Draft 4, "One conversation": assistant-first, Dora never picks an app, each answer is tagged with the helper that made it, and access is edited as sentences ("Dora can use Kitchen and Travel"); it needs the supervisor to call only the agents the signed-in person may use.

- Draft 2 in five themes, chosen per person in Settings › Appearance: Bright (the original), Midnight (dark), Sand (warm, serif headings), Pastel (soft tinted cards), Contrast (black and white, Atkinson Hyperlegible, borders instead of shadows), plus "Match my iPhone" (Bright by day, Midnight at night). The layout never changes, only colors, fonts and borders; Kitchen stays orange and Travel teal in every theme. Each theme is one token set (about 40 CSS variables on `<html data-theme>`), and every text color is checked at 4.5:1 or more.

## The access model (proposed)
- Every page has an id (`agent:kitchen`, `app:tasker`, `page:metrics`); a person gets pages one by one or through a profile (Family, Kids, Admin).
- Keycloak keeps it: a realm role per page, a group per profile. The UI shows only the given pages, and the gateway refuses the others (`allowed_groups=role:<page>`, as `admin_only` does today), so hiding is never the only lock.
- People are managed from the UI through a small admin API in front of Keycloak's admin REST API, behind `admin_only`; the admin never sees a password (set-up link instead).

## Next
- [ ] Choose among the four drafts (or a mix), then turn it into the real UI: shell, home, chat, admin pages.
- [ ] If Draft 2: theme tokens as CSS variables, the Appearance setting saved per account.
- [ ] The access API and the gateway rules per page, in homelab-infra.
- [ ] iOS: web app manifest, icons, safe areas, standalone mode.
