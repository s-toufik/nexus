---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-19
---

# Homelab UI page - Kitchen

> **Route** `/kitchen`, `/kitchen/recipes`, `/kitchen/ingredients` · **for** everyone, access `app:kitchen` · **saves to** [[Kitchen Atelier]] (`/api/kitchen/…`) · **code** `src/app/features/kitchen/`
> A recipe and nutrition card: ingredients with live macros, method steps, tasting notes, versioned saves — pixel-matched to a provided design, themed to follow whichever appearance you've picked. Two sibling pages, reached from icons in the header: **Recipes** (every saved recipe, grouped by course, with its own search-by-title box and a **Delete** button per card — click the card itself to open its latest version here) and **Ingredients** (the shared catalog, paginated, with a search box that hits the catalog directly above 2 characters instead of just filtering the current page, and a **Details** button per row opening the same full nutrient card as the green check on an ingredient row; below 767px the table becomes a stacked card list, since its 6 columns don't fit a phone width without their own horizontal scroll fighting the page's vertical one).

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

## Ingredients and Recipes
Two sibling pages, reached from the atelier's pantry/recipe-book icons: **Ingredients** (`/kitchen/ingredients`) is the shared catalog, paginated 50 at a time; **Recipes** (`/kitchen/recipes`) is every saved recipe, grouped by course.

Ingredients searches the catalog itself, not just the page in front of you: type 2 characters and it calls [[Kitchen Atelier]]'s `GET /v1/ingredients?q=…` (debounced 250 ms), capped at 200 results, with the pager hidden while a search is active. Recipes searches client-side instead — every recipe is already loaded with no pagination, so filtering by title needs no round trip (sample data):

![[Homelab UI - kitchen ingredients sample.webp]]

![[Homelab UI - kitchen recipes sample.webp]]

Below 767px, Ingredients' 6-column table gives way to a stacked card list: the table's own `overflow-x: auto` scroller, nested inside the page's vertical scroll, is a well-known mobile trap where a drag can get captured by the horizontal scroller instead of the page — this is what "stuck, can't scroll past it" on a phone looked like (sample data):

![[Homelab UI - kitchen ingredients mobile sample.webp]]

> [!bug]- `query` vs `q` — the search did nothing for weeks
> The backend's route read `query: str | None = Query(default=None)`, but every caller — this page, the ingredient-row autocomplete — sends `?q=…`. FastAPI binds a query parameter to the Python argument's own name unless told otherwise, so `query` stayed `None` on every request and `list_or_search` silently always took its unfiltered `else` branch: a real, plausible page of ingredients, just never the right one. No test called the endpoint, so nothing caught it. Fixed with `Query(default=None, alias="q")` ([[Kitchen Atelier decisions]], 2026-11-19).

**Delete** on a Recipes card removes that recipe *and every saved version* — `DELETE /v1/recipes/{id}`, no soft-delete, no undo beyond the native confirm dialog naming the recipe. **Details** on an Ingredients row opens the exact same modal component the editor's green check does (`IngredientDetailModal`, shared between both): every CIQUAL nutrient on file, grouped, with a value CIQUAL never measured simply left out rather than shown as a misleading zero ([[Kitchen Atelier ingredients]]).

> [!bug]- Saving with no ingredient or no step showed `[object Object]`
> `RecipeDraftSchema` requires at least one ingredient and one method step; a save missing either fails FastAPI's own request validation (422) before the handler runs, and FastAPI's default error body is an *array* of `{loc, msg, type}` objects, not the `{"detail": "<string>"}` string shape every other error here uses. The frontend handed that array straight to `new Error(...)`, which JavaScript stringifies as `"[object Object]"`. Fixed on both ends — kitchen-atelier now turns a validation error into one readable string, and the frontend only trusts `detail` when it's actually a string either way ([[Kitchen Atelier decisions]], 2026-11-19).

## Use it to
Draft a recipe, scale it when the guest count changes (Auto-Scale on), and save a version before you change the sauce — the old version stays exactly as it was, read-only, a click away on the version stepper that appears next to the course pills once you've saved at least once. Browse or search the catalog from **Ingredients**, or jump back into a past recipe from **Recipes** — **Delete** there is permanent.

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
