---
type: log
date: 2026-11-10
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]", "[[Agent toolbox]]", "[[pycraftcore]]"]
tags: [log]
---

# 2026-11-10 Learning paths

## What we did
- Replaced the two long paths with **17 standalone paths** in four tracks (Platform, Applications, AI, Judgement) and **5 projects**, focused on Homelab, Homelab UI, Agent runtime, Agent toolbox and pycraftcore — see [[Paths]].
- Every lesson: notes to read, a lab on our own repositories with the result to expect (👀 looks, ✋ changes with an undo), check questions with answers hidden in collapsed callouts, and a milestone per path.
- Seven foundation notes so no path starts with a gap: [[HTTP]], [[REST APIs and OpenAPI]], [[Linux processes and permissions]], [[Containers]], [[Git]], [[YAML and templating]], [[LLM fundamentals]].
- Corrected [[hostPort and hostNetwork]]: hostPorts are NAT rules, not listening sockets, so `ss` doesn't show them.
- Then, on request: **five project tours** first (`Path - Tour of the homelab`, `… Homelab UI`, `… the agent runtime`, `… the agent toolbox`, `… pycraftcore`), so the projects come before the principles; every topic path opens with a *Principles → projects* table; every lesson now teaches in place with a **Learn** section — definitions, how it works, a real annotated example from our repositories, a common mistake.

## What I learned
- Python `Protocol`s match by shape: agent-runtime's `Toolbox` implements `ToolExecutor` without ever importing it.
- The toolbox's sandbox allowlist has no `os`, `subprocess` or `socket` — and the toolbox image (`python:3.14-slim`) has no `wget` either.

## Next
- [ ] Start with [[Path - Tour of the homelab]].
