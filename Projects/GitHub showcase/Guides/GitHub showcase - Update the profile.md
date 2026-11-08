---
type: guide
project: "[[GitHub showcase]]"
tags: [guide, github-showcase]
updated: 2026-11-08
---

# GitHub showcase - Update the profile

> Change what the profile says or shows, and redraw the cards now.

**Where:** on your Mac, in `github_showcase`, and github.com · **All guides:** [[GitHub showcase]]

## Change the text or the featured projects
1. Edit `.github/profile.json` (`name`, `tagline`, `about`, `featured` with `repo` and `role`) or `README.md` (sections, repository list).
2. Commit and push to `main` → the **Metrics** workflow runs (it watches `profile.json` and the scripts) and commits new cards.

## Change how a card looks
1. Edit `.github/scripts/render.py` (hero, nexus, cluster), `cards.py` (languages, streak, shared SVG helpers) or `achievements.py`.
2. Try it locally: `GITHUB_TOKEN=<a read-only token> python3 .github/scripts/render.py s-toufik .github/profile.json cards`, then open `cards/*.svg` in a browser.
3. Commit and push → the workflow redraws on GitHub.

## Redraw now
- GitHub → **Actions → Metrics → Run workflow**.

## Check
- The workflow run is green and the last commit is "Update profile cards [skip ci]".
- github.com/s-toufik shows the new cards (GitHub caches images for a few minutes).

## Why it works
- [[GitHub showcase]] · [[CI with GitHub Actions]]
