---
name: fade-motion
description: Builds a WebGL fragment-shader effect in which a word in a bitmap pixel face trails away into light like a long exposure, the fade built from about two hundred faint overlapping copies rather than a blur, with perspective taper, a wavering tail, a hue drift along the trail and a word that turns to face the pointer. Use when someone asks for a motion trail, an echo or long-exposure text effect, light streaks behind type, a smear without blur, accumulation or afterimage type, or a glowing pixel word in WebGL.
---

# Fade motion

A pixel word trailing into light, its fade built from two hundred overlapping copies. See it live at https://design.how/vault/fade-motion.

## What to build

One lowercase word, "motion", in a bitmap pixel face, sitting a little above centre with a long trail of light falling away beneath it into the distance. On a dark preset the trail is the word's own glow added up, like a long exposure; on a light preset the same trail is ink on paper. The card runs itself: a ghost cursor fidgets near the word so it turns and leans, and every two seconds the colours wash in about a third of a second to the next of seven presets. A real pointer takes over from the ghost; the word turns to face it and the trail reels in as it comes close.

Nothing is blurred. The trail is accumulation: after k overlapping copies at alpha a, coverage is 1 - (1 - a)^k, which falls fast and then leaves a long tail, and that law is the whole look. 210 copies at a one-pixel step and an alpha of 0.019 overlap so densely they read as one ramp. The fragment shader runs it backwards: each pixel marches up the trail direction and counts how many copies would have covered it, so it is one draw call whose cost does not depend on the copy count.

Depth is a real perspective divide with a focal length of 1.6 canvas heights, so the trail tapers toward a vanishing point instead of shearing, and each copy widens a little as it falls. The tail snakes with a turbulence whose phase advances per copy, the hue drifts 26 degrees from the word to the end of the trail, and a small per-channel offset into the ramp fringes the thin end. The word itself is three layers, a wide bleed, a tight halo and a hot core, over a soft pool of light that tracks the pointer a little, inside a vignette.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/fade-motion/`. It is React and TypeScript: `shaders.ts`, `text-mask.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-pixel` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/fade-motion` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word once into a full-canvas white-on-transparent mask at the anchor, re-baking only when the size or the measured font changes.
- Draw one full-screen triangle; for each pixel, march back along the trail direction through a perspective divide and accumulate coverage as 1 - (1 - a)^k.
- Colour the trail from an HSL ramp that drifts from the word to the tail, with a small per-channel offset for the fringe and a per-copy turbulence that snakes the tail.
- Composite additively on dark presets and subtractively, as ink density, on light ones; lay the bleed, halo and core of the word on top.
- Ease the lean toward the pointer and the trail length by distance, exponentially in seconds; with no pointer, drive a ghost cursor from three incommensurate sines per axis in a tight box around the word.
- Cycle presets on a timer with a short crossfade, and report the live background so the box behind the canvas follows it.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy delete the program, buffer and mask texture and lose the context.
- Under reduced motion, draw one still frame of the first preset: no ghost cursor and no colour cycle.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | motion | The word. Short and lowercase reads best; descenders give the trail something to start from. |
| `DEFAULTS.echoes, DEFAULTS.step` | 210, 1.0 | How many copies build the trail and how far apart they sit. Past about 2 px they stop overlapping and read as ghosts. |
| `DEFAULTS.alpha` | 0.019 | Per-copy opacity. The trail builds from overlap, so keep it low. |
| `DEFAULTS.angle` | Math.PI / 2 | The trail direction. Straight down by default. |
| `DEFAULTS.hueShift` | 26 | How far the hue drifts from the word to the tail, in degrees. |
| `DEFAULTS.turbulence, DEFAULTS.spread` | 16, 0.22 | How much the tail wavers, and how much each copy widens as it falls. |
| `DEFAULTS.fringe` | 0.045 | Per-channel offset at the thin end of the trail. Above about 0.1 it reads as a mistake. |
| `PALETTES` | seven presets, add or subtract | The colour worlds the card washes between. A light preset must use subtract mode. |
| `--visual-pixel` in fonts.css | ui-monospace, monospace | The typeface for this role, a pixel or bitmap face. Put the project's face first. |
