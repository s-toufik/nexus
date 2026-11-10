---
type: path
track: Judgement
time: ~6 h
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]", "[[Agent toolbox]]", "[[pycraftcore]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Decisions and trade-offs

> **Goal:** the senior skill: choose between good options, write down why, and know when to revisit. Read every decision we made, challenge them, and write your own.
> **Time:** ~6 h.
> **Before:** any two tracks. **Then:** [[Project - Game day]]. **All paths:** [[Paths]]

## 1. How a decision is written · ~1 h
**Read:** one entry of [[Homelab decisions]] slowly: context, decision, why, alternatives, consequences.

**Check:**
1. Why record the alternatives turned down?
> [!success]- Answer
> So a later reader knows the option was considered and why it lost — and can tell when circumstances change enough to revisit it, instead of re-debating from scratch.

## 2. Read them all · ~3 h
**Read:** [[Homelab decisions]] · [[Homelab UI decisions]] · [[Agent runtime decisions]] · [[Agent toolbox decisions]] · [[pycraftcore decisions]]

**Do:** for each note, mark one decision **agree**, one **would revisit**, with one sentence each.

## 3. Write one · ~1.5 h
**Do:** pick a real open question — off-site backups, MFA, Pricelab's two languages, a GitOps controller instead of `make apply`. Write it as a decision entry in the right project's decisions note: context, two or three options with their costs, your choice, what would make you change your mind.

**Check:**
1. What makes a decision good, apart from being right?
> [!success]- Answer
> It states the constraints and the trade-off honestly, is reversible where possible, names the signal that would trigger revisiting it, and is cheap to explain to the next person.

## 4. Read the classics · ~ongoing
**Read:** [[Site Reliability Engineering]] (*Embracing risk*, *Postmortem culture*) · [[Designing Data-Intensive Applications]] (chapter 1).

**Milestone:** you can argue for and against every major choice in our projects, and you've recorded one of your own.
