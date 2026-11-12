---
type: concept
domain: Delivery
level: intermediate
tags: [concept, delivery, cpp]
updated: 2026-11-08
---

# Building C++ with CMake and Conan

> **CMake** describes how to build a C++ project (targets, sources, include paths, tests) and generates build files for a tool like **Ninja**. **Conan** is a package manager that fetches C++ dependencies and writes a toolchain file CMake uses to find them.

## How it works
1. `conan install . --output-folder=build --build=missing --profile=default` → dependencies (from `conanfile.txt`) and `build/conan_toolchain.cmake`.
2. `cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake` → configure.
3. `cmake --build build` → compile and link.
4. `ctest --test-dir build --output-on-failure` → run tests registered with `add_test`.
- `include/` (public headers) vs `src/` (implementation); `apps/` for executables; `tests/`.
- **clang-format** (style) and **clang-tidy** (static analysis) keep code consistent and catch bugs.

## In our projects
[[Pricelab]]'s `pricelabcpp-core` and [[Archetype]]'s C++ template ([[Pricelab - Build and test the cores]]).

## Check yourself
1. What does Conan's toolchain file give CMake?
> [!success]- Answer
> Where each dependency is (include paths, libraries, CMake config files) plus the compiler and settings of the Conan profile, so `find_package(…)` finds the packages Conan installed and the build matches them.

## Go further
- [CMake tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/index.html), [Conan 2 docs](https://docs.conan.io/2/), [Ninja](https://ninja-build.org/).
