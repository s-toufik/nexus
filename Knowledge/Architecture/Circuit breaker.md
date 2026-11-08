---
type: concept
domain: Architecture
level: intermediate
tags: [concept, reliability]
updated: 2026-11-08
---

# Circuit breaker

> A guard around calls to a dependency. After too many failures it **opens**: calls fail immediately without reaching the dependency. After a pause it goes **half-open** and lets one call through; success **closes** it again, failure re-opens it.

## Why it matters
When a backend is down, waiting for timeouts on every call ties up your workers and piles load on a service trying to recover. Failing fast protects both sides and makes the outage visible.

## How it works
```text
 CLOSED ── failures ≥ threshold ──► OPEN ── recovery_timeout ──► HALF-OPEN ── success ──► CLOSED
    ▲                                 ▲                              │
    └──────── (counts reset) ─────────┴────────── failure ───────────┘
```
- `failure_threshold`, `recovery_timeout`, and **what counts as a failure** — business errors (a 404 that's a correct answer) must be excluded.
- One breaker per dependency, shared across requests.
- Report state in metrics/logs: an open breaker is an alert.

## In our projects
pycraftcore `circuit_breaker` (aiobreaker), used by `resilient_http` with `failure_threshold=3, recovery_timeout=30, is_excluded=is_business_error` ([[pycraftcore resilience]]).

## Check yourself
1. What's half-open for?
2. Why shouldn't a 404 count as a failure?

## Go further
- [Martin Fowler: CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html).
- Michael Nygard, *Release It!* — where the pattern was popularised.
