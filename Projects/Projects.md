---
type: index
tags: [index]
updated: 2026-11-08
---

# Projects

What we build, and why. One folder per project: its note (start there), a canvas, architecture notes in reading order, decisions, guides and repository notes.

## The homelab platform
| Project | What it is | Guides |
|---|---|---|
| [[Homelab]] | The home server on Kubernetes: gateway and sign-in, data, observability, local LLMs, all deployed as one release train | [[Homelab guides]] |
| [[Homelab UI]] | The front door: every tool as a page, the agent beside every page, Tasker | [[Homelab UI guides]] |

## The agent
| Project | What it is | Guides |
|---|---|---|
| [[Agent runtime]] | The AI agent: understand, plan, act, review; streamed over SSE; evaluated from outside | [[Agent runtime guides]] |
| [[Agent toolbox]] | Its hands: an MCP server with data, file and Python-sandbox tools, plus Grafana's, MongoDB's and PostgreSQL's | [[Agent toolbox guides]] |

## Foundations and templates
| Project | What it is | Guides |
|---|---|---|
| [[pycraftcore]] | The shared Python foundation: config, logging, telemetry, resilient HTTP, web toolkits, repositories, sandbox | [[pycraftcore guides]] |
| [[Archetype]] | Hexagonal project templates for Python, C++ and Rust | [[Archetype - Start a new project]] |

## Experiments and side projects
| Project | What it is | Guides |
|---|---|---|
| [[Web framework benchmark]] | FastAPI vs Litestar vs BlackSheep on the same realistic shop (done) | [[Web framework benchmark guides]] |
| [[Pricelab]] | A pricing platform: C++ and Rust cores, at their first commit | [[Pricelab - Build and test the cores]] |
| [[GitHub showcase]] | The GitHub profile, its cards redrawn daily from the homelab and the nexus | [[GitHub showcase - Update the profile]] |

## How they fit
```text
            Homelab UI ──► Agent runtime ──MCP──► Agent toolbox ──► grafana/mongodb/postgres MCP
                │               │                      │
                └───────────────┴──── all run on ──► Homelab (k3s, helmfile, kube-charts)
  pycraftcore ◄── used by Agent runtime, Agent toolbox, Web framework benchmark
  Archetype   ──► the layout they grew from; generated Pricelab's cores
  GitHub showcase ◄── reads the homelab's helmfile and this vault every day
```

New project: `Projects/<Project>/` with a note from the *Project* template, then a row here.
