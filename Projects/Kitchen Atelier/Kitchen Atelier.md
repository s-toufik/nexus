---
type: project
status: active
started: 2026-11-18
repos: [kitchen-atelier]
tags: [project, kitchen-atelier, python, homelab]
updated: 2026-11-19
---

# Kitchen Atelier

> The backend behind [[Homelab UI]]'s Kitchen page: versioned recipes in MongoDB, and a French ingredient/macro catalog in PostgreSQL kept fresh by a weekly job against ANSES's CIQUAL table. Not to be confused with the **kitchen *agent*** (chat, `agent-runtime/agents/kitchen`, already existed) — this project is the structured recipe-card app it now has real data to reason over.

## In one picture
![[Kitchen Atelier.canvas]]

## Why it exists
- **A real recipe card, not a chat transcript.** Scaling a recipe, tracking macros per portion and keeping a version you can go back to needs structured data and a UI built for it, not a conversation.
- **The kitchen agent gets to read it.** Through [[Agent toolbox]]'s `scope_kitchen`, the agent can query the same recipes and ingredients instead of only what's in the chat ([[Kitchen Atelier decisions]]).
- **Fits the shared homelab stack exactly.** No new database, no new MCP server: a schema inside the existing `homelab` PostgreSQL database, a database inside the existing MongoDB instance ([[Homelab data]]).

## What it does
- `POST /v1/recipes`, `GET /v1/recipes` — create and list recipes.
- `GET /v1/recipes/{id}/versions`, `POST /v1/recipes/{id}/versions`, `GET /v1/recipes/{id}/versions/{n}` — every save appends an immutable version; nothing is edited in place.
- `DELETE /v1/recipes/{id}` — removes the recipe and every one of its versions; no soft-delete, no undo ([[Kitchen Atelier decisions]]).
- `GET /v1/ingredients?q=…` — autocomplete against the CIQUAL-backed catalog, with per-100g macros.
- A weekly CronJob re-downloads ANSES's CIQUAL bulk export and diffs it into the catalog; an unchanged week is a no-op.

## How it's built
| Part | Repository | Role |
|---|---|---|
| The API | [[kitchen-atelier]] | FastAPI, hexagonal layout, same shape as [[Agent runtime]] / [[Agent toolbox]] |
| Recipes | MongoDB, database `kitchen` | one document per recipe, one per version ([[Kitchen Atelier structure]]) |
| Ingredients | PostgreSQL, schema `kitchen` inside the shared `homelab` database | the CIQUAL-backed catalog ([[Kitchen Atelier ingredients]]) |
| Served to the browser | [[Homelab UI]]'s Kitchen page, through `/api/kitchen/…` | [[Homelab gateway and sign-in]] |
| Read by the agent | [[Agent toolbox]]'s `scope_kitchen` | curated read-only Mongo/Postgres tools, not the full `mongodb_*`/`postgres_*` wildcard |
| Deployed by | [[Homelab deployment]] | tag → image + chart → `versions.yaml` → `make apply R=kitchen-atelier` |

## Read it in this order
1. [[Kitchen Atelier structure]] — the hexagonal layers, the recipe/version domain model, why a save never edits history.
2. [[Kitchen Atelier ingredients]] — the CIQUAL catalog: where it comes from, how the refresh job stays a no-op most weeks.

Then [[Kitchen Atelier decisions]] and [[Kitchen Atelier guides]].

## Knowledge it uses
[[Hexagonal architecture]] · [[Dependency injection]] · [[MongoDB]] · [[Row-level security|PostgreSQL roles and schemas]] · [[ASGI]] · [[asyncio]] · [[Data validation with pydantic and msgspec]] · [[Model Context Protocol]] · [[pycraftcore]]

## Where it stands (2026-11-19)
- **Deployed and refreshing for real:** 0.3.1 fixed a `PYTHONPATH` bug that crashed the refresh job's console-script entrypoint (`ModuleNotFoundError: No module named 'src'` — the ASGI app was never affected, only the CronJob); the catalog has since refreshed successfully against the live CIQUAL fallback dataset (3186 ingredients).
- **0.3.2, released:** `GET /v1/ingredients` fixed to actually honour `?q=…` ([[Kitchen Atelier decisions]]) — it silently ignored it before, always returning the unfiltered default page. homelab-ui's Ingredients and Recipes pages (`v2.5.1`) gained real search on top of this fix, and Ingredients gained a mobile card layout.
- **0.3.3, built, not yet deployed:** `DELETE /v1/recipes/{id}` (cascades to every version), a 422 handler so a validation failure reads as a real sentence instead of `[object Object]`, and homelab-ui (`v2.5.2`) gained a Recipes **Delete** button, an Ingredients **Details** button reusing the editor's full-nutrient-card modal, and a fixed ingredient-row control layout ([[Kitchen Atelier decisions]]).
- **`CIQUAL_DATASET_URL`'s primary host has been unreliable** (503s) in practice; the fallback (`CIQUAL_FALLBACK_DATASET_URL`, a Zenodo mirror) is what's actually served the real homelab so far.
- **Next:** see the [[Log]].
