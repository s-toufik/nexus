---
type: architecture
project: "[[Kitchen Atelier]]"
order: 1
tags: [kitchen-atelier, architecture, python]
updated: 2026-11-18
---

# Kitchen Atelier structure

> Same hexagonal shape as [[Agent runtime]] and [[Agent toolbox]]: `domain` has no framework dependency at all, `application` holds the ports and use cases, `adapter` talks to MongoDB, PostgreSQL and CIQUAL, `bootstrap` wires it into FastAPI through [[pycraftcore]]'s configuration and DI conventions.

Back: [[Kitchen Atelier]] · Next: [[Kitchen Atelier ingredients]]

**Do it:** [[Kitchen Atelier - Run it locally]]

## The layers
```text
src/kitchen_atelier/
├── domain/
│   ├── recipe/     recipe.py · recipe_version.py · recipe_draft.py · ingredient_line.py · unit.py · exception/
│   └── ingredient/ ingredient.py · exception/
├── application/
│   ├── port/inbound/   one port per use case (create_recipe_port.py, save_recipe_version_port.py…)
│   └── port/outbound/  recipe_repository_port.py, ingredient_repository_port.py, ingredient_source_port.py
│   └── use_case/       create_recipe.py, save_recipe_version.py, search_ingredients.py, refresh_ingredient_catalog.py…
└── adapter/
    ├── outbound/mongo/   recipe_repository.py (+ recipe_mapper.py) — motor
    ├── outbound/sql/     ingredient_repository.py — the `kitchen` Postgres schema
    └── outbound/ciqual/  ciqual_source.py, ciqual_parser.py — the bulk CSV/Excel download
```
`bootstrap/application` wires the FastAPI routes; `bootstrap/configuration` and `bootstrap/di` follow the same OmegaConf `root.yml` + `connector`/`operation` profile pattern as agent-runtime and agent-toolbox. `tests/architecture/test_boundaries.py` enforces that `domain/` imports nothing from `adapter/` or a web framework ([[Architecture tests]]).

## The recipe/version model
A `Recipe` is just a header (id, title, current version number). A `RecipeVersion` is an **immutable snapshot**: version number, saved-at, title, subtitle, course, portions, prep/cook time, its `IngredientLine`s, steps, sensory notes — everything a recipe card shows, all in one document. Nothing is ever edited in place; `SaveRecipeVersion` appends the next version and refuses a save whose `based_on_version` isn't the current latest (`StaleVersion`, HTTP 409) ([[Kitchen Atelier decisions]]).

An `IngredientLine` carries its own macros (`kcal_per_100g`, `protein_per_100g`…), copied from the catalog **at save time** — denormalized on purpose, so refreshing the PostgreSQL catalog next week never changes a recipe you already saved and plated.

## Units
European only, in `domain/recipe/unit.py`: `g, kg, ml, cl, L, càs` (tablespoon, 15 ml), `càc` (teaspoon, 5 ml), `pincée` (pinch), `pièce` (piece) — each with a gram-equivalence so the frontend can auto-scale a recipe's quantities when portions change.

## What the REST surface looks like
| Endpoint | Does |
|---|---|
| `POST/GET /v1/recipes` | create, list recipes |
| `GET /v1/recipes/{id}/versions` | every saved version, newest last |
| `POST /v1/recipes/{id}/versions` | save the next version (409 if stale) |
| `GET /v1/recipes/{id}/versions/{n}` | one version, read-only |
| `GET /v1/ingredients?q=…` | catalog autocomplete |

[[Homelab UI page - Kitchen]]'s `RecipeEditorStore` maps these snake_case JSON shapes to camelCase domain types through dedicated mapper functions, and switches its displayed data between "the live draft" and "a historical version" depending what's selected.

## Check yourself
1. Why does an `IngredientLine` store its own `kcal_per_100g` instead of just an `ingredient_ref_id` looked up live?
> [!success]- Answer
> Because the catalog refreshes weekly from CIQUAL and ingredient values can change (a correction, a new source). If a saved recipe looked the number up live, its nutrition numbers would silently drift every time the catalog refreshes. Denormalizing at save time freezes history the same way the version snapshot itself does.
2. You call `POST /v1/recipes/{id}/versions` with `based_on_version: 3`, but someone else already saved version 4 first. What happens, and why not just save version 5 on top?
> [!success]- Answer
> `StaleVersion`, HTTP 409 — the save is refused rather than silently becoming version 5 on top of a version 4 it never saw. Saving blind on top of a concurrent edit would lose whatever changed between 3 and 4 with no record it happened; refusing forces a conscious re-fork.

## Go further
- [FastAPI](https://fastapi.tiangolo.com/) · [Motor (async MongoDB driver)](https://motor.readthedocs.io/).
