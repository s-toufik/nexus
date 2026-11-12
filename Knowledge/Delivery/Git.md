---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, git]
updated: 2026-11-10
---

# Git

> A version-control system: a history of **commits** (snapshots of the files, each pointing to its parent), **branches** (movable names for a line of commits), **tags** (fixed names for one commit), and **remotes** (copies elsewhere, like GitHub) you push to and pull from.

## Why it matters
Everything here is driven by git: releases are tags, the server runs what it pulled, the nexus syncs through it. Fluency with git is fluency with change.

## How it works
- `git status`, `git diff`, `git add -p` (stage parts), `git commit`, `git log --oneline --graph`.
- **Branches:** `git switch -c feature/x`; merge via a pull request.
- **Remote:** `git pull` (fetch + merge/rebase), `git push`; `git pull --rebase` keeps history linear.
- **Tags:** `git tag v1.2.0 && git push origin v1.2.0` — a release ([[Semantic versioning]]).
- **Undo:** `git restore file` (discard edits), `git revert <sha>` (a new commit undoing one — safe on shared branches), `git reset` (move a branch — only on unshared work).
- **History rewriting** (`rebase -i`, `commit --amend`, force-push) changes commit ids: never on shared branches.
- `.gitignore` keeps files (like `environments/local.yaml`) out.

## In our projects
- Branch model: [[Git flow]]; only tags reach the homelab.
- The server: `git pull` then `make apply` ([[Homelab - Deploy a change]]).
- The nexus: Obsidian Git commits and pushes every 10 minutes.

## Check yourself
1. Revert vs reset: which do you use on `main` after a bad merge?
> [!success]- Answer
> `git revert` on the merge (`git revert -m 1 <merge sha>`): it adds a commit that undoes it, so the shared history stays the same for everyone. `reset` would rewrite `main` and break every other clone.
2. Why is a moved tag dangerous for deployments?
> [!success]- Answer
> A deploy trusts that a version names one commit. Moved, the same version means different code on different machines (caches, clones, images already built from it), and you can't tell what runs.

## Go further
- [Pro Git (free book)](https://git-scm.com/book/en/v2), [Learn Git Branching (interactive)](https://learngitbranching.js.org/).
