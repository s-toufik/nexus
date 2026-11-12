---
type: concept
domain: Frontend
level: beginner
tags: [concept, frontend]
updated: 2026-11-08
---

# Angular

> Google's TypeScript framework for web apps: components (template + class), dependency injection, a router, forms and an HTTP stack, built by the Angular CLI. Modern Angular (v17+) is **standalone** (no NgModules), **signal**-based and can run **zoneless**.

## Why it matters
It's an opinionated, batteries-included framework used for large apps; knowing its DI and reactivity model transfers to any frontend.

## How it works
- **Component:** `@Component({ selector, imports, templateUrl, styleUrl })` class; templates with `@if`, `@for`, bindings `[prop]`, `(event)`.
- **Standalone:** each component lists what it imports; no NgModule.
- **DI:** `inject(Service)`, `@Injectable({ providedIn: 'root' })`, `InjectionToken`, providers in `app.config.ts` ([[Dependency injection]]).
- **Reactivity:** [[Signals]] (`signal`, `computed`, `effect`); **zoneless** change detection updates only what reads a changed signal (no zone.js patching every async call).
- **Router:** routes with `loadComponent` for lazy loading.
- **Build:** `ng build` (esbuild) → static files; `ng serve` dev server; `ng test` (vitest in this setup).

## In our projects
[[Homelab UI]]: Angular 21, standalone, signals, zoneless, lazy routes, vitest ([[Homelab UI structure]], [[Homelab UI state and streaming]]).

## Check yourself
1. What does "zoneless" remove, and what replaces it?
> [!success]- Answer
> zone.js, which patches every async API (timers, events, HTTP) and triggers change detection over the whole tree after each. Signals replace it: Angular updates only the views that read a signal that changed.
2. Why `loadComponent` for every page?
> [!success]- Answer
> Each page becomes its own bundle, downloaded on the first visit to it. The first load only fetches the shell and the page you open, so it's faster, and pages you never visit cost nothing.

## Go further
- [angular.dev](https://angular.dev/) — start with the tutorial, then [components](https://angular.dev/guide/components) and [signals](https://angular.dev/guide/signals).
- [Zoneless](https://angular.dev/guide/zoneless).
