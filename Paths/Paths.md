---
type: index
tags: [index, path]
updated: 2026-11-10
---

# Paths

> Short, standalone learning paths, each one topic, each finished in a few sessions. Every path has a goal, lessons with notes to read, a lab on our own projects (with the result to expect), check questions with hidden answers, and a milestone. **Projects** put several paths to work on something real.

## How a path works
1. **Read** the linked notes (Knowledge for the idea, Projects for how we use it).
2. **Do** the lab: 👀 only looks, ✋ changes something (the undo is given).
3. **Check:** answer out loud *before* opening the hidden answer. Wrong? Reread, don't just read the answer.
4. Tick the path below when you can pass its checks without looking.
5. Write one line in the [[Log]] after each path: what clicked, what didn't.

Each path lists what to know **before** it and what to take **then** — take them in any order that respects that.

## Platform — the homelab and how it runs
| Done | Path | Time | You'll be able to |
|:-:|---|---|---|
| ☐ | [[Path - Linux, Git and the server]] | 5 h | Say who runs what on the server, how it heals itself, how a change travels through git |
| ☐ | [[Path - Networks you can reason about]] | 6 h | Trace a request from your browser to the server: name, address, HTTP, TLS, firewall |
| ☐ | [[Path - Containers and Kubernetes]] | 8 h | Read any pod's state and know the next command |
| ☐ | [[Path - Shipping changes]] | 7 h | Change, release and roll back anything on the homelab |
| ☐ | [[Path - The front door]] | 7 h | Explain single sign-on, sessions and the web attacks the gateway stops |
| ☐ | [[Path - Data]] | 8 h | Say where every byte lives, who may read it, and restore it |
| ☐ | [[Path - Seeing inside]] | 7 h | Find the slow step of a request with metrics, logs and traces |

## Applications — how our services are written
| Done | Path | Time | You'll be able to |
|:-:|---|---|---|
| ☐ | [[Path - Python for services]] | 7 h | Read our Python services' toolchain, concurrency, validation and config |
| ☐ | [[Path - Design that lasts]] | 8 h | Explain and enforce the hexagonal shape of every service |
| ☐ | [[Path - Serving HTTP well]] | 7 h | Serve, stream and protect an API with our conventions |
| ☐ | [[Path - The frontend]] | 8 h | Read and extend homelab-ui: structure, signals, streaming, delivery |

## AI — models, agents, tools
| Done | Path | Time | You'll be able to |
|:-:|---|---|---|
| ☐ | [[Path - Models]] | 6 h | Call any model, read its usage, say what fits in memory |
| ☐ | [[Path - Agents]] | 9 h | Explain any of the agent's replies from its route through the routing table |
| ☐ | [[Path - Tools and safety]] | 8 h | Add a tool safely and name every layer that holds when the model is fooled |
| ☐ | [[Path - Proving it works]] | 6 h | Tell with numbers whether a change made the agent better |

## Judgement — what makes a senior
| Done | Path | Time | You'll be able to |
|:-:|---|---|---|
| ☐ | [[Path - Security and failure]] | 8 h | Defend the design and its gaps; debug any symptom with a method |
| ☐ | [[Path - Decisions and trade-offs]] | 6 h | Argue every major choice and record your own |

## Projects — put it together
| Done | Project | Time | Uses |
|:-:|---|---|---|
| ☐ | [[Project - Follow a request]] | 3 h | Networks, Containers |
| ☐ | [[Project - Ship and investigate]] | 4 h | Shipping, Seeing inside |
| ☐ | [[Project - Build a service]] | 10 h | Design, Serving HTTP |
| ☐ | [[Project - A feature across three repos]] | 12 h | Tools and safety, Proving it works, Shipping |
| ☐ | [[Project - Game day]] | 6 h | Security and failure, Seeing inside |

(Tick by replacing ☐ with ✅.)

## Suggested routes
- **From zero, everything (~3 months at ~10 h/week):** Linux → Networks → Containers → *Follow a request* → Python → Design → Shipping → Front door → Data → Seeing inside → *Ship and investigate* → Serving HTTP → *Build a service* → Frontend → Models → Agents → Tools and safety → Proving it works → *Feature across three repos* → Security and failure → Decisions → *Game day*.
- **"I want to work on the agent" (~6 weeks):** Python → Design → Serving HTTP → Models → Agents → Tools and safety → Proving it works → *Feature across three repos*.
- **"I want to run the homelab" (~5 weeks):** Linux → Networks → Containers → Shipping → Front door → Data → Seeing inside → Security and failure → *Game day*.
- **"I want to work on the UI" (~3 weeks):** Networks → Python (skim) → Serving HTTP (lessons 1–2) → Frontend → *Follow a request*.

Mix tracks: alternating a platform path with an application path keeps both fresh, and each makes the other easier.

## Keep it fresh
Every path starts with an optional warm-up from earlier paths: that's spaced repetition. Once a month, open a finished path and answer its checks again without looking.

New path: a note from the *Learning path* template in its track's folder, and a row here.
