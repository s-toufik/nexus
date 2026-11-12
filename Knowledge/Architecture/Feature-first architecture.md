---
type: concept
domain: Architecture
level: intermediate
tags: [concept, architecture, frontend]
updated: 2026-11-08
---

# Feature-first architecture

> Organise code by **feature** (one folder per page or capability, holding everything it needs) rather than by **technical type** (all components here, all services there). Features don't import each other; shared code lives in one explicit place.

## Why it matters
By-type folders scatter one change across the tree and let everything depend on everything. By-feature folders keep a change in one place, make ownership obvious, and let you delete a feature by deleting a folder.

## How it works
```text
features/<feature>/
├── domain/          types, pure functions
├── application/     state, orchestration
├── infrastructure/  API clients, storage
└── components/ pages/   UI
shell/    app chrome; knows the contract features fulfil, never a feature
shared/   what several features use
```
- **Layers inside a feature** mirror [[Hexagonal architecture]] at small scale.
- **A registration contract** (an injection token, a route table) is how the shell finds features without importing them ([[Dependency injection]]).
- Add a layer only when it holds something: an empty folder documents nothing.

## In our projects
[[Homelab UI structure]]: 16 features, `shell/`, `shared/`, and `app.config.ts` as the only file listing features.

## Check yourself
1. What would make two features need each other, and where should that code go instead?
> [!success]- Answer
> Something both use: a type, a client, a component, a helper. It goes in `shared/` (or, if it's a real capability of its own, its own feature), so neither feature imports the other.
2. How does the shell show a menu entry for a feature it doesn't import?
> [!success]- Answer
> The feature registers an entry (title, route, icon) under the registration contract, the `HOMELAB_FEATURES` token in `app.config.ts`. The shell reads that list and draws the menu from it.

## Go further
- [Angular style guide: organise by feature](https://angular.dev/style-guide#organize-your-project-by-feature-areas).
- [Feature-Sliced Design](https://feature-sliced.design/) — a stricter frontend variant.
