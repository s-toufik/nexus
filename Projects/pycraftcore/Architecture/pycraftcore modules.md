---
type: architecture
project: "[[pycraftcore]]"
order: 1
tags: [pycraftcore, architecture]
updated: 2026-11-08
---

# pycraftcore modules

> Every module has the same shape: `port/` (the Protocols services depend on), `adapter/` (implementations around a library), `configuration/` (pydantic settings), `schema/` (data crossing the port), `enum/`. Each module's third-party packages sit behind an **extra** of the same name, so a service installs only what it uses.

Back: [[pycraftcore]] · Next: [[pycraftcore configuration]]

**Do it:** [[pycraftcore - Add a module or an adapter]] · [[pycraftcore - Install it]]

## The shape
```text
pycraftcore/<module>/
├── port/            AsyncRepository, Code, Logger…           ← services import this
├── adapter/         SqliteRepository, PythonSafeCode…         ← thin translation to a library
├── configuration/   RetrySettings, CircuitBreakerSettings…    ← validated settings
├── schema/          CodeResult, SafeCodeSettings…             ← data passed across the port
└── enum/            ConnectorType, HttpMethod…
```
A new backend is a new adapter; services using the port don't change. This is [[Hexagonal architecture]] applied to a library: pycraftcore provides the *outbound adapters* services plug into their own ports.

## Design rules
- Services import the **port** and receive an adapter; they never construct a third-party client themselves ([[Dependency injection]]).
- Adapters are thin and keep library types out of the port.
- Settings are pydantic models; **only the configuration loader reads environment variables**.
- Everything public is typed; `ty` runs in strict mode.

## Extras: install only what you use
`pycraftcore[http,repository]`; bare `pycraftcore` has no third-party dependency (only `authentication`, `context`, `logger` work). Extras pull in other modules (`resilient_http` → `circuit_breaker`, `http`, `retry`, `telemetry`). CI installs **each extra alone** and imports its package — proving no module secretly depends on another's packages ([[Python packaging]]).

Rule for services: list every module you import, even if another extra brings it in — links between extras may change.

## Check yourself
1. Why must a service never construct an httpx client itself?
2. What does CI's "each extra alone" matrix catch?

## Go further
- [PEP 621 optional dependencies](https://packaging.python.org/en/latest/specifications/pyproject-toml/#dependencies-optional-dependencies).
- [typing.Protocol (PEP 544)](https://peps.python.org/pep-0544/).
