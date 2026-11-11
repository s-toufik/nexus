---
type: log
date: 2026-11-11
projects: ["[[Homelab UI]]", "[[Homelab]]"]
tags: [log, homelab-ui]
---

# 2026-11-11 Homelab UI pages

## What we did
- One note per page of Homelab UI, with a screenshot of the **real** homelab and numbered markers: [[Homelab UI pages]] (17 page notes, 22 annotated pictures in `System/Assets/Homelab UI/`).
- The pictures were taken by driving a signed-in browser over the DevTools protocol; before each one, a script replaced the domain, server name, Tailscale, LAN and pod addresses, emails and the last name in the page with placeholders, then the page text was scanned again.
- New lesson 2 in [[Path - Tour of Homelab UI]]: every page, what it's for, and an investigation done only with the pages.

## What the real homelab showed
- **The agent fails on local models** (`404 page not found`): homelab-infra's `llmBaseUrl` is NVIDIA's API, and a new browser picks `qwen3.5-0.8b` first → [[Homelab UI page - Agent]].
- **Traces are one span each**; MCP calls start their own traces → [[Homelab UI page - Traces]].
- `13/13 targets` vs `11 of 11`: Alloy's own scrapes → [[Homelab UI page - Metrics]].
- `INFO`/`info` as different levels; oauth2-proxy logs every forward-auth check → [[Homelab UI page - Logs]].
- Raw label `password-display-name` on the Account page; every session shows the pod network's address → [[Homelab UI page - Account]].
- Kafka has no topics yet → [[Homelab UI page - Kafka]].

## Next
- [ ] Fix the agent's model routing (local models to llama-swap, or list only NVIDIA's).
- [ ] Spans per agent step, and `traceparent` over MCP.
- [ ] Translate `password-display-name` on the Account page.
