---
type: project
status: started
started: 2026-04
repos: [pricelabcpp-core, pricelabr-core]
tags: [project, pricelab]
updated: 2026-11-08
---

# Pricelab

> A pricing platform in the making. Locally, two **cores** generated from [[Archetype]] — `pricelabcpp-core` (C++) and `pricelabr-core` (Rust, experimental) — each still at its first commit: the hexagonal skeleton, an example domain model and test, CI and issue templates. On GitHub the platform also has `pricelab-core` and `pricelab-retriever` (data retrieval), not checked out here.

## Where it stands (2026-11-08)
- `pricelabcpp-core`: "init project" (2026-04-14) — `include/pricelab_core/domain/model/example.hpp`, `src/pricelab_core/domain/service/example.cpp`, `tests/unit/example_test.cpp`, CMake + Conan, a CI workflow.
- `pricelabr-core`: GitHub templates merged (2026-04-07) — empty `domain/`, `application/{port,use_cases}/`, `adapter/{inbound,outbound}/` modules.
- Nothing of the pricing domain is written yet: this is the place to add it when the project resumes (a project note, decisions on what Pricelab prices and why two languages).

## Why two languages
Not decided in writing yet. A likely reading: the same core in C++ and Rust to compare them for numeric work — record the real reason in [[Pricelab decisions]] when the project resumes.

## Guides
- [[Pricelab - Build and test the cores]]

## Knowledge it uses
[[Hexagonal architecture]] · [[Building C++ with CMake and Conan]] · [[Rust with Cargo]] · [[CI with GitHub Actions]]
