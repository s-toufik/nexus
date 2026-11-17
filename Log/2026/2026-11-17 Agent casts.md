---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]"]
tags: [log, design, pixel-art, appearance]
---

# 2026-11-17 Agent casts

## What we did
- Asked for Pokémon and Digimon agents. Declined to draw those franchises' creatures (not mine to recreate, even for a private homelab) and offered original monster casts plus a slot for the owner's own sprites instead.
- **Appearance › Agents**: a cast picker apart from the theme, any cast with any theme. "Match my theme" (default) gives the four storybook themes their own cast and the rest Homelab; a chosen cast stays when the theme changes. Live preview of the seven agents at work; saved in the browser (`homelab-ui.agent-cast`) and on the account (`homelabCast`), loaded at start like the theme.
- Six new casts, 42 scenes, each with resting, working, waiting and trouble poses: Wizarding (castle hall, floating candles), Dragon Rider (obsidian camp, a real flying dragon), Demigod (marble and Aegean), Regency (striped parlour, chandelier), Pocket monsters (original creatures on a meadow route), Digital monsters (original creatures on a four-shade LCD screen that glitches).
- Your own sprites: `public/sprites/<agent>.png`, four mood rows of 3:2 frames, any number of frames, 8 per second; missing images fall back to the Homelab scene.
- Code: one file per cast in `agent-scene/casts/`, sharing `kit.ts` (palette, a `figure()` for people with hats, hair, beards and robes, `pose()` for hands per mood, marks, smoke, glow, candles). A node contact sheet renders every cast × mood to PNG to check the art.
- Checks: 305 tests (every cast paints every pixel in every mood, moves while working, each mood differs; cast model and store; sprite sheet maths), build, Agents and Appearance captures.

## What I learned
- One parametric figure (body taper, robe shading, hair styles, hats, beard) plus props per scene gives many distinct characters for little code; the pose function makes resting, waiting and trouble consistent across 49 scenes.
- A contact sheet (all scenes × moods, scaled ×3, encoded with a tiny PNG writer over `zlib.deflateSync`) catches art problems a unit test can't, and the "every pixel painted" test catches gaps the eye misses.
- A "theme" default that resolves to a concrete choice, stored apart from the explicit choice, lets two preferences mix without fighting.

## Next
- [ ] Commit, release and deploy homelab-ui and agent-runtime.
