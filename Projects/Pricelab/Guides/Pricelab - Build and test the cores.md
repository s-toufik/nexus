---
type: guide
project: "[[Pricelab]]"
tags: [guide, pricelab]
updated: 2026-11-08
---

# Pricelab - Build and test the cores

> Build, test and run the C++ and Rust cores.

**Where:** on your Mac · **All guides:** [[Pricelab]]

## The C++ core (`projects/c++/pricelabcpp-core`)
1. Once: `brew install llvm conan cmake ninja`.
2. `make setup` — raw: `conan install . --output-folder=build --build=missing --profile=default` → the dependencies and `build/conan_toolchain.cmake`.
3. `make configure` — raw: `cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake`.
4. `make build` — runs 2 and 3, then raw `cmake --build build`.
5. `make test` — raw: `ctest --test-dir build --output-on-failure` → the example test passes.
6. `make run` — raw: `./build/apps/pricelabcpp-core`.
7. `make clean` — raw: `rm -rf build`.

## The Rust core (`projects/rust/pricelabr-core`)
1. `make install` — raw: `cargo fetch`.
2. `make test` — raw: `cargo test --all`.
3. `make lint` — raw: `cargo clippy --all-targets --all-features -- -D warnings`.
4. `make format` — raw: `cargo fmt`.
5. `make build` — raw: `cargo build --release`; `make run` — raw: `cargo run`.

## Why it works
- [[Building C++ with CMake and Conan]] · [[Rust with Cargo]] · [[Archetype]]
