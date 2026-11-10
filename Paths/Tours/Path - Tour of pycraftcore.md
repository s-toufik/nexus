---
type: path
track: Tours
time: ~3 h
projects: ["[[pycraftcore]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of pycraftcore

> **Goal:** know the foundation every Python service here stands on — its modules, its shape, how services use it — and the principles it packages.
> **Time:** ~3 h. **Before:** [[Path - Tour of the agent toolbox]] helps (you've seen it used). **Then:** [[Path - Python for services]] · [[Path - Design that lasts]]. **All paths:** [[Paths]]

## 1. What it is, and why · ~30 min
**Read:** [[pycraftcore]] and its canvas.

**Check:**
1. Why a library of building blocks rather than a framework?
> [!success]- Answer
> Services keep control of their own structure and pick only the modules they need; any block can be replaced. A framework would own the app's lifecycle and be harder to leave ([[pycraftcore decisions]]).

## 2. Its shape · ~45 min
**Read:** [[pycraftcore modules]]

**Do:** 👀 `ls src/pycraftcore/repository src/pycraftcore/runtime` → `port/`, `adapter/`, `configuration/`, `schema/`… the same shape everywhere.

## 3. Where our services use it · ~1 h
**Do:** 👀 In agent-runtime and agent-toolbox: `grep -rhn "from pycraftcore" src | sed 's/:.*from /: from /' | sort | uniq -c | sort -rn | head -15` → which modules each uses most.

**Check:**
1. Name what agent-runtime takes from pycraftcore, and what the toolbox adds on top.
> [!success]- Answer
> Both: configuration, logging with the request id, telemetry. agent-runtime: the Litestar web toolkit (create_app, actuator, event streams) and HTTP. The toolbox also uses `runtime` (the sandbox and host bridge), `query_language` (read-only SQL), `repository` and `file_handler`.

## 4. The four big modules · ~45 min
**Read:** [[pycraftcore configuration]] · [[pycraftcore web toolkits]] · [[pycraftcore resilience]] · [[pycraftcore runtime sandbox]] (one pass each)

## 5. The principles inside
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| Ports and adapters in a library | [[Hexagonal architecture]] | `<module>/port/`, `<module>/adapter/` | [[Path - Design that lasts]] |
| Optional dependencies | [[Python packaging]] | extras, CI per-extra matrix | [[Path - Python for services]] |
| Config from env, validated | [[pycraftcore configuration]] | `application_configuration` | [[Path - Python for services]] |
| One API contract, many frameworks | [[ASGI]], [[Python web frameworks]] | `web`, `web_litestar/fastapi/blacksheep` | [[Path - Serving HTTP well]] |
| Retries and circuit breakers | [[Retry and backoff]], [[Circuit breaker]] | `resilient_http` | [[Path - Serving HTTP well]] |
| Data access behind an interface | [[Repository pattern]] | `repository` | [[Path - Design that lasts]] |
| Request-scoped context | [[asyncio]] | `context`, `RequestIDMiddleware` | [[Path - Python for services]] |
| Sandboxing untrusted code | [[AI agents and sandboxing]] | `runtime` | [[Path - Tools and safety]] |

**Milestone:** you can say, for any line of setup code in our services, which pycraftcore module it comes from and why it exists.
