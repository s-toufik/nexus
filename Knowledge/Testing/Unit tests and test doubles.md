---
type: concept
domain: Testing
level: beginner
tags: [concept, testing]
updated: 2026-11-08
---

# Unit tests and test doubles

> A unit test checks one piece of behaviour quickly and in isolation. What the piece depends on is replaced by a **test double**: a fake, stub, mock or scripted object that behaves predictably.

## Why it matters
Fast, reliable tests are what let you change code with confidence. Tests that call real models, networks or databases are slow, flaky and expensive — doubles remove that, as long as the design lets you inject them ([[Dependency injection]]).

## How it works
| Double | Is |
|---|---|
| Stub | Returns canned answers |
| Fake | A working lightweight implementation (in-memory repository) |
| Mock | Records calls so the test can assert on them |
| Scripted model | A fake LLM returning prepared outputs in order |
- **Test pyramid:** many unit tests, fewer integration/contract tests, few end-to-end ones.
- Arrange → act → assert; one behaviour per test; names that read as specs.
- **Property-based tests** (hypothesis) generate inputs to find edge cases.
- Coverage shows what's *not* tested, not that what's tested is right.

## In our projects
- agent-runtime: scripted models make every route of `TurnPolicy` reachable; scenarios run on two runners ([[Agent runtime turn]]).
- agent-toolbox: a fake MCP `ClientSession` for republished tools; contract test for tool parity ([[Agent toolbox layers]]).
- homelab-ui: vitest specs next to stores and domain functions (`graph-execution.spec.ts`), an injectable storage for `localStorage`.
- pycraftcore: the same orders app per framework under shared tests ([[pycraftcore web toolkits]]).
- Tools: pytest, pytest-asyncio, hypothesis; vitest via `ng test`.

## Check yourself
1. Fake vs mock: when would you use each?
2. Why can't scripted models replace [[Agent runtime evaluation]]?

## Go further
- [Martin Fowler: Mocks aren't stubs](https://martinfowler.com/articles/mocksArentStubs.html), [the practical test pyramid](https://martinfowler.com/articles/practical-test-pyramid.html).
- [pytest](https://docs.pytest.org/), [Vitest](https://vitest.dev/), [Hypothesis](https://hypothesis.readthedocs.io/).
