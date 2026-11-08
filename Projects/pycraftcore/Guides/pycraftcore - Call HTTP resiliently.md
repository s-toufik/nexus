---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Call HTTP resiliently

> An httpx client with retries for what is worth retrying and a circuit breaker for backends that keep failing.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

A transport that retries what is worth retrying and stops calling a backend that keeps failing:

```python
from pycraftcore.circuit_breaker.configuration import CircuitBreakerSettings
from pycraftcore.http.configuration import HttpClientSettings, LimitsSettings
from pycraftcore.http.policy.http_error_policy import is_business_error, is_retryable
from pycraftcore.resilient_http.adapter import ResilientTransportFactory
from pycraftcore.resilient_http.configuration import ResilientHttpSettings
from pycraftcore.retry.configuration import RetrySettings

settings = ResilientHttpSettings(
    http=HttpClientSettings(limits=LimitsSettings(timeout=10)),
    retry=RetrySettings(
        retry_count=3, retry_delay=1, max_retry_delay=20, should_retry=is_retryable
    ),
    circuit_breaker=CircuitBreakerSettings(
        failure_threshold=3, recovery_timeout=30, is_excluded=is_business_error, name="weather"
    ),
)
client = ResilientTransportFactory(
    settings=settings, trace_manager=tracer, logger=logger
).create_async_client()
```

`client` is an `httpx.AsyncClient`: pass it to any library that accepts one.

## Why it works
- [[Retry and backoff]] · [[Circuit breaker]] · [[pycraftcore modules]]
