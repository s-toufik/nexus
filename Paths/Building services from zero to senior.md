---
type: path
domain: Software engineering
tags: [path]
updated: 2026-11-08
---

# Building services from zero to senior

> From "I can write a function" to designing, building, testing and shipping services like the agent, its toolbox and the UI — and explaining every design choice in them. Six stages. Its sister path, [[Homelab from zero to senior]], covers the platform they run on.

**How to use it:** read the notes of a step, answer their *Check yourself*, then do the practice in our own repositories. Tick a step when you can explain it without looking.

## Stage 1 — Design that lasts
*Goal: know why our code is shaped the way it is.*
- [ ] 1. [[Hexagonal architecture]] — the shape of every service here.
- [ ] 2. [[Dependency injection]] — how the pieces get connected.
- [ ] 3. [[Repository pattern]] and [[Feature-first architecture]].
- [ ] 4. [[Archetype]] — the template it all grew from.

**Practice:** generate a throwaway project with [[Archetype - Start a new project]]; in `agent-runtime`, find one port in `application/` and every adapter that implements it; read `AgentDI` and list what it builds.

## Stage 2 — Python for services
*Goal: be at home in a modern async Python project.*
- [ ] 5. [[uv and pyproject]] and [[Python packaging]].
- [ ] 6. [[asyncio]] — concurrency, cancellation, context variables.
- [ ] 7. [[Data validation with pydantic and msgspec]].
- [ ] 8. [[pycraftcore]]: [[pycraftcore modules]], [[pycraftcore configuration]].

**Practice:** `make install_dev && make check` in pycraftcore; write a tiny script that loads a config with a connector and an operation ([[pycraftcore - Configure a service]]); find where `request_id_context` is set and read.

## Stage 3 — Serving HTTP
*Goal: build an API that behaves well in production.*
- [ ] 9. [[ASGI]] and [[Python web frameworks]].
- [ ] 10. [[Server-sent events]] — streaming, heartbeats, disconnects.
- [ ] 11. [[pycraftcore web toolkits]] — one contract, three frameworks.
- [ ] 12. [[Retry and backoff]], [[Circuit breaker]], [[pycraftcore resilience]].
- [ ] 13. [[Benchmarking web services]] and [[Web framework benchmark]].

**Practice:** `make run_litestar` then `make benchmark_quick` in web_framework; `curl -N` the agent's `/v1/stream` and read the frames ([[Agent runtime - Call the API]]); explain why the three frameworks tie at a fixed rate.

## Stage 4 — Testing what matters
*Goal: tests that let you change code without fear.*
- [ ] 14. [[Unit tests and test doubles]].
- [ ] 15. [[Architecture tests]].
- [ ] 16. [[Pre-commit hooks]], [[Git flow]], [[CI with GitHub Actions]].

**Practice:** in agent-runtime, break a boundary on purpose (import LangChain in the domain) and watch `make test` fail; read one scenario test and its scripted model.

## Stage 5 — The frontend
*Goal: read and extend homelab-ui confidently.*
- [ ] 17. [[Single-page application]], [[Angular]], [[Signals]].
- [ ] 18. [[Homelab UI structure]], [[Homelab UI state and streaming]].
- [ ] 19. [[Homelab UI Tasker]], [[Homelab UI delivery]].

**Practice:** `make run` and add a small page by following [[Homelab UI - Add a page]] (don't commit it); find where `canSend` is computed and why the button greys out while streaming.

## Stage 6 — AI agents
*Goal: design an agent that is useful, bounded and safe — and prove it.*
- [ ] 20. [[OpenAI-compatible API]], [[Running LLMs locally]].
- [ ] 21. [[Agent patterns]], [[LangGraph]].
- [ ] 22. [[Agent runtime layers]], [[Agent runtime turn]], [[Agent runtime plans and outcomes]].
- [ ] 23. [[Model Context Protocol]], [[Agent toolbox layers]], [[Agent toolbox sandbox]], [[pycraftcore runtime sandbox]].
- [ ] 24. [[AI agents and sandboxing]], [[Guardrails and prompt injection]].
- [ ] 25. [[LLM evaluation]], [[Agent runtime evaluation]].
- [ ] 26. [[Agent runtime decisions]] and [[Agent toolbox decisions]] — would you decide the same? Write it in a [[Log]] entry.

**Practice:** add a toy tool to the toolbox ([[Agent toolbox - Add a tool]]) and call it from `python_executor` code; run `make evaluate KINDS=MEMORY RUNS=1` against a local agent and read the report.

## You're done when
- You can explain, for any of our services, which ring a given file belongs to and why.
- You can add an endpoint, a tool or a page alone, with tests.
- You can say what an agent turn does step by step and where it can go wrong.
- You can defend or challenge every decision note of the agent, the toolbox and pycraftcore.
