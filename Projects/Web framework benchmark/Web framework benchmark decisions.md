---
type: decisions
project: "[[Web framework benchmark]]"
tags: [web-framework, decisions]
updated: 2026-11-08
---

# Web framework benchmark decisions

## A realistic shop, not "hello world"
- **Why:** an empty handler measures only routing overhead; real services spend time in I/O, validation and serialisation.

## Hexagonal shop, frameworks only at the edge
- **Why:** the only variable is the framework; the use cases and SSE presenter are shared byte for byte.

## Preflight and contract tests before measuring
- **Why:** a faster framework that returns a different answer did different work.

## Throughput and fixed-rate profiles
- **Why:** throughput shows the ceiling; fixed rate shows what users feel at a realistic load. They rank frameworks differently.

## Granian, one worker, for every framework
- **Why:** same server and settings; one worker isolates per-process efficiency.
