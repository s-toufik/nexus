---
type: concept
domain: Frontend
level: intermediate
tags: [concept, frontend]
updated: 2026-11-08
---

# Signals

> A **signal** is a value that knows who reads it. `computed` derives a value from signals and recomputes only when they change; `effect` runs side effects when what it reads changes. The UI updates exactly the parts that read the changed signal.

## Why it matters
State management is most of frontend complexity. Signals make dependencies explicit and automatic: no manual subscriptions to forget, no global re-rendering — and the same idea now exists in Solid, Vue, Preact, Svelte runes and a TC39 proposal.

## How it works
```ts
const draft = signal('');                         // writable: draft.set('hi'), draft.update(s => s + '!')
const canSend = computed(() => draft().trim().length > 0 && !isStreaming());
effect(() => storage.write({ model: modelName() }));   // re-runs when modelName changes
```
- Reading is a call: `draft()`. Inside `computed`/`effect`/a template, reads are tracked.
- `computed` is lazy and memoised; it must be pure.
- Use `effect` sparingly: for syncing to the outside (storage, logging), not for deriving state.
- Signals vs RxJS: signals for state, observables for event streams over time; Angular bridges them (`toSignal`).

## In our projects
`AgentStore`: `messages`, `draft`, `isStreaming` signals; `canSend`, `phase` computeds; an `effect` persisting preferences ([[Homelab UI state and streaming]]).

## Check yourself
1. Why must a `computed` be pure?
> [!success]- Answer
> It's lazy and memoised: Angular decides when, and how often, to run it. A side effect inside would run at unpredictable times, or not at all if nobody reads it, and could write a signal during a read, causing loops.
2. When is an `effect` the wrong tool?
> [!success]- Answer
> When it derives state from other state, like setting one signal when another changes: that's a `computed`. An `effect` is for syncing to the outside (storage, logging, a non-Angular library).

## Go further
- [Angular: signals](https://angular.dev/guide/signals).
- [TC39 signals proposal](https://github.com/tc39/proposal-signals).
