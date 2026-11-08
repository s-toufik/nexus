---
type: guide
tags: [setup]
---

# Open the nexus

The nexus is the Git repository `https://github.com/s-toufik/nexus`. Any Obsidian opens it: clone it once, then the Obsidian Git plugin pulls on start and commits and pushes every 10 minutes.

## With git installed
1. `git clone git@github.com:s-toufik/nexus.git`
2. Obsidian → **Open folder as vault** → the `nexus` folder. The *Git* plugin comes with the repository: enable community plugins when Obsidian asks.

## Without git (mobile)
1. A GitHub token: **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, repository **nexus**, permission **Contents: Read and write**.
2. In Obsidian, create an empty vault named `nexus` (not in iCloud).
3. **Settings → Community plugins → Browse → Git** (by Vinzent) → **Install**, **Enable**.
4. **Settings → Git → Authentication/commit author**: username `s-toufik`, password = the token, author name and email.
5. Command palette → **Git: Clone an existing remote repo** → `https://github.com/s-toufik/nexus.git`, directory and depth left empty. Reopen Obsidian when it says *Cloned*.

## Syncing
- Obsidian pulls when it opens; changes are committed and pushed within 10 minutes, or now with **Git: Commit-and-sync**.
- The same lines changed in two places before a sync: the note shows both versions; keep one.
