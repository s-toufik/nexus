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
| Is it a way to learn something? | `Paths/<Track>/` | `Path - Containers and Kubernetes`, `Project - Game day` |
| Does it belong to one project? | `Projects/<Project>/` | a Homelab guide, an agent-toolbox decision |
| Otherwise: an idea that outlives any project | `Knowledge/<domain>/` | `Knowledge/Kubernetes/NetworkPolicy` |

A note never sits loose at the top of a folder, except the folder's index (`Projects/Projects.md`…).

## Inside a project
```
Projects/<Project>/
├── <Project>.md        what, why, state, where to read next
├── <Project>.canvas    the picture: parts and how they talk
├── <Project> decisions.md   one entry per decision, newest first
├── Architecture/       how it works, one note per part, read in order
├── Guides/             how to run it: one guide per job, and an index `<Project> guides`
├── Pages/              an app with a UI: one note per page, `<Project> page - <Page>`, with an annotated screenshot (in `System/Assets/<Project>/`), and an index `<Project> pages`
└── Repos/              one note per repository
```

## Names
- Notes are named for what they hold, in plain words: `NetworkPolicy`, not `k8s-netpol-notes`.
- Every note name is unique in the vault, so links never need a path: a project's notes start with the project's name (`Homelab decisions`, `Agent runtime turn`).
- Log notes start with the date: `YYYY-MM-DD <topic>`.
- Paths are named `Path - <topic>`, projects that combine paths `Project - <what you build>`, filed by track (`Platform`, `Applications`, `AI`, `Judgement`, `Projects`). A path is standalone: it says what to know before and what to take then, and opens with a *Principles → projects* table. Each lesson teaches in place — **Learn** (definitions, how it works, a real example from our code verified in the repository, a common mistake) — then **Do** (👀/✋ with the result to expect), **Check** (answers in a collapsed `> [!success]-` callout), **You can now**; the path ends with a milestone. Learners start with the project tours (`Path - Tour of …`).
- Guides are named `<Project> - <job>`, the job in the imperative: `Homelab - Release an app`. One guide per job; the project's index is `<Project> guides`.
- A guide is steps only, from the *Guide* template: numbered steps, each `make` command followed by its raw command, what each step should print. Explanations go in the notes listed under *Why it works*.
- Folders inside `Knowledge/` are domains: `Kubernetes`, `Networking`, `Security`, `Data`, `AI`… Add one when three notes share it.

## Properties
Every note starts with properties from its template in `System/Templates`: at least `type` and `tags`. `type` is one of `project`, `architecture`, `decisions`, `repository`, `guide`, `concept`, `path`, `source`, `log`, `index`.

## Links
- Link the first mention of a concept, project or source: `[[NetworkPolicy]]`.
- A concept note links to where our projects use it; a project note links to the concepts it uses. Backlinks do the rest.
- A source's key ideas link to the concept notes they feed.
- External pages (official docs, articles to look something up) are plain links in a note's *Go further*. A source gets its own note in `Sources/` when it's worth reading in full: a book, a course, a long article.
- Don't repeat: link to the note that already says it.

## Sources and files
- One note per source, from the *Source* template: why read it, key ideas in your words, at most a few short quotes.
- PDFs and downloads go in `Sources/Files/`. That folder isn't pushed: the repository is public and the files belong to their authors.

## Public repository
Never write secrets, passwords, tokens, internal IP addresses, domain names of the home server or personal data. Use placeholders: `<router-ip>`, `<domain>`.
Screenshots too: mask them before they're taken (`<HOMELAB_DOMAIN>`, `<server>`, `<pod-ip>`, `you@example.com`), and look at every picture before it's committed.
