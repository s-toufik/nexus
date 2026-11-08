---
type: guide
project: "[[Archetype]]"
tags: [guide, archetype]
updated: 2026-11-08
---

# Archetype - Start a new project

> Create a new Python, C++ or Rust project with the hexagonal layout, its tooling and git.

**Where:** on your Mac, in `archetype` · **All guides:** [[Archetype]]

## Python
1. `./python/python_archetype.sh <target-dir> <project-name> <package_name>` → `<target-dir>/<project-name>/` with `src/<package_name>/{domain,application,adapter,infrastructure,bootstrap}`, `tests/`, `docker/`, `scripts/`, `main.py`, `pyproject.toml`, `Makefile`, `.pre-commit-config.yaml`, `.gitignore`, `.github/`, `LICENSE`.
2. In the new project: set `name` and `description` in `pyproject.toml` (they're `???` / `description`).
3. `make install_dev` → the dev dependencies (pytest, hypothesis, ruff, …).
4. `make check` → lint, type check and tests pass on the empty project.
5. `make git_init` → first commit and a `develop` branch.

## C++
1. Once: `brew install llvm conan cmake ninja`.
2. `./c++/c++_archetype.sh <target-dir> <project-name> <namespace>` → `include/<namespace>/…`, `src/`, `apps/`, `tests/`, CMake files, Conan file, clang-format and clang-tidy.
3. In the new project: `make build` (= `make setup` Conan install + `make configure` CMake with Ninja and the Conan toolchain + `cmake --build build`).
4. `make test` → `ctest --test-dir build --output-on-failure`.
5. `make run` → `./build/apps/<project-name>`.

## Rust
1. Once: `cargo install cargo-generate`.
2. `./rust/rust_archetype.sh` → asks the project name (cargo-generate), creates the crate with `src/{domain,application,adapter}/…`.
3. In the new project: `make test` (`cargo test --all`), `make lint` (`cargo clippy --all-targets --all-features -- -D warnings`), `make format` (`cargo fmt`).
4. `make git_init` → first commit and `develop`.

## Why it works
- [[Archetype]] · [[Hexagonal architecture]] · [[Building C++ with CMake and Conan]] · [[Rust with Cargo]]
