---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Serve an HTTP API

> Build a Litestar, FastAPI or BlackSheep app with the same conventions: base path, request id, CORS, docs, errors, actuator, event streams.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

Pick a framework and write your routes with its own features: msgspec Structs and dependency injection with Litestar, pydantic and `Depends` with FastAPI, BlackSheep's binders and services. pycraftcore gives every framework the same toolkit, so what each service would otherwise repeat is done once: the request id, CORS, the API documentation, one base path for everything, `{"detail": …}` errors, the actuator, and server-sent events that stop when the client leaves.

```python
import msgspec
from litestar import get, post
from litestar.params import JSONBody
from litestar.response import Stream

from pycraftcore.web.actuator import Actuator
from pycraftcore.web.schema import ApiSettings
from pycraftcore.web.sse import EVENT_STREAM_MEDIA_TYPE, with_heartbeat
from pycraftcore.web_litestar import actuator_router, create_app, detail_handler, event_stream

class Order(msgspec.Struct):
    reference: str

@post("/v1/orders", status_code=200)
async def place(data: JSONBody[Order]) -> Order:
    return await orders.place(data)

@get("/v1/orders/updates", media_type=EVENT_STREAM_MEDIA_TYPE)
async def updates() -> Stream:
    return event_stream(with_heartbeat(orders.updates(), every=15.0))

api = ApiSettings(
    title="orders-api", version="1.4.0", base_path="/orders-api", docs=True, cors_origins=("*",)
)
actuator = Actuator("orders-api", "1.4.0", "staging", "team@example.com", is_ready=lambda: ready)

app = create_app(
    api,
    routes=[place, updates, actuator_router(actuator)],
    lifespan=boot_and_shutdown,
    exception_handlers={OutOfStock: detail_handler(503)},
    debug=False,
)
```

Each toolkit — `pycraftcore.web_litestar`, `web_fastapi`, `web_blacksheep` — has the same four functions, with the framework's own types:

| Function | What it gives you |
|---|---|
| `create_app(api, routes=…, lifespan=…, middleware=…, exception_handlers=…, **options)` | The framework's app: your routes under `api.base_path`, `RequestIDMiddleware` first, CORS from `api.cors_origins`, and when `api.docs` is on Swagger UI at `{base_path}/docs` and the schema at `{base_path}/docs/openapi.json` (no documentation otherwise). Every other option (above, `debug`) goes to the framework unchanged and wins over pycraftcore's defaults |
| `actuator_router(actuator)` | `/actuator/health`, `/health/liveness`, `/health/readiness` (503 until `is_ready()` is true) and `/info`, as a native router |
| `event_stream(frames)` | A native `text/event-stream` response with the stream headers. When the client leaves, the stream stops and your generator's `finally` runs |
| `detail_handler(status_code)` | A native exception handler answering `{"detail": "<message>"}` with that status |

- **`routes`** takes what the framework mounts: Litestar route handlers, controllers and routers; FastAPI `APIRouter`s; BlackSheep `Router`s.
- **`lifespan`** is a plain async context manager (start and stop your pools and clients); routes get what it builds through the framework's dependency injection.
- **`base_path`** (empty by default) puts every route under a prefix, the actuator and the documentation included: above, `POST /orders-api/v1/orders`. Use it when a gateway forwards a path prefix without removing it. It starts with `/` and does not end with one, otherwise `ApiSettings` raises `ValueError`.
- **From the configuration**: a server in `<env>/server/*.yml` gives `ApiSettings(title=server.name, version=…, base_path=server.base_path, docs=server.docs, cors_origins=server.cors_origins)`.
- **Invalid bodies** are answered the framework's way: FastAPI 422, Litestar and BlackSheep 400.

What each framework asks of your routes:

- **Litestar**: declare the body as `data: JSONBody[Model]`, and give event-stream routes `media_type=EVENT_STREAM_MEDIA_TYPE` so the documentation shows it. A POST answers 201 unless you set `status_code`.
- **FastAPI**: give event-stream routes `response_class=EventStreamResponse` (from `pycraftcore.web_fastapi`) so the documentation shows `text/event-stream`.
- **BlackSheep**: document statuses and media types with BlackSheep's `@docs(...)` from `openapi_handler(api)`, and pass that handler to `create_app(openapi=…)`. `event_stream(frames, request)` also takes the request: BlackSheep does not stop a stream when its client leaves, so the stream waits for the client's disconnect and stops itself then, at no cost per frame. `/docs` redirects to `/docs/`. `create_app` returns the app wrapped in `RequestIDMiddleware`, so configure the application through `create_app`'s arguments.

Long silences in an event stream make proxies close the connection. `with_heartbeat` (`pycraftcore.web.sse`) sends an SSE comment (`: heartbeat`) whenever the stream has been quiet for `every` seconds; clients ignore it. It is built on `with_idle_ticks(source, every)` (`pycraftcore.web.streaming`), which yields the source's items plus an `IDLE` marker each time nothing arrived in time. Closing it closes the source, even while it is waiting.

For a framework that does not stop a stream when its client leaves, `cancel_on_disconnect(source, disconnected)` (`pycraftcore.web.streaming`) passes the source's items through until `disconnected()` returns, then ends the stream and closes the source, even while it is waiting for its next item. One watcher task per stream does the waiting, so frames pass through without any extra work. BlackSheep's `event_stream` is built on it.

## Why it works
- [[pycraftcore web toolkits]] · [[Python web frameworks]] · [[ASGI]] · [[Server-sent events]]
