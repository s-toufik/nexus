---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Add a module or an adapter

> A new capability (module) or a new backend for an existing one (adapter), in the shape every module shares.

**Where:** on your Mac, in `pycraftcore` · **All guides:** [[pycraftcore guides]]

## How a module is organised

Every package follows the same shape, so a new backend is a new adapter, never a change for the services that use the port:

```text
  pycraftcore/<module>/
  ├── port/            Protocols the services depend on (AsyncRepository, Code, Logger…)
  ├── adapter/         Implementations (SqliteRepository, PythonSafeCode, StandardLogger…)
  ├── configuration/   Pydantic settings objects (RetrySettings, CircuitBreakerSettings…)
  ├── schema/          Data passed across the port (CodeResult, SafeCodeSettings…)
  └── enum/            Fixed choices (ConnectorType, HttpMethod…)
```

Not every module needs every folder: add a folder when it has something to hold.

## Design rules

- Services import the **port** and receive an adapter; they never construct a third-party client themselves.
- Adapters are thin: they translate between the port and the library, and keep library types out of the port.
- Settings are validated pydantic models; nothing reads environment variables except the configuration loader.
- Every public module is typed: `ty` runs in strict mode.

## Steps

1. Define the protocol in `<module>/port/`.
2. Implement it in `<module>/adapter/`, with its settings in `configuration/` and the data it exchanges in `schema/`.
3. Export the public names from the package's `__init__.py`.
4. Declare its third-party packages as an extra named after the module in `[project.optional-dependencies]` (pull in other modules with `pycraftcore[<module>]`). Then add it to `all`, to the [[pycraftcore - Install it]] table, and to the `extras` matrix in `.github/workflows/cicd.yml`, which installs each extra alone and imports its package.
5. Add tests under `tests/<module>/`, and the module to [[pycraftcore]] — with a short example under Using pycraftcore if services will use it directly.

## Why it works
- [[pycraftcore modules]] · [[Hexagonal architecture]] · [[Dependency injection]]
