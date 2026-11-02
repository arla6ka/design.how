---
name: pixel-scan
description: Builds a WebGL fragment-shader text effect in which a diagonal scan band sweeps across a word and breaks it into a dense spray of tiny jittered blocks that shimmer between two accent colours, leaving the word solid behind it, with a pool of blocks under the pointer and a fading wake. Use when someone asks for a pixel scan, a scanline or glitch text reveal, text assembling from pixels, a hover trail over type, or a shader text intro.
---

# Pixel scan

A diagonal band assembles a word out of a spray of tiny blocks, then a pool of blocks follows the pointer. See it live at https://design.how/vault/pixel-scan.

## What to build

One word in a display serif, set at 12 percent of the card width in near-black on a pale blue-white card. On mount a diagonal band crosses it from the bottom left over 2.6 seconds with an ease-out. Ahead of the band there is nothing; inside it the word is a dense spray of tiny squares shimmering between light blue and pink; behind it the word is solid type. Coming onto the card with the pointer, or tapping it, plays the scan again.

Everything is one fragment shader over the card. The word is drawn with fillText into an offscreen canvas and uploaded as a texture, and its alpha is the glyph mask. The shader lays three lattices over the card at about 27, 38 and 43 cells across the half width, and for each pixel looks at its cell and the four neighbours. A cell is a small box at 0.38 of its pitch, masked to the glyph, that lights when the band's position matches its own diagonal position plus a random offset 2.2 times the band's width. The offset is wider than the band, so neighbours light at very different moments and the band reads as a spray, not a wipe.

A lit cell's colour drifts between the two accents on its own phase, and its edge brightens as it peaks. The pointer adds a second source: a pool about a fifth of the card wide whose reach wobbles with angle and time, applied along a 24-point wake. The points are dropped at a fixed 3 px spacing with staggered birth times and fade over 1.1 seconds, so the wake tapers instead of flashing. Cells near the pointer also lean toward it by a hair.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pixel-scan/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 420, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-display` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/pixel-scan` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word into an offscreen canvas at the card's pixel size, flipped, and upload it as the shader's texture.
- Draw one full-screen triangle; for each of three lattice scales, sample the texture faded by the band and add the centre cell weighted four times plus its four neighbours.
- Light a cell by smoothstep(2W, 0, |diagonal position + hash * 2.2W - t|), masked by the glyph alpha at its centre.
- Ease the pointer, walk a pen toward it in fixed steps into a ring of 24 points with staggered birth times, and light cells within a wobbling reach of any point by its freshness.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw the scan once at 0.55: half solid word, half spray.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | "scanline" | The word. Short words read best. |
| `ACCENT, ACCENT2` | light blue, pink | The two ends of the cells' shimmer. |
| `TEXT_COLOR, GROUND` | #191b24, #fafdff | The word's ink and the card's ground. |
| `ENTRANCE_SECONDS` | 2.6 | How long the assemble scan takes. |
| `MODE` | 3 | Scan direction: 0 left to right, 1 top down, 2 radial, 3 diagonal. |
| `SPOT_RADIUS, TRAIL_LIFE` | 0.28, 1.1 | The pointer pool's size and how long its wake lasts. |
| `FONT_VAR` | --visual-display | The CSS variable holding the font family. Any display serif works. |
| `--visual-display` in fonts.css | Georgia, serif | The typeface for this role, a display face. Put the project's face first. |
