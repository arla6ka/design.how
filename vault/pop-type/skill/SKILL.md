---
name: pop-type
description: Builds a squash-and-stretch type loop on Canvas 2D in which a chunky word with a hard drop shadow falls in letter by letter under gravity, squashes on a damped spring as each letter lands, swells through a doubling bulge field and pops into a ring of dashes, shown at a stepped ten frames a second with a new pair of colours every run. Use when someone asks for bouncy or cartoon type, squash and stretch on letters, a balloon or inflate-and-pop effect, a playful logo reveal, or flipbook-style animation.
---

# Pop type

Motion drops in letter by letter, squashes as it lands, swells like a balloon and pops. See it live at https://design.how/vault/pop-type.

## What to build

One word, Motion, on a 720 by 400 scene, 9:5, scaled to the box as one unit. It is set in a grotesque at semibold with a 138px cap, every letter pulled ten pixels into the one before it and drawn left to right, so each letter's shadow falls on its neighbour. The shadow is a hard second print of each glyph, ten left and eight down, in the set's second colour. Six pairs of colours take turns, one per run, starting with cobalt on coral.

Everything is a law of time in milliseconds, not a table, but the picture is read at the start of each 100ms frame and held, so a 2.6 second run plays as 26 flipbook frames and a squash is one held picture rather than a blur. The drop is gravity: each letter falls from 250px above the frame at 2600 px/s² and lands at 400, 500, up to 900ms, left to right. Falling, it stretches by 1 + v/4300 and narrows by the square root of that to keep its volume. On contact a damped spring squashes it to 0.68, rings down at 8 per second with a 400ms period, and kicks the letters already down, weaker with distance, so the landings read as one chain. The shadow lags the face by 40ms and wobbles in after it; two short dashes flick out from each letter's feet for 140ms.

From 1400ms the word swells for five held frames through a bulge field centred just left of the t, its amplitude doubling every frame, 2 to the 5u, up to 0.34. Each glyph is drawn as eight horizontal strips pushed through that field, so letters near the centre round and grow while the ends are pushed out and squeezed, which a plain scale-up never does. The shadow's offset grows with the swell, as if the face rose off the paper.

At 2000ms the word is cut, never faded, and replaced by twelve dashes 17px long, 30 degrees apart on a ring of radius 83, in the next set's face colour. One frame later the ring is at radius 203 and a third as strong, the frame after it is gone, and six frames of bare white pass before the M falls again.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pop-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 9 / 5, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/pop-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure each glyph's ink box from the live face off an offscreen raster, size the font so the first letter's cap is CAP, and overlap each letter OVERLAP pixels into the last.
- Read every law at frameStart(t), the start of the current 100ms frame, and hold it.
- Drop each letter under constant gravity to land at its CONTACT_MS, stretched by 1 + v/STRETCH_V and narrowed by its square root; on contact switch to a damped spring that squashes to SQUASH and kicks the letters already down.
- Draw each letter twice, left to right: the shadow print at SHADOW in the second colour, lagging SHADOW_LAG_MS, then the face.
- From SWELL_START_MS, bend each glyph through a Gaussian bulge whose amplitude doubles every frame, as STRIPS horizontal strips.
- At POP_MS, cut the word to POP_SPOKES dashes on a ring in the next set's face colour, then a wider fainter ring, then nothing.
- Under reduced motion, draw 1300ms once: the word at rest in the first pair of colours.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PALETTE` | six face and shadow pairs, cobalt on coral first | The colour pairs, one per run, in turn. |
| `GROUND` | #ffffff | The background colour. |
| `WORD` | ["M", "o", "t", "i", "o", "n"] | The word, one glyph per entry. CONTACT_MS needs one landing time per letter. |
| `CONTACT_MS` | [400, 500, 600, 700, 800, 900] | When each letter lands, in milliseconds into the run. |
| `SQUASH` | 0.68 | How flat a letter gets on landing. |
| `SWELL_PEAK` | 0.34 | How far the word inflates before it pops. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any heavy grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
