---
type: project
status: active
started: 2026
repos: [archetype]
tags: [project, archetype, architecture]
updated: 2026-11-08
---

# Archetype

> A project template, in Python, C++ and Rust, for a **pragmatic hexagonal architecture**: the application core isolated from frameworks and infrastructure, every outside interaction behind a port owned by the application, adapters at the edges, one composition root. A script creates a new project with that layout, its Makefile, linters, CI and licence.

## Why it exists
Every new service starts the same way; starting it right is cheap, fixing it later is not. Archetype makes the dependency rule visible from the first commit — the layout [[Agent runtime]], [[Agent toolbox]] and [[Web framework benchmark]] grew from, and the skeleton of [[Pricelab]].

## The layout (Python; C++ and Rust mirror it)
```text
src/<package>/
├── domain/          base/ · model/ · service/        business rules, no dependencies     ┐
├── application/     use_case/ · port/inbound/ · port/outbound/   what the app does, its contracts │ business hexagon
├── adapter/         inbound/ · outbound/              HTTP, CLI, DBs, APIs implementing ports ┘
├── infrastructure/  <concept>/port/ · <concept>/adapter/   generic technical capabilities  ← technical hexagon
└── bootstrap/                                         composition root: wiring, start-up
```

## Two hexagons
| | Business hexagon | Technical hexagon |
|---|---|---|
| Ports describe | business capabilities ("save an order", "get a price") | generic technical capabilities ("cache", "lock", "retry") |
| Owned by | the application | infrastructure (reusable across apps — what [[pycraftcore]] became) |
Dependency flow: core → ports (contracts) ← adapters → external technologies. The README's note matters: the folders *document* the design; what makes it real is **dependency direction**, ownership of abstractions and boundaries enforced in code ([[Architecture tests]]).

## What a generated project gets
| | Python | C++ | Rust |
|---|---|---|---|
| Created by | `python/python_archetype.sh <target-dir> <project> <package>` | `c++/c++_archetype.sh <target-dir> <project> <namespace>` | `rust/rust_archetype.sh` (cargo-generate template) |
| Build | `pyproject.toml` (uv), Makefile | CMake + Conan + Ninja, clang-format, clang-tidy | Cargo, clippy, rustfmt |
| Extras | pre-commit config, GitHub/Bitbucket CI and issue templates, MIT licence | GitHub issue templates | issue templates |

Guide: [[Archetype - Start a new project]].

## Knowledge it uses
[[Hexagonal architecture]] · [[Dependency injection]] · [[Architecture tests]] · [[uv and pyproject]] · [[Building C++ with CMake and Conan]] · [[Rust with Cargo]] · [[Pre-commit hooks]]
