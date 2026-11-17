---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]"]
tags: [log, design, canvas, pixel-art]
---

# 2026-11-17 Observatory globe and pixel cast

## What we did
- Showed three directions for the Center globe (engraved celestial globe, armillary sphere, observatory sky) and three for the agents (ink characters, shadow theatre, pixel diorama) on one live page, switchable across the ten themes. The choice: **observatory sky** and **pixel diorama**.
- **Center globe**: the Milky Way (1500 soft clouds along a band tilted 62°, warmer and thicker near the core) with a dark dust lane, stars coloured by temperature with spikes on the brightest, constellation lines and lettering in the theme's capitals, an atmosphere at the limb and a graduated ring that turns with the globe. Each theme tints the night: `night` in `scripts/themes.mjs` emits `--sky-high`, `--sky-mid`, `--sky-deep`.
- **Agents**: each agent is a character in a 96 × 64 pixel scene at 8 frames a second, with resting, working, waiting (a ? bubble) and trouble (a red !) poses: the Maestro (Assistant), Chef Basile (Kitchen), Pip the Navigator (Travel), the Night Owl (Observation), Professor Tortoise (Analysis), the Hacker Cat (Coding), the Gate Bulldog (Security). The 1400 lines of SVG and CSS animation are gone.
- Checks: 211 tests (new: every scene paints every pixel in every mood, moves while working, each mood differs; sprite outline; Milky Way density), build, screenshots.

## What I learned
- Drawing pixel art into an own `Uint32Array` frame buffer, then one `putImageData`, keeps pixels crisp (no anti-aliasing), makes outlines a simple neighbour test, and lets the scenes be unit-tested without a canvas.
- Hard-edged circles make a Milky Way look like bubbles; a pre-drawn soft radial "puff" sprite, drawn with `drawImage` and `lighter` blending, looks like mist and costs less than a gradient per cloud.
- One shared `requestAnimationFrame` clock stepping at 125 ms, drawing only scenes on screen (IntersectionObserver), keeps seven animated canvases cheap.

## Next
- [ ] Commit, release and deploy homelab-ui (with the plan panel and stopped-answer fixes) and agent-runtime.
