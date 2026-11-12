---
type: concept
domain: Architecture
level: beginner
tags: [concept, reliability]
updated: 2026-11-08
---

# Retry and backoff

> When a call fails for a reason that may pass (a dropped connection, a 503, a 429), try again — a limited number of times, waiting longer between attempts (**exponential backoff**), with some randomness (**jitter**) so many clients don't retry in lockstep.

## Why it matters
Networks blip; a single retry hides most transient failures. But naive retries turn a struggling service into a dead one (every client multiplies its load) and can repeat side effects.

## How it works
- **Retry only what's retryable:** connection errors, timeouts, 5xx, 429. Not 400/401/404 — they'll fail again.
- **Backoff:** delay = base × 2ⁿ, capped (`max_retry_delay`); add jitter.
- **Respect `Retry-After`** on 429/503.
- **Idempotency:** retrying a non-idempotent POST may create two orders — use idempotency keys or don't retry.
- **Budget:** a total deadline beats many retries.
- Pair with a [[Circuit breaker]] for outages.

## In our projects
- pycraftcore `retry` (tenacity) and `resilient_http`: `retry_count=3, retry_delay=1, max_retry_delay=20, should_retry=is_retryable` ([[pycraftcore resilience]]).
- agent-runtime retries model calls after 5xx, 429 or connection failures — never a silent model, whose request may still be running ([[Agent runtime - Configure it]]).
- The evaluation retries ERROR runs with a new conversation ([[Agent runtime evaluation]]).

## Check yourself
1. Why is retrying a 400 pointless, and retrying a POST risky?
> [!success]- Answer
> A 400 means the request itself is wrong: sending it again gives the same 400. A POST may have reached the server even when the answer was lost, so a retry can do it twice (two orders, two payments) unless it carries an idempotency key.
2. What does jitter prevent?
> [!success]- Answer
> Many clients that failed at the same moment retrying at the same moments, in waves that knock the recovering service down again. Random delays spread them out.

## Go further
- [AWS Builders' Library: timeouts, retries and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter).
- [Google SRE book: handling overload](https://sre.google/sre-book/handling-overload/).
