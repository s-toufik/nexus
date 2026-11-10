---
type: path
track: Projects
time: ~12 h
projects: ["[[Agent toolbox]]", "[[Agent runtime]]", "[[Homelab UI]]", "[[Homelab]]"]
tags: [path, project]
updated: 2026-11-10
---

# Project - A feature across three repos

> **Goal:** ship one real capability through the whole system — a new tool in the toolbox, visible in the UI, used by the agent, proven by an evaluation case, running on the homelab.
> **Time:** ~12 h over several sessions.
> **Before:** [[Path - Tools and safety]] · [[Path - Proving it works]] · [[Path - Shipping changes]]. **Then:** [[Project - Game day]]. **All paths:** [[Paths]]

## The feature: `nexus_search`
A tool that searches markdown notes in the toolbox's working directory by keyword and returns matching titles with a line of context — so the agent can answer from your notes. (Copy a few nexus notes into the working directory to try it.)

## Steps
1. **The tool** (agent-toolbox), following [[Agent toolbox - Add a tool]]: input `{query, limit}`, output `{matches: [{file, line}]}`, descriptions written for the model, confined to the working directory; raise `ToolFailure` on a bad query.
2. **Tests:** unit tests next to the file tools; `make check` green; the parity contract test still passes.
3. **In the sandbox:** `python_executor` code calling `nexus_search(query="Caddy")` returns the same as a direct call.
4. **Release** it: [[Agent toolbox - Release a version]] → `apps.agentToolbox` → `make apply R=agent-toolbox`, then `make restart R=agent-runtime` (the agent discovers tools at start).
5. **In the UI:** homelab-ui's **Tools** page lists it with no code change — explain why.
6. **The agent uses it:** "What do my notes say about forward authentication?" → a plan with `nexus_search`, then an answer citing files.
7. **Prove it:** an evaluation case (capability `nexus`, `UsesAll(…)`, `Contains(…)` on a fact from a note), 3 runs ([[Path - Proving it works]]).
8. **Observe it:** find the tool call in Tempo and the toolbox's log line with the same request id.

## Done when
Every step's result is real, and you can draw the path of one question from the browser through the agent and the toolbox to the file — with the layer that would stop a misuse at each hop.

## Reward
This is a senior engineer's week: one feature, three repositories, a release, a deployment, tests, an evaluation and the signals to prove it. Write it up in a [[Log]] entry.
