---
type: architecture
project: "[[Homelab UI]]"
tags: [homelab-ui, ui-page]
updated: 2026-11-11
---

# Homelab UI page - Assistant

> **Where** the button at the top right of every page except the Agent page · **talks to** agent-runtime, like the Agent page · **code** `src/app/shell/assistant-drawer/`
> The agent in a drawer beside the page you're on — the **same** conversation as the Agent page.

![[Homelab UI - Assistant.webp]]

## What is what
| # | What | What it tells you, what it does |
|:-:|---|---|
| 1 | Assistant | The drawer. Drag its left edge to resize (double-click resets); Esc or ✕ closes it. |
| 2 | Model | The same choice as the Agent page's settings. |
| 3 | New conversation | Start over. |
| 4 | Open in Agent page | Continue full screen. |
| 5 | Your question | |
| 6 | Answer | Streamed, with its usage below. |
| 7 | Composer | |
| 8 | The page | Still usable beside it; on a wide screen it makes room. |

## Use it to
Ask about what you're looking at — *"why did Caddy log this error at 18:42?"* — without leaving the page.

## How it works — and its limit
It sends the same request as the Agent page: `{message, model_name, request_id, auto_approve}`. **The page's content isn't sent.** The agent doesn't see your screen: paste the line or name the service and time, and it can look it up with its tools.

## What the real homelab showed (2026-11-11)
Asked *"what does the Logs page show?"*, it answered from general knowledge: *Loki log entries filtered by a LogQL selector* — right — *with labels such as app, env, pod… pattern detection and index-level statistics* — the page has none of that. Plausible, partly wrong, because it never saw the page.

> [!question]- Check: how do you get a useful answer about a log line from the assistant?
> Give it the facts it can't see: paste the line, or name the service and the time, and ask it to look in Loki (`grafana_*` tools).

Back to [[Homelab UI pages]].
