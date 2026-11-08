---
type: guide
project: "[[Web framework benchmark]]"
tags: [guide, web-framework]
updated: 2026-11-08
---

# Web framework benchmark - Configure the shop

> How much work each request does: database, fake API latencies, stream pace.

**Where:** on your Mac, in `web_framework` · **All guides:** [[Web framework benchmark guides]]

| Variable | Default | Meaning |
|---|---|---|
| `APP_ENV` | `debug` | Which `config/<APP_ENV>/` folder is read |
| `LOG_LEVEL` | `WARNING` | Log level; keep `WARNING` while benchmarking |
| `SHOP_DB_DIR` | `./var/db` | Folder of the SQLite database, rebuilt at each start |
| `WEB_BASE_PATH` | empty | A prefix for every route |
| `WEB_DOCS` | `false` | `true` serves the API documentation at `<base path>/docs` |

The work the shop does is set in `config/debug/`:

| File | What you set there |
|---|---|
| `server/asgi.yml` | `parameters`: the seed, the number of products, the image size |
| `operation/inventory.yml`, `pricing.yml` | `latency_ms`: how long each fake API call takes |
| `operation/market.yml` | `ticks` and `interval_ms`: the length and pace of the product stream |
| `connector/database.yml` | The SQLite database and its connection pool |

## Why it works
- [[pycraftcore configuration]] · [[Web framework benchmark design]]
