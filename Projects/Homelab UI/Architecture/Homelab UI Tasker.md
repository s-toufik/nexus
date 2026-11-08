---
type: architecture
project: "[[Homelab UI]]"
order: 3
tags: [homelab-ui, architecture, frontend]
updated: 2026-11-08
---

# Homelab UI Tasker

> A workflow editor: blocks on a canvas, connected, run in the browser. Its heart is plain TypeScript — the graph model and its execution — with the canvas library hidden behind an interface, and the storage behind PostgREST with row-level security.

Previous: [[Homelab UI state and streaming]] · Next: [[Homelab UI delivery]]

## The pieces
| Layer | Holds |
|---|---|
| `domain/` | `workflow.ts` (blocks, connections), `graph-execution.ts`, `grouping.ts`, `pane-layout.ts`, `transform.ts`, `template.ts`, the `CanvasEngine` interface, the repositories' interfaces |
| `application/` | `WorkflowDocumentStore`, `WorkspaceStore` (tabs and split panes), `BlockFavoritesStore`, `block-executor.ts` |
| `infrastructure/` | `canvas-engine/` (Rete.js), `api/` (PostgREST), `runners/` (HTTP, code), `storage/` (unsaved canvases per account) |

## Running a graph
`executeGraph(graph, seeds, hooks)` is a **breadth-first walk**:
1. Start from the seeds — every block nothing feeds into (a Trigger, or a lone block).
2. Take a block from the queue; skip it if already visited.
3. Its input is the seed value, or the output of the block upstream.
4. `hooks.execute(block, input, outputs)` runs it; success stores the output and queues every block it connects to; failure records the error (its downstream blocks never run).
5. `onStart / onSuccess / onError` hooks let the UI light each block up.

The function knows nothing about Angular or the canvas — it's tested on its own (`graph-execution.spec.ts`). That's the same idea as a domain layer in [[Hexagonal architecture]].

## The canvas behind a port
```ts
export interface CanvasEngine {
  mount(host: HTMLElement, callbacks: CanvasEngineCallbacks): void | Promise<void>;
  sync(state: CanvasEngineState): void;
  fitView(): void | Promise<void>;
  destroy(): void;
}
```
The page owns the state (blocks, connections, selection, results) and calls `sync`; the engine reports moves, connections and selection through callbacks. Today's adapter uses Rete.js; swapping it touches one folder. This is the **ports and adapters** pattern on the frontend.

## Saving
Workflows and favourite blocks go to `/api/tasker/` → PostgREST → PostgreSQL schema `tasker`, where [[Row-level security]] returns only the signed-in account's rows ([[Homelab data]]). Unsaved canvases are kept in `localStorage` per account (`homelab-ui.tasker.workspace.<account>`).

## Edge cases
- **HTTP blocks run in the browser:** from the HTTPS page they can only call `https://` addresses (mixed content is blocked), and CORS applies.
- **Cycles:** `visited` stops a block from running twice in one run.
- **Groups:** a grouped block is a sub-graph; `entryIds` finds where to start inside it.

## Check yourself
1. Why is `executeGraph` breadth-first, and what happens downstream of a failed block?
2. What does the `CanvasEngine` interface buy you, concretely?

## Go further
- [Rete.js](https://retejs.org/docs).
- [MDN: mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content).
