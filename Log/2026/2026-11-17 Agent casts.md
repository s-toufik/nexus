---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]"]
tags: [log, design, pixel-art, canvas, appearance]
---

# 2026-11-17 Agent casts

## What we did
- Asked for Pokémon and Digimon agents. Declined to draw those franchises' creatures (not mine to recreate, even for a private homelab) and offered original monster casts plus a slot for the owner's own sprites instead.
- **Appearance › Agents**: a cast picker apart from the theme, any cast with any theme. "Match my theme" (default) gives the four storybook themes their own cast and the rest Homelab; a chosen cast stays when the theme changes. Live preview of the seven agents at work; saved in the browser (`homelab-ui.agent-cast`) and on the account (`homelabCast`), loaded at start like the theme.
- Six new casts, 42 scenes, each with resting, working, waiting and trouble poses: Wizarding (castle hall, floating candles), Dragon Rider (obsidian camp, a real flying dragon), Demigod (marble and Aegean), Regency (striped parlour, chandelier), Pocket monsters (original creatures on a meadow route), Digital monsters (original creatures on a four-shade LCD screen that glitches).
- Your own sprites: `public/sprites/<agent>.png`, four mood rows of 3:2 frames, any number of frames, 8 per second; missing images fall back to the Homelab scene.
- Code: one file per cast in `agent-scene/casts/`, sharing `kit.ts` (palette, a `figure()` for people with hats, hair, beards and robes, `pose()` for hands per mood, marks, smoke, glow, candles). A node contact sheet renders every cast × mood to PNG to check the art.
- **Machines** cast added after: a dispatch robot sorting data cubes onto belts, a kettle bot, a rover on a red planet, a searchlight drone, a tape-reel computer, a many-armed typist, a tank-tread vault guard, in a riveted factory.
- The casts pushed the main bundle 5.7 kB over its 600 kB budget (the Assistant panel shows scenes on every page), so every cast but Homelab now loads with a dynamic `import()` the first time it is shown; main bundle 564 kB.
- **Smooth casts** after that, approved from a live preview first: Neural (glass AI beings with glowing eyes, aurora studio, holograms), Sylvan (elves in an old forest: herald, cook, punter on a leaf boat, seer at a moonwell, lorekeeper, light-loom weaver, archer at a living gate), Deepforge (dwarfs under the mountain: thane at the mine map, hearth cook, mine cart, telescope watcher, gem assayer, runesmith, vault guard). Drawn as vector shapes on a canvas in a 300 × 200 space, scaled to the screen's pixels, animated up to 30 frames a second. Code in `agent-scene/smooth/` (kit, one file per cast, lazy registry).
- "Your own sprites" looked the same as Homelab with no images; it now shows an empty frame and "No images yet" until at least one image exists.
- Checks: 342 tests after the smooth casts (319 after Machines, was 305) (every cast paints every pixel in every mood, moves while working, each mood differs; cast model and store; sprite sheet maths), build, Agents and Appearance captures.

## What I learned
- Dynamic `import()` per cast keeps art out of the main bundle; the scene draws the Homelab fallback for the instant the cast is loading, then redraws.
- One parametric figure (body taper, robe shading, hair styles, hats, beard) plus props per scene gives many distinct characters for little code; the pose function makes resting, waiting and trouble consistent across 49 scenes.
- A contact sheet (all scenes × moods, scaled ×3, encoded with a tiny PNG writer over `zlib.deflateSync`) catches art problems a unit test can't, and the "every pixel painted" test catches gaps the eye misses.
- Smooth scenes share the pixel scenes' clock but redraw every animation frame (capped at 30 a second) instead of every 125 ms tick; the canvas backing size follows `clientWidth × devicePixelRatio` so thumbnails and large cards are both sharp.
- jsdom has no canvas: a Proxy that records every context call and property set, plus a stub `Path2D`, lets a test prove each scene draws, each mood draws differently and working changes over time.
- A "theme" default that resolves to a concrete choice, stored apart from the explicit choice, lets two preferences mix without fighting.

## Next
- [ ] Commit, release and deploy homelab-ui and agent-runtime.
