---
type: path
track: Judgement
time: ~7 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]", "[[Agent toolbox]]", "[[pycraftcore]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Decisions and trade-offs

> **Goal:** the senior skill: choose between good options, write down why, and know when to revisit. Read every decision we made, challenge them, and write your own.
> **Time:** ~7 h.
> **Before:** any two tracks. **Then:** [[Project - Game day]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Decision records | [[Homelab decisions]], [[Homelab UI decisions]], [[Agent runtime decisions]], [[Agent toolbox decisions]], [[pycraftcore decisions]] |
| Trade-offs, not best practices | k3s vs kubeadm, a generic chart vs upstream charts, plans before tools |
| Reversibility | versions per release (`make rollback`), switches (`mcp.<server>.write`) |

## 1. How a decision is written · ~1.5 h

### Learn
**Definitions**
- **Architecture decision record (ADR)** — a short note: context, decision, why, alternatives considered, consequences.
- **Trade-off** — what you give up to get something; every option has one.
- **Reversible / one-way door** — cheap to undo vs costly; spend analysis on the second kind.
- **Revisit signal** — what would make you change your mind.

**Example from our projects** — `Homelab decisions`, 2026-11-08 (condensed):
```text
MCP servers' write access is a deployment switch
- Context: the agent can use Grafana, MongoDB and PostgreSQL through their MCP servers. Writing is useful sometimes, dangerous always.
- Decision: one switch per server, mcp.<server>.write (default false), setting both the server's mode and its account's rights.
- Why: two independent locks; changing it needs a commit, so it's deliberate and visible.
- Alternatives: read-only forever; write always on; a runtime toggle in the UI.
- Consequences: turning write on is a deploy and a toolbox restart.
```
Each alternative is plausible and loses for a stated reason.

**Common mistake** — recording only the winner: a year later nobody knows the alternatives were weighed, and the debate restarts from zero.

### Check
1. Why record the alternatives turned down?
> [!success]- Answer
> So later readers know they were considered and why they lost — and can tell when circumstances change enough to revisit.

## 2. Read them all · ~3 h

### Learn
Read decisions as *bets*: each assumes something about the context (one server, one person, a learning goal). Ask what would make the bet wrong.

### Do
For each decisions note, mark one decision **agree** and one **would revisit**, one sentence each.

## 3. Write one · ~2 h

### Learn
A good decision: states the constraint honestly, compares two or three real options with their costs, picks one, names the revisit signal, and prefers the reversible option when the analysis is close.

### Do
Pick a real open question — off-site backups, MFA, a GitOps controller instead of `make apply`, Pricelab's two languages — and write it as an entry in the right project's decisions note.

### Check
1. What makes a decision good, apart from being right?
> [!success]- Answer
> Honest constraints and trade-offs, reversibility where possible, a named revisit signal, and being cheap to explain to the next person.

## 4. Read the classics · ongoing
[[Site Reliability Engineering]] (*Embracing risk*, *Postmortem culture*) · [[Designing Data-Intensive Applications]] (chapter 1).

**Milestone:** you can argue for and against every major choice in our projects, and you've recorded one of your own.
