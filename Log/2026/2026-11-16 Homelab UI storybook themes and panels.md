---
type: log
date: 2026-11-16
projects: ["[[Homelab UI]]"]
tags: [log, frontend, design]
---

# 2026-11-16 Homelab UI storybook themes and panels

## What we did
- Dashboards: the tab strip under the title was squashed to its padding. Every `.hl-page` is a scrolling flex column, and a child that scrolls sideways has a minimum height of 0, so the column shrank it. Direct children of `.hl-page` no longer shrink.
- Side panels: one `PaneState` and one `<app-side-pane>` for the sidebar, the page settings and the Assistant's conversations. Hover the button or edge to peek, click to keep it, click again to close; drag the inner edge to resize, double-click to reset; pin and width are remembered. On the phone a panel is an overlay with a shade and closes on every page change.
- Assistant: the details column is gone (it repeated what the page shows). On the phone it now follows the ChatGPT and Claude apps: the assistant's name is the title and opens a sheet to pick another one (plus Model and settings for admins), suggestions sit above a rounded message box held at the bottom, the empty state is centred.
- Phone: the closed menu no longer shows through at the bottom of short pages (it is hidden when closed).
- Themes: four storybook themes that change the whole appearance, not only colours: Wizarding (parchment, leather sidebar, illuminated first letter, wax seal), Dragon Rider (scales, ember glow, cut-corner armour cards, gold-to-ember headings), Demigod (marble, bronze, Greek key, deep-sea sidebar), Regency (Wedgwood blue, damask, gilt frames, script titles). Skin tokens in `scripts/themes.mjs`, shapes in `src/styles/_skins.scss`; sidebars are contrast-checked too. Appearance groups themes into Everyday and Storybook.
- README and screenshots refreshed. Checks: 166 tests, lint, typecheck, production build (style budgets raised to 600 kB initial and 10 kB per component for the theme textures and fonts).

## What I learned
- In a scrolling flex column, `overflow: auto` on a child sets its automatic minimum size to 0, so it can collapse; `flex-shrink: 0` on the column's children keeps them whole.
- Custom properties inherit into nested `data-theme` elements, so every theme must write every skin token, defaults included.
- iOS rubber-band scrolling reveals anything fixed behind the page; hide off-screen layers instead of only covering them.

## Next
- [ ] Commit, release and deploy homelab-ui with homelab-infra's page access changes (`make validate`, `make apply R=keycloak`, `make apply R=caddy`).
- [ ] agent-runtime: an endpoint to delete a conversation's checkpoints and tasks, called by Delete.
