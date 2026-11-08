---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Add a web framework

> A new `web_<name>` toolkit with the same four functions as the others, checked by the shared tests.

**Where:** on your Mac, in `pycraftcore` · **All guides:** [[pycraftcore guides]]

1. Create `pycraftcore/web_<name>/` with the modules the other toolkits have, using the framework's own types: `app_factory.create_app`, `actuator_router`, `event_stream` and `detail_handler`. `create_app` puts the routes under `api.base_path`, adds `RequestIDMiddleware`, CORS and the documentation from `ApiSettings`, runs the `lifespan`, and passes every other option to the framework.
2. Add the extra `web_<name> = ["<framework>", "pycraftcore[web]"]`, then add it to `all`, to the [[pycraftcore - Install it]] table and to the CI `extras` matrix.
3. Write the test orders app in the framework's own style in `tests/web/apps/<name>_orders.py` (start from one of the others) and add it to `EVERY_TOOLKIT` in `tests/web/apps/__init__.py`. The shared tests then check it like the others: routes and bodies, request id, statuses, errors, event streams and client disconnect, CORS, base path, documentation, actuator and lifespan.

## Why it works
- [[pycraftcore web toolkits]] · [[Python web frameworks]]
