---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, rust]
updated: 2026-11-08
---

# Rust with Cargo

> **Cargo** is Rust's build tool and package manager in one: `Cargo.toml` declares the crate and its dependencies; `cargo build`, `test`, `run`, `fmt`, `clippy` do the rest.

## How it works
- `cargo fetch` (dependencies), `cargo build --release`, `cargo run`, `cargo test --all`.
- `cargo fmt` (formatting), `cargo clippy --all-targets --all-features -- -D warnings` (lints as errors).
- Modules: `mod.rs` / `lib.rs`; a crate can be a library and a binary (`main.rs`).
- **cargo-generate** creates a project from a template.

## In our projects
[[Pricelab]]'s `pricelabr-core` and [[Archetype]]'s Rust template ([[Pricelab - Build and test the cores]]).

## Go further
- [The Rust book](https://doc.rust-lang.org/book/), [the Cargo book](https://doc.rust-lang.org/cargo/), [cargo-generate](https://cargo-generate.github.io/cargo-generate/).
