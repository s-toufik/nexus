---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Tasker

> **Route** `/tasker` · **for** everyone (your own workflows) · **saves to** PostgreSQL through PostgREST (`/api/tasker/…`) · **code** `src/app/features/tasker/`
> Build small automations by connecting blocks on a canvas, run them in your browser, keep them in your account.

![[Homelab UI - Tasker.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Workflow name | Rename the workflow on the open canvas. |
| 2 | Save state | *Not saved yet* / *Saved*. Nothing is stored until you press Save. |
| 3 | Blocks | Click to add: **Trigger** (start: manual run), **HTTP request**, **Code** (JavaScript), **Transform** (reshape data), **Output** (show the final result). |
| 4 | Favorites | Blocks you saved with their settings, ready to reuse (`agent models` here: an HTTP request to the agent's model list). |
| 5 | Block | One step; its subtitle says what's missing (`No URL set`). |
| 6 | Port | Drag from a block's right port to another's left port: the first block's result becomes the second's input. |
| 7 | Split | Open another canvas side by side or stacked. |
| 8 | Arrange | Lay the blocks out and fit them to the view. |
| 9 | Save · Run | Store the workflow; run it from every block nothing feeds into. |
| 10 | Workflows | Your saved workflows (only yours), and **New canvas**. |
| 11 | Inspector | The selected block: its name, its settings, its last result. |
| 12 | Run this block | Run one block alone, to test it. |

## Use it to
Automate a check you do by hand: *call the agent's `/v1/models`, keep the names, show them*; *query Prometheus for disk usage and output a warning*. Shift-click several blocks to group them into one reusable block.

## How it works
The engine is plain TypeScript and runs **in your browser**: an HTTP block is a `fetch()` from your tab, with your session, so it reaches what your browser reaches — the gateway's `/api/…` routes — and nothing else ([[Homelab UI Tasker]]). Workflows are rows in the `tasker` schema; PostgreSQL's [[Row-level security|row-level security]] shows each account only its own rows, through [[PostgREST]] ([[Homelab data]]).

## Try it
1. ✋ Add Trigger → HTTP request (URL `/api/agent/v1/models`) → Output, connect them, **Run** → the Output shows the model list as JSON.
2. ✋ **Save**, reload the page → it's in *Workflows*. (Undo: delete it from the list.)

> [!question]- Check: an HTTP block to `http://prometheus:9090/api/v1/query` fails, but `/api/prometheus/api/v1/query` works. Why?
> The block runs in your browser, which can't resolve or reach in-cluster names. `/api/prometheus/…` goes through the gateway, which can.

Back to [[Homelab UI pages]].
