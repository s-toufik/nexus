---
type: repository
project: "[[Kitchen Atelier]]"
repo: kitchen-atelier
language: Python
status: active
tags: [repository, kitchen-atelier, python]
updated: 2026-11-18
---

# kitchen-atelier

> The API behind [[Homelab UI]]'s Kitchen page: recipes and versions in MongoDB, a CIQUAL-backed ingredient catalog in PostgreSQL. FastAPI, hexagonal, same shape as [[Agent runtime]] / [[Agent toolbox]].

## Layout
| Path | What it holds |
|---|---|
| `src/kitchen_atelier/domain/` | `recipe/` (recipe, version, draft, ingredient line, unit), `ingredient/` — no framework imports |
| `src/kitchen_atelier/application/` | inbound/outbound ports, use cases (create/save/list recipes, search ingredients, refresh catalog) |
| `src/kitchen_atelier/adapter/outbound/mongo/` | recipe + version repository, motor |
| `src/kitchen_atelier/adapter/outbound/sql/` | the `kitchen` Postgres schema |
| `src/kitchen_atelier/adapter/outbound/ciqual/` | the CIQUAL CSV/Excel download + parser |
| `src/bootstrap/` | configuration, DI, the FastAPI app, the refresh job's CLI entrypoint |
| `devops/docker/`, `devops/helm/values.yml` | the image, and its chart values (port 8002, env, the weekly CronJob) |
| `tests/architecture/` | `test_boundaries.py` — no adapter import in `domain/` |

## How it runs
`make run` (`uv run granian …`) serves the FastAPI app on `:8002`. Config follows [[pycraftcore]]'s `root.yml` + `connector`/`operation` profile pattern, same as agent-runtime and agent-toolbox.

## How it's released
Not yet released: tag on `main` → image (amd64 + arm64) + kube-charts `app` chart → bump `apps.kitchenAtelier` in homelab-infra's `versions.yaml` → `make apply R=kitchen-atelier` ([[Homelab deployment]], [[Kitchen Atelier - Run it locally]]).

## Knowledge it uses
[[Hexagonal architecture]] · [[Dependency injection]] · [[ASGI]] · [[Data validation with pydantic and msgspec]] · [[pycraftcore]]
