---
type: guide
project: "[[Kitchen Atelier]]"
tags: [guide, kitchen-atelier]
updated: 2026-11-18
---

# Kitchen Atelier - Run it locally

> Get the API answering on your Mac, against your own Postgres/Mongo or the homelab's.

**Where:** on your Mac, in `kitchen-atelier` · **All guides:** [[Kitchen Atelier guides]]

## 1. Set up
1. Install the toolchain:
   - `uv sync --group dev`
2. Fill in the connections:
   - `cp .env.example .env`
   - edit `.env`: the Postgres and Mongo connection fields, and `CIQUAL_DATASET_URL` (a data.gouv.fr resource id).
3. Check: `make check` — raw: lint + typecheck + `uv run pytest -q`.

## 2. Run it
1. Start the API:
   - `make run`
2. Check: `curl http://localhost:8002/actuator/health` → `200`.
3. Try an endpoint: `curl http://localhost:8002/v1/ingredients?q=beurre` → a JSON array (empty until the catalog has been refreshed at least once).

## 3. Load the ingredient catalog once
1. `make refresh_ingredients`
2. Check the log: the number of rows written; a second run right after should write 0 (the diff is a no-op).

## If it goes wrong
- `CIQUAL_DATASET_URL` still says `REPLACE-WITH-REAL-RESOURCE-ID`: the refresh has nothing to download — fill in the real data.gouv.fr resource id first.
- Postgres/Mongo connection refused: check `.env` against what's actually running (your own local databases, or the homelab's through a tunnel).

## Why it works
- [[Kitchen Atelier structure]] — the layers `make run` wires together.
- [[Kitchen Atelier ingredients]] — what `make refresh_ingredients` actually does.
