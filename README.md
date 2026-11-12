# Nexus

My knowledge hub: every project I build, why it's built that way, and the ideas behind it, written to be learned from. It's an [Obsidian](https://obsidian.md) vault: clone this repository and open it in any Obsidian.

<p align="center">
  <a href="Projects/Agent%20runtime/Agent%20runtime.md"><img src="System/Assets/Agent%20runtime/Agent%20runtime%20-%20Harness.svg" alt="agent-runtime as a harnessed LLM agent: a harness of routing, guard, review, step limit, plan approval, summarizing and observability, around models, memory and protocols" width="900"></a>
</p>

**The flagship: [agent-runtime](Projects/Agent%20runtime/Agent%20runtime.md)**, an AI agent built as a *harness* around a model. Every turn is routed step by step (understand, plan, screen, act, run tools, review, finish, summarize) by a routing table, and each piece of the picture has a note here:
- **Harness:** [routing](Projects/Agent%20runtime/Architecture/Agent%20runtime%20turn.md), a guard, plans you approve, a self-review with retries, a step limit that pauses and resumes, summaries of long chats, a trace span per step.
- **Models:** six roles, each with its own model, prompt and token budget, behind retries and a circuit breaker.
- **Memory:** the conversation, its rolling summary, a pending plan, and checkpoints in SQLite or MongoDB.
- **Protocols:** SSE to the user, MCP to its tools ([agent-toolbox](Projects/Agent%20toolbox/Agent%20toolbox.md)), REST for models and health, OTLP for traces and logs.

## Layout

| Folder | Holds | Example |
|---|---|---|
| `Projects/` | What we build, and why: one folder per project with its note, map, decisions, guides and repositories | `Projects/Homelab/Guides/Homelab - Deploy a change.md` |
| `Knowledge/` | What things are and how they work: one note per idea, a folder per domain | `Knowledge/Kubernetes/NetworkPolicy.md` |
| `Paths/` | In what order to learn things, with practice in our projects | `Paths/Kubernetes from zero.md` |
| `Sources/` | What others wrote: one note per article, book, paper, video or course | `Sources/Attention is all you need.md` |
| `Log/` | What happened, and when: one note per work session | `Log/2026/2026-11-08 The nexus.md` |
| `System/` | How the nexus works: conventions, templates, attachments | `System/Templates/Concept.md` |

`Home.md` is the start page. Where a note goes, how it's named and linked: [System/Conventions](System/Conventions.md).

## How it's written

- **Teach, don't list.** A note says what something is, why it's that way, and how to check you understood it.
- **One idea per note**, linked rather than repeated.
- **Decisions keep their reasons and the alternatives turned down.**
- **Sources are summarised in my own words**; their files stay out of the repository (`Sources/Files/` is git-ignored).
- **Public repository:** no secrets, passwords, tokens, internal addresses or personal data.

## Open it

Clone this repository and open the folder as a vault in Obsidian. The Obsidian Git plugin, included, pulls on start and pushes every 10 minutes. Details, also without git: [System/Open the nexus](System/Open%20the%20nexus.md).
