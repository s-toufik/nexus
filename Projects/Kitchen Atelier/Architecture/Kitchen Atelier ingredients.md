---
type: architecture
project: "[[Kitchen Atelier]]"
order: 2
tags: [kitchen-atelier, architecture, data]
updated: 2026-11-19
---

# Kitchen Atelier ingredients

> The ingredient/macro catalog is **ANSES's CIQUAL table** — the official French food-composition data (74 constituents per food: energy, macros, sugars, fatty acids, minerals, vitamins), free as a bulk Excel export. There is no live CIQUAL API, so a weekly job downloads the whole table and diffs it against what's stored, rather than calling a per-ingredient endpoint.

Back: [[Kitchen Atelier]] · Previous: [[Kitchen Atelier structure]]

**Do it:** [[Kitchen Atelier - Refresh the ingredient catalog]]

## Why CIQUAL, not Open Food Facts
CIQUAL is the authoritative French per-100g macro table for raw and cooked *generic* ingredients ("Beurre doux", "Farine T55") — exactly what a recipe needs. [Open Food Facts](https://world.openfoodfacts.org/) is barcode/branded-product centred (a specific supermarket's butter, not "butter"), the wrong shape for a recipe's ingredient list.

## The domain model
`domain/ingredient/` is one small file per concept — `Food` (the aggregate: `identity`, `classification`, `nutrition`, `source`, `source_version`, `updated_at`), `FoodIdentity`, `FoodClassification`, and `NutritionalComposition`, itself six nested dataclasses: `Energy`, `Macronutrients`, `Sugars`, `FattyAcids`, `Minerals`, `Vitamins`. Every nutrient is a `Decimal | None` (the `Nutrient` alias) — `None` means CIQUAL never measured it, which is a different fact from "contains zero," so nothing silently defaults to 0 the way the original four-macro version did.

## Where it lives
A `kitchen` schema **inside the shared `homelab` PostgreSQL database** (not a database of its own — [[Kitchen Atelier decisions]]), one table: the frequently-sorted/filtered fields (`ciqual_code`, `name_fr`, `name_search`, `scientific_name`, the six `classification` columns, the four headline macros, `source`, `source_version`, `updated_at`) as real `numeric`/`text` columns, and the other ~60 nutrient values as one `nutrition jsonb` column shaped exactly like `NutritionalComposition` (Decimals round-trip through it as strings, to survive JSON with no precision loss). Owned by the `kitchen_atelier` role ([[Homelab data]]), indexed on `name_search` for `GET /v1/ingredients?q=…`.

## The refresh job
`adapter/outbound/ingestion/`: `http_ingredient_source.py` downloads the published dataset (`CIQUAL_DATASET_URL`; falls back to `CIQUAL_FALLBACK_DATASET_URL` if the primary host errors or doesn't respond) and detects its format from the URL, content type or magic bytes; `ciqual_row_mapper.py` reads ANSES's French column headers (fuzzy-matched for the four headline macros, exact-matched for everything else) and builds a `Food` per row. `RefreshIngredientCatalog` (the use case) diffs the parsed rows against what's stored and writes only what changed — an unchanged week is a no-op, not a rewrite of the whole table.

In the homelab this runs as a **weekly CronJob** (`0 4 * * 1`, Monday 04:00 — CIQUAL changes rarely), the same container image as the API with a different entrypoint (`kitchen-atelier-refresh-ingredients`); by hand it's `make refresh_ingredients`.

## Why a refresh never touches a saved recipe
Every `IngredientLine` on a saved `RecipeVersion` carries its own copy of the four headline macros, frozen at save time ([[Kitchen Atelier structure]]). So the refresh job writing new numbers into `kitchen.ingredients` changes what a *new* autocomplete search returns, never what an already-plated recipe says it cost.

## The full card, in homelab-ui
[[Homelab UI page - Kitchen]]'s ingredient row shows a green check once it's linked to the catalog; clicking it calls `GET /v1/ingredients/{ciqual_code}` and opens a read-only card of every nutrient CIQUAL recorded, grouped the same way the domain model is (energy, macros, sugars, fatty acids, minerals, vitamins) — a value CIQUAL never measured simply isn't shown, rather than appearing as a misleading zero.

## Check yourself
1. Why download the whole CIQUAL table every week instead of looking up one ingredient at a time?
> [!success]- Answer
> There is no live per-ingredient CIQUAL API — ANSES only publishes a bulk Excel export. A per-ingredient lookup isn't an option; the only way to have the data at all is to have the whole table, and diffing it keeps a no-op week cheap.
2. The catalog refresh changes "Beurre doux"'s `kcal_per_100g` from 717 to 710. What happens to a recipe saved last month that used it?
> [!success]- Answer
> Nothing — its `IngredientLine` already has its own `kcal_per_100g: 717` frozen at save time. Only a *new* autocomplete search or a *new* ingredient line added to a recipe picks up 710.
3. CIQUAL has no vitamin B12 value for "Pomme de terre" (potato — a plant has none). What does `nutrition.vitamins.vitamin_b12_ug` hold for it, and why not `0`?
> [!success]- Answer
> `None` — `Decimal | None` lets "never measured" stay distinct from "measured as zero," which a `0` default would have erased.

## Go further
- [CIQUAL table (ANSES, data.gouv.fr)](https://www.data.gouv.fr/fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual/) — official source, frozen at the 2020 edition; occasionally down for maintenance.
- [Zenodo mirror](https://zenodo.org/records/4770600) — the fallback URL, same 2020 French table.
