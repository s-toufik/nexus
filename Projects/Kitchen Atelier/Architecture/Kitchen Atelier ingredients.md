---
type: architecture
project: "[[Kitchen Atelier]]"
order: 2
tags: [kitchen-atelier, architecture, data]
updated: 2026-11-18
---

# Kitchen Atelier ingredients

> The ingredient/macro catalog is **ANSES's CIQUAL table** — the official French food-composition data, free as a bulk CSV/Excel export on data.gouv.fr. There is no live CIQUAL API, so a weekly job downloads the whole table and diffs it against what's stored, rather than calling a per-ingredient endpoint.

Back: [[Kitchen Atelier]] · Previous: [[Kitchen Atelier structure]]

**Do it:** [[Kitchen Atelier - Refresh the ingredient catalog]]

## Why CIQUAL, not Open Food Facts
CIQUAL is the authoritative French per-100g macro table for raw and cooked *generic* ingredients ("Beurre doux", "Farine T55") — exactly what a recipe needs. [Open Food Facts](https://world.openfoodfacts.org/) is barcode/branded-product centred (a specific supermarket's butter, not "butter"), the wrong shape for a recipe's ingredient list.

## Where it lives
A `kitchen` schema **inside the shared `homelab` PostgreSQL database** (not a database of its own — [[Kitchen Atelier decisions]]), one table:

```sql
kitchen.ingredients (
  ciqual_code       text primary key,
  name_fr           text not null,
  name_search       text not null,   -- normalized, for the autocomplete
  kcal_per_100g      double precision,
  protein_per_100g   double precision,
  carb_per_100g      double precision,
  fat_per_100g       double precision,
  source            text default 'ciqual',
  updated_at        timestamptz
)
```
Owned by the `kitchen_atelier` role ([[Homelab data]]), indexed on `name_search` for `GET /v1/ingredients?q=…`.

## The refresh job
`adapter/outbound/ciqual/`: `ciqual_source.py` downloads the published dataset (`CIQUAL_DATASET_URL`, a data.gouv.fr resource id — still a placeholder in `devops/helm/values.yml`, needs the real URL before this runs for real); `ciqual_parser.py` reads ANSES's French column headers and maps each row to the `Ingredient` domain type. `RefreshIngredientCatalog` (the use case) diffs the parsed rows against what's stored and writes only what changed — an unchanged week is a no-op, not a rewrite of the whole table.

In the homelab this runs as a **weekly CronJob** (`0 4 * * 1`, Monday 04:00 — CIQUAL changes rarely), the same container image as the API with a different entrypoint (`kitchen-atelier-refresh-ingredients`); by hand it's `make refresh_ingredients`.

## Why a refresh never touches a saved recipe
Every `IngredientLine` on a saved `RecipeVersion` carries its own copy of the macros, frozen at save time ([[Kitchen Atelier structure]]). So the refresh job writing new numbers into `kitchen.ingredients` changes what a *new* autocomplete search returns, never what an already-plated recipe says it cost.

## Check yourself
1. Why download the whole CIQUAL table every week instead of looking up one ingredient at a time?
> [!success]- Answer
> There is no live per-ingredient CIQUAL API — ANSES only publishes a bulk CSV/Excel export. A per-ingredient lookup isn't an option; the only way to have the data at all is to have the whole table, and diffing it keeps a no-op week cheap.
2. The catalog refresh changes "Beurre doux"'s `kcal_per_100g` from 717 to 710. What happens to a recipe saved last month that used it?
> [!success]- Answer
> Nothing — its `IngredientLine` already has its own `kcal_per_100g: 717` frozen at save time. Only a *new* autocomplete search or a *new* ingredient line added to a recipe picks up 710.

## Go further
- [CIQUAL table (ANSES, data.gouv.fr)](https://www.data.gouv.fr/fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual/).
