---
type: guide
tags: [system]
---

# Conventions

How the nexus is kept: where a note goes, how it's named, how notes link.

## Where a note goes
Ask in this order; the first yes wins.

| Question | Folder | Example |
|---|---|---|
| Did someone else write it? | `Sources/` | an article on KV caches, a Kubernetes book |
| Is it about the nexus itself? | `System/` | a template, this note |
| Is it about a day? | `Log/<year>/` | `2026-11-08 MCP servers in the toolbox` |
| Is it an order to learn things in? | `Paths/` | `Kubernetes from zero` |
| Does it belong to one project? | `Projects/<Project>/` | the Homelab DevOps guide, an agent-toolbox decision |
| Otherwise: an idea that outlives any project | `Knowledge/<domain>/` | `Knowledge/Kubernetes/NetworkPolicy` |

A note never sits loose at the top of a folder, except the folder's index (`Projects/Projects.md`…).

## Inside a project
```
Projects/<Project>/
├── <Project>.md        what, why, state, where to read next
├── <Project>.canvas    the picture: parts and how they talk
├── Decisions.md        one entry per decision, newest first
├── Guides/             how to run it: playbooks, Q&A
└── Repos/              one note per repository
```

## Names
- Notes are named for what they hold, in plain words: `NetworkPolicy`, not `k8s-netpol-notes`.
- Log notes start with the date: `YYYY-MM-DD <topic>`.
- Guides copied from a repository keep its name: `<repo> - <topic>`.
- Folders inside `Knowledge/` are domains: `Kubernetes`, `AI`, `Architecture`, `Networking`… Add one when three notes share it.

## Properties
Every note starts with properties from its template in `System/Templates`: at least `type` and `tags`. `type` is one of `project`, `repository`, `concept`, `path`, `source`, `log`, `guide`, `index`.

## Links
- Link the first mention of a concept, project or source: `[[NetworkPolicy]]`.
- A concept note links to where our projects use it; a project note links to the concepts it uses. Backlinks do the rest.
- A source's key ideas link to the concept notes they feed.
- Don't repeat: link to the note that already says it.

## Sources and files
- One note per source, from the *Source* template: why read it, key ideas in your words, at most a few short quotes.
- PDFs and downloads go in `Sources/Files/`. That folder isn't pushed: the repository is public and the files belong to their authors.

## Public repository
Never write secrets, passwords, tokens, internal IP addresses, domain names of the home server or personal data. Use placeholders: `<router-ip>`, `<domain>`.
