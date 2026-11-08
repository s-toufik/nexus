---
type: concept
domain: Testing
level: intermediate
tags: [concept, testing, architecture]
updated: 2026-11-08
---

# Architecture tests

> Tests that check the *structure* of the code, not its behaviour: "the domain imports no framework", "the application imports no web library", "this folder imports only its own framework". They fail the build when a layer boundary is crossed.

## Why it matters
Layers erode one convenient import at a time; reviews miss it. A test makes the architecture a rule the build enforces, so the design described in the README stays true.

## How it works
- Walk the package's modules (or parse their imports) and assert forbidden imports are absent.
- Express rules per layer: `domain` → nothing outside the standard library and itself; `application` → domain + ports; adapters may import libraries.
- Tools: hand-written pytest using `ast`/`importlib`, or [import-linter](https://import-linter.readthedocs.io/) contracts; ArchUnit in Java.

## In our projects
`tests/architecture/test_boundaries.py` in agent-runtime (no LangChain/LangGraph/MCP/web framework in the core), agent-toolbox (no agent or LangChain imports; no transport in the application), web_framework (each framework folder imports only its framework; the benchmark never imports the shop) — [[Agent runtime layers]], [[Web framework benchmark design]].

## Check yourself
1. Write the rule that keeps the domain free of frameworks as a sentence a test could check.
2. Why is this better than a code-review checklist?

## Go further
- [import-linter: contract types](https://import-linter.readthedocs.io/en/stable/).
- [Neal Ford et al., *Building Evolutionary Architectures*: fitness functions](https://evolutionaryarchitecture.com/).
