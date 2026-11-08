---
type: concept
domain: Web
level: beginner
tags: [concept, web, python]
updated: 2026-11-08
---

# Python web frameworks

> FastAPI, Litestar and BlackSheep are async ASGI frameworks for HTTP APIs. They differ in validation library, DI style, docs generation and speed — not in what you can build.

## How they compare
| | FastAPI | Litestar | BlackSheep |
|---|---|---|---|
| Validation | pydantic | msgspec (or pydantic, attrs) | pydantic / dataclasses |
| DI | `Depends` | `dependencies` dict, providers | services container |
| Docs | OpenAPI + Swagger, very mature | OpenAPI, several UIs | OpenAPI via `@docs` |
| Invalid body | 422 | 400 | 400 |
| Our benchmark (max load) | slowest (−20–35 %) | close to the top | fastest |
| At a realistic rate | ≈ the same | ≈ the same | ≈ the same |

## In our projects
- agent-runtime uses **Litestar** (msgspec schemas, DI, speed) ([[Agent runtime]]).
- pycraftcore gives all three the same toolkit ([[pycraftcore web toolkits]]); [[Web framework benchmark]] measured them.

## Check yourself
1. If all three are equal at a realistic load, what should decide the choice?

## Go further
- [FastAPI](https://fastapi.tiangolo.com/), [Litestar](https://docs.litestar.dev/), [BlackSheep](https://www.neoteroi.dev/blacksheep/).
