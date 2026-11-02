---
name: pixel-threshold
description: Builds a WebGL poster effect in which a short word is printed into a flat colour ground in hard pixel blocks, with a white halo and a black block shadow that staircase in step with the letters, a printed surface of moire, grain and dust plates, and a cycle where the grid collapses to big squares, swaps word and colourway and resolves back. Use when someone asks for pixel type, a blocky or 8-bit headline, a threshold or quantised text effect, a retro game poster, a resolution-drop transition, or printed-texture type in WebGL.
---

# Pixel threshold

A word printed into a flat colour poster in hard pixel blocks, collapsing and resolving into the next word. See it live at https://design.how/vault/pixel-threshold.

## What to build

A hot red poster with one short word printed into it in hard pixel blocks: an italic near-black face, a white halo three blocks wide and a black keyline of the same width pushed one block down and right, so it shows as a block shadow. Every edge staircases on one lattice of 150 cells across. A printed surface lies over the whole poster, letters included: a moire interference plate in hard light, a fine grain in linear light and a dust plate in screen, then a speckle of a fringe colour along the halo's rim, a levels crush and a touch of vibrance.

The blocks come from real low resolution, not from thresholding a blur. The word is rasterised into a tiny canvas the size of the grid, thresholded to one bit, and the halo and keyline are dilated in whole cells on that same grid, so all three layers quantise in register. The three masks go up as the R, G and B channels of one texture, scaled with nearest neighbour, and the fragment shader paints ground, keyline, halo and face from them before laying the plates over the top.

The one piece of motion is the grid itself. The word holds for 1.9 s, then the cell count falls from 150 to 55 in 0.24 s, the word and colourway change at the coarsest frame where nothing is legible, and it resolves back to 150 over 0.38 s. The count is eased geometrically, equal ratios rather than equal steps, so each change in block size reads as an equal jump. Four phrases and six colourways rotate through.

The pointer moves the light. The block shadow swings away from it in whole cells, eased as a float and rounded only when the mask is rebuilt; the word leans about 1.6% of the frame toward it; and the moire is sampled a second time rotated by up to three degrees around the pointer and blended in, which slides the interference bands under the hand while the print stays put.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pixel-threshold/`. It is React and TypeScript: `params.ts`, `cycle.ts`, `text-mask.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Copy `assets/media/` to the app's static folder as `public/pixel-threshold/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
7. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
8. Run `node scripts/check.mjs components/pixel-threshold` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word at the grid's own resolution (cols across), threshold it to one bit, and dilate halo and keyline in whole cells on that grid; offset the keyline in cells for the shadow.
- Pack face, halo and keyline into R, G and B of one texture, upscaled with nearest neighbour, and rebuild it only when the quantised cell count, the shadow cell or the word changes.
- In one fragment shader over one triangle, paint ground, keyline, halo and face from the three channels, then lay the moire (hard light), grain (linear light) and dust (screen) plates over everything, each tiled as a square REPEAT texture.
- Finish with a levels crush (5 to 230) and a small vibrance lift.
- Run the cycle as hold, collapse, resolve, easing the cell count geometrically between 150 and 55, and change word and colourway at the bottom of the collapse.
- Ease the pointer's presence, swing the shadow away from it in whole cells, and rotate a second moire sample around it, blended rather than min-ed so the surface never darkens.
- Load the plates with crossOrigin set, and fall back to clamp if one is not a power of two.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the program, buffer and four textures and lose the context.
- Under reduced motion, draw the resting poster once in the first colourway.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SEQUENCE` | ["pixel", "insert coin", "player one", "game over"] | The words the cycle rotates through. |
| `COLORWAYS` | six {ground, ink, paper, fringe} | The poster colours. The first is the resting one. |
| `DEFAULTS.threshold` | 0.588 | The luminance below which the ground's own shadows deepen, a mild burn under the print. The letterforms come from the grid, not from this. |
| `FINE, COARSE` | 150, 55 | Cells across at rest and at the bottom of the collapse. |
| `HOLD_MS, COLLAPSE_MS, RESOLVE_MS` | 1900, 240, 380 | How long each phase of the cycle runs. |
| `DEFAULTS.halo, DEFAULTS.keyline` | 3, 3 | White halo and black keyline width, in cells. |
| `DEFAULTS.keylineOffset` | [1, 1] | How far the keyline is pushed into a drop shadow, in cells. |
| `DEFAULTS.texture` | 0.25 | Strength of the printed surface. 0 is a clean vector poster. |
| `FONT_CSS, FONT_WEIGHT` | var(--visual-sans), 600 | The face and weight. A thin stroke does not survive being quantised. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
