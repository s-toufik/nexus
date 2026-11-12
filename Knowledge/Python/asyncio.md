---
type: concept
domain: Python
level: intermediate
tags: [concept, python, concurrency]
updated: 2026-11-08
---

# asyncio

> Python's single-threaded concurrency: `async def` functions (coroutines) pause at `await` while waiting for I/O, letting the event loop run others. Thousands of slow network calls can be in flight in one thread.

## How it works
- `await` only yields at I/O points; CPU-heavy code blocks everyone → run it in a process (the sandbox) or a thread.
- Run things concurrently: `asyncio.gather(a(), b())`, `TaskGroup`; time-box them: `asyncio.timeout(10)`.
- **Async generators** (`async def … yield`) stream results — SSE frames, LLM tokens.
- **Cancellation:** a cancelled task gets `CancelledError` at its next `await`; clean up in `finally` (that's how streams stop when a client leaves).
- **Context variables** (`contextvars`) carry per-request data (the request id) across awaits.
- `uvloop`: a faster event loop.

## In our projects
- The shop calls stock and pricing APIs in parallel ([[Web framework benchmark design]]).
- agent-runtime starts `HandleMessage` in the background and streams events ([[Agent runtime turn]]).
- pycraftcore `request_id_context`, `with_idle_ticks`, `cancel_on_disconnect`, async repositories and HTTP clients.

## Check yourself
1. Why does a CPU-bound loop inside an `async` route hurt every other request?
> [!success]- Answer
> There's one thread and the event loop only switches tasks at an `await`. A loop that never awaits holds the thread, so every other request waits until it ends. Run CPU work in a process or a thread instead.
2. How does a request id reach every log line of that request?
> [!success]- Answer
> Through a context variable: middleware sets `request_id_context` when the request arrives, and it follows the request's task across every `await`. The logging setup reads it and adds it to every line.

## Go further
- [asyncio docs](https://docs.python.org/3/library/asyncio.html), [contextvars](https://docs.python.org/3/library/contextvars.html).
