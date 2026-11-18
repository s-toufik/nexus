---
type: log
date: 2026-11-18
projects: ["[[Kitchen Atelier]]", "[[Homelab UI]]", "[[Agent toolbox]]"]
tags: [log, kitchen-atelier, homelab-ui, chrome, theming]
---

# 2026-11-18 Kitchen, chrome rework

## What we did
- **[[Kitchen Atelier]], a new backend**: recipes and immutable versions in a new MongoDB database `kitchen`; a French ingredient/macro catalog (ANSES CIQUAL, weekly bulk-CSV refresh) in a new `kitchen` schema inside the shared `homelab` Postgres database, owned by a new `kitchen_atelier` role. Hexagonal layout, same shape as agent-runtime/agent-toolbox. `homelab-infra` wiring written and locally validated (Postgres role + migration, Mongo database, Caddy route `role:app:kitchen`, Keycloak `app:kitchen`, a weekly CronJob) — see [[Kitchen Atelier]].
- **[[Homelab UI]]'s Kitchen page**: first pass used the app's generic `hl-*` design system; rebuilt pixel-for-pixel to match a provided design (parchment/ink/saffron/terracotta/sage, Inter/JetBrains Mono) after being told the first pass was "an interpretation", not what was asked. Every colour token derives from the app's own theme variables (`--surface`, `--hue-amber`…) instead of hardcoded hex, so it follows whichever appearance theme is picked — verified against `navy` (dark) and `forest`.
- **[[Agent toolbox]]**: `scope_kitchen` gained a curated read-only tool list (Mongo find/aggregate/schema, Postgres list/execute-sql) so the kitchen *agent* (already existed, chat) can read the same recipes and ingredients the new page writes.
- **Found and fixed real layout bugs** while building: ingredient autocomplete covering the row below it, a toast sitting over the mobile nav pills, a cramped header at tablet width, duplicate add-ingredient buttons, an `@let` shadowing its own component method (`NG8016`), a wrong Caddy role (`role:page:kitchen` → `role:app:kitchen`), low-contrast icon (saffron-on-ink, barely visible) now using the guaranteed-contrast ink-on token, and a stepper-card border too faint to read as separate cards at wide widths.
- **Chrome rework, asked for separately**: the global top toolbar (search field, assistant toggle, a settings gear used by exactly one page) is gone from every page. Search moved into the sidebar as a `Search` item; the assistant toggle is now a small floating button, fixed bottom-right, hidden under 768px; the settings gear moved into the Assistant page's own local header, the only page that used it.
- **A `Life` feature category and nav section**: Kitchen was falling into `Operate` (Platform+AI+Streaming+anything-else) alongside unrelated infrastructure tools; it now has its own section.
- The kitchen icon in the page header and the one in the sidebar were two different, unrelated SVG paths — unified to the same utensils glyph.

## What I learned
- A screenshot gallery can go stale in ways that compound: `Homelab UI pages.md`'s menu picture already predated the *Draft 5* shell rebuild (2026-11-16) before today's chrome rework made it one redesign further behind. Caught it only by reading the actual images, not just the notes referencing them.
- "Match the selected theme" is cheap to get right structurally if a bespoke design's tokens are defined as aliases onto the app's existing semantic variables (`--surface`, `--hue-amber`…) from the start, rather than retrofitted later — no per-theme overrides needed, it just inherits correctly.
- A card that's structurally separate (own grid cell, own background, real gap) can still *read* as merged if its border/shadow is too subtle — verify a "fixed" layout by zooming into the actual pixels at the width where it broke, not just by checking the CSS grid rects in the DOM.
- Annotated page screenshots (numbered orange markers + a legend table) can be composited without a design tool: a plain HTML page with the screenshot as `<img>` plus absolutely-positioned marker `div`s, served over a throwaway local `python3 -m http.server`, rendered and re-screenshotted in the browser pane, then converted to `.webp` with `cwebp`.

## Decisions
- See [[Kitchen Atelier decisions]] (schema-inside-`homelab`, Mongo database naming, immutable versions, curated agent tool scope) and [[Homelab UI decisions]] (toolbar removal, `Life` section, theme-derived Kitchen colours).

## Next
- [ ] Nothing is committed yet in `kitchen-atelier`, `homelab-ui`, `homelab-infra` or `agent-toolbox` — review and commit across all four, then deploy per [[Homelab - Add an app]].
- [ ] Fill in the real `CIQUAL_DATASET_URL` (a data.gouv.fr resource id) before the refresh job can run for real.
- [ ] The rest of the `Homelab UI pages` gallery (23 of 24 pictures) still reflects the pre-Draft-5 shell — a full refresh is pending, flagged in the index.
- [ ] Carried over from 2026-11-17: commit, release and deploy homelab-ui and agent-runtime (agent casts).
