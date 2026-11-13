---
type: decisions
project: "[[pycraftcore]]"
tags: [pycraftcore, decisions]
updated: 2026-11-08
---

# pycraftcore decisions

## Building blocks, not a framework
- **Decision:** independent modules, each a port + adapters; services compose what they need.
- **Why:** no inversion of control imposed on services; any module can be replaced or skipped.
- **Alternatives:** a framework owning the app lifecycle (tighter, harder to leave).

## One extra per module
- **Decision:** third-party packages behind extras; CI installs each extra alone.
- **Why:** small images and dependency trees; import errors surface in CI, not in production.

## Three web frameworks behind one toolkit contract
- **Decision:** `web_litestar`, `web_fastapi`, `web_blacksheep` with the same four functions, shared tests.
- **Why:** services pick the framework that fits (FastAPI for agent-runtime, all three in the benchmark) while keeping identical conventions; makes [[Web framework benchmark]] fair.
- **Consequences:** every web feature is built three times — the shared tests keep them equal.

## Configuration as connectors, operations and servers
- **Decision:** YAML + OmegaConf, env interpolation, pydantic validation; only the loader reads the environment.
- **Why:** one vocabulary for every service; fail at boot, not mid-request.

## A process-level Python sandbox with a host bridge
- **Decision:** subprocess + rlimits + import/open guards + loopback token bridge.
- **Why:** cheap enough to run per tool call, good enough inside a fenced pod.
- **Alternatives:** container per run (stronger, slower, needs a runtime); in-process `exec` (no isolation).
