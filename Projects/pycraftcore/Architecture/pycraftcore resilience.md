---
type: architecture
project: "[[pycraftcore]]"
order: 4
tags: [pycraftcore, architecture, reliability]
updated: 2026-11-08
---

# pycraftcore resilience

> `resilient_http` is an httpx transport with three defences: a **timeout** on every call, **retries** with growing delays for errors worth retrying, and a **circuit breaker** that stops calling a backend that keeps failing, then tests it again after a pause.

Previous: [[pycraftcore web toolkits]] · Next: [[pycraftcore runtime sandbox]]

**Do it:** [[pycraftcore - Call HTTP resiliently]]

## The pieces
| Setting | Example | Means |
|---|---|---|
| `LimitsSettings(timeout=10)` | 10 s | No call waits forever |
| `RetrySettings(retry_count=3, retry_delay=1, max_retry_delay=20, should_retry=is_retryable)` | | Up to 3 retries, delays growing to 20 s, only for retryable errors ([[Retry and backoff]]) |
| `CircuitBreakerSettings(failure_threshold=3, recovery_timeout=30, is_excluded=is_business_error)` | | After 3 failures, fail fast for 30 s, then let one call test the backend ([[Circuit breaker]]) |

## What counts as a failure
- **Retryable:** connection errors, timeouts, 5xx, 429. Retrying a 400 just repeats a mistake.
- **Business errors** (4xx answers that are the backend working correctly) don't open the breaker: a "not found" isn't an outage.
- **A silent model** (agent-runtime) isn't retried: the request may be running; retrying doubles the cost.

## Why both
Retries fix *blips*; they make *outages* worse (every client hammers a dying service). The breaker turns an outage into fast failures and gives the backend room to recover. Together: try a little, then stop.

The client is a plain `httpx.AsyncClient`, so any library that accepts one (LangChain, the MCP SDK) gets the policies for free. Spans are created per call, so retries show in traces.

## Check yourself
1. Why must retries have a cap and a growing delay?
2. Why should a 404 not count towards opening the breaker?

## Go further
- [Martin Fowler: CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html).
- [AWS: timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).
