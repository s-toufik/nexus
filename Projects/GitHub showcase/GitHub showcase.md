---
type: project
status: active
started: 2026
repos: [s-toufik]
tags: [project, github-showcase]
updated: 2026-11-08
---

# GitHub showcase

> The GitHub profile page (repository `s-toufik/s-toufik`, local folder `github_showcase`): a README with SVG cards that a scheduled GitHub Actions workflow redraws every day from live data — the homelab's helmfile, the nexus vault, the account's repositories and contributions.

## What's on it
| Card | Drawn from |
|---|---|
| `hero.svg` | `.github/profile.json` (name, tagline, about, featured repositories) + each featured repo's activity |
| `cluster.svg` | homelab-infra's `helmfile.yaml.gotmpl`: every release by group, with the path of one question through the cluster |
| `nexus.svg` | this vault's tarball: folders with their note counts and a graph of every note and its links |
| `languages.svg`, `streak.svg`, `achievements.svg` | the GitHub API: languages across repositories, contributions and streak, achievements |
| the snake | a separate workflow (`snake.yml`) eating the contribution graph |

So **the nexus is on the profile**: every note and link added here shows in `nexus.svg` the next morning — another reason to keep it public-safe.

## How it works
```text
cron 04:00 UTC (metrics.yml) ─► python render.py <owner> profile.json cards
    github_api.py  REST + GraphQL (METRICS_TOKEN, or the default token)
    render.py      hero · nexus (vault tarball) · cluster (helmfile) · main
    cards.py       SVG helpers, languages, streak        achievements.py
  ─► git commit "Update profile cards [skip ci]" ─► push
```
- Plain Python, no dependencies; SVG written as strings.
- `[skip ci]` keeps the bot's commit from triggering workflows again; `concurrency: metrics` stops two runs racing.
- The workflow also runs when its scripts or `profile.json` change, and by hand (`workflow_dispatch`).

## Guide
[[GitHub showcase - Update the profile]]

## Knowledge it uses
[[CI with GitHub Actions]] · [[Homelab]] · [[Home|the nexus]]
