---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-19
---

# Homelab UI page - Kitchen

> **Route** `/kitchen`, `/kitchen/recipes`, `/kitchen/ingredients` · **for** everyone, access `app:kitchen` · **saves to** [[Kitchen Atelier]] (`/api/kitchen/…`) · **code** `src/app/features/kitchen/`
> A recipe and nutrition card: ingredients with live macros, method steps, tasting notes, versioned saves — pixel-matched to a provided design, themed to follow whichever appearance you've picked. Two sibling pages, reached from icons in the header: **Recipes** (every saved recipe, grouped by course — click one to open its latest version here) and **Ingredients** (the shared catalog, paginated).

![[Homelab UI - Kitchen.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Brand | Fixed label; the fork-and-knife icon is the same one the sidebar's Kitchen entry uses. |
| 2 | Save · Copy · New | Icon-only, top right: save the next version (409 toast if someone else saved first), copy a plaintext recipe sheet, start a blank recipe. |
| 3 | Course | Trial / Starter / Main / Sauce·Jus / Pastry — a tag on the recipe, not a route. |
| 4 | Title & subtitle | Free text; the title also appears on the version picker once saved. |
| 5 | Portions, with Auto-Scale | The scale icon toggles whether changing portions rescales every ingredient's quantity. |
| 6 | Prep / Cook time | `−5`/`+5` minute steppers, independent of portions. |
| 7 | Ingredients & Weights | The pantry strip quick-adds a staple from the CIQUAL catalog (falls back to a blank row with a toast if the name isn't found); the dashed button always adds a blank row. |
| 8 | An ingredient row | Name (autocomplete against the catalog), quantity/unit steppers, and a kcal badge that opens the per-100g macro modal. A green check appears once the row is linked to the catalog — either an existing match, or, after you save macros for a name the catalog doesn't have, a new entry created there on the spot (get-or-create; the request to create it is only sent from **Save macros**, never from typing a name, so an abandoned name never litters the shared catalog). The green check is also a button: click it to open the **full ingredient card** — every CIQUAL nutrient on file (energy, macros, sugars, fatty acids, minerals, vitamins), grouped, read-only, fetched fresh from the catalog by `ciqual_code`. |
| 9 | Nutritional & Yield Telemetry | Per-portion or full-batch macro tiles, computed live from every ingredient line; switches to a saved version's own numbers when you're viewing one. |
| 10 | Method & Execution | Numbered steps; the `+` here and the dashed button at the bottom both add one. |
| 11 | Add execution step (icon) | Same action as the dashed button below, placed where a quick add is faster to reach. |
| 12 | Tasting & Pass Notes | Seasoning/Acidity/Texture each have their own three options (not a shared scale), plus free-text adjustments. |

## Use it to
Draft a recipe, scale it when the guest count changes (Auto-Scale on), and save a version before you change the sauce — the old version stays exactly as it was, read-only, a click away on the version stepper that appears next to the course pills once you've saved at least once.

## How it works
Saving never edits a version in place: [[Kitchen Atelier]]'s `SaveRecipeVersion` always appends the next one as a full snapshot, and refuses a save whose `based_on_version` isn't the current latest (409, surfaced here as a toast) rather than silently overwriting a concurrent edit ([[Kitchen Atelier decisions]]). An ingredient line's macros are copied in at save time, so a later catalog refresh never changes a recipe you already saved.

The whole page's colour tokens (`kitchen-theme.scss`) are aliases onto the app's own `--surface`/`--text`/`--hue-amber`/`--hue-orange`/`--hue-green` variables, not literal hex values — so it follows the appearance theme you picked, the same as every other page ([[Homelab UI decisions]], 2026-11-18).

## Try it
1. 👀 Open [[Homelab UI page - Kitchen|Kitchen]], click a pantry staple under *Quick-Tap Pantry Staples* → a row appears with that ingredient's real macros from the catalog.
2. ✋ Click the kcal badge on an ingredient row, change a value, **Save macros** → the per-portion tiles in *Nutritional & Yield Telemetry* update immediately. (Undo: reopen the modal and set the numbers back, or remove the row.)
3. ✋ Change *Portions* with Auto-Scale on → every ingredient's quantity rescales; turn it off first and the quantities stay put.

> [!question]- Check: you save a recipe, then open it on another device and save again without refreshing first. What happens?
> The second save's `based_on_version` is behind the first save's — the backend refuses it with `StaleVersion` (HTTP 409), surfaced here as a toast, instead of silently overwriting the version you didn't see.

Back to [[Homelab UI pages]].
