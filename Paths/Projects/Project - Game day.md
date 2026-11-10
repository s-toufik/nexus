---
type: path
track: Projects
time: ~6 h
projects: ["[[Homelab]]"]
tags: [path, project]
updated: 2026-11-10
---

# Project - Game day

> **Goal:** practise incidents before they happen: break things on purpose, one at a time, find the cause from symptoms only, fix it, and write a short postmortem.
> **Time:** ~6 h. Best with a friend who breaks things while you're out of the room.
> **Before:** [[Path - Security and failure]] · [[Path - Seeing inside]]. **All paths:** [[Paths]]

## Rules
- One fault at a time; note the time you start.
- Diagnose only from symptoms: the UI, `make status`, `describe`, logs, metrics, traces. No peeking at what was changed.
- Fix it the proper way (git, `make apply`), then `make verify` is all ✓.

## Faults (pick, or have a friend pick)
| Fault (how to cause it) | Symptom you should see |
|---|---|
| Wrong password: `make secret-set SECRET=pg-role-postgrest KEY=password` with a random value, then restore it with `make secret-rotate` | Tasker fails to load; PostgREST logs authentication errors |
| A typo in the Caddyfile on a branch (`make validate` catches it — try `make apply R=caddy` only on a scratch copy) | validate fails before deploy: the safety net working |
| Memory limit too low: `resources.limits.memory: 32Mi` for `homelab-ui` in its values, apply | `OOMKilled`, `CrashLoopBackOff` |
| Scale the LLM to 0: `make llm-down` | Agent answers with a short model-server error; Models page empty |
| Delete a Deployment by hand: `kubectl -n homelab delete deploy kafka-ui` | Gone, and `make apply` doesn't bring it back → `make sync R=kafka-ui` |
| Stop Tailscale on the server for 5 min: `sudo systemctl stop tailscaled` (from the console, not SSH over Tailscale!) | Unreachable; the watchdog restarts it after ~4 min |

## Postmortem (one per fault, 10 lines)
What happened · how it was noticed · time to cause · time to fix · the root cause · what would have caught it earlier (an alert? a test?) · one action. Blameless: about the system, not the person.

## Reward
Faster than you think: the second time is half the first. Keep the postmortems in the [[Log]] — they're the most valuable notes a team has.
