---
name: chroma-glow
description: Builds a WebGL glow effect in which one bold word blooms on a coloured wall and its halo splits into a warm, a cool and a fringe copy that drift apart like light through a lens that cannot quite focus, with grain, a vignette and a pool of extra glow under the pointer. Use when someone asks for a chromatic aberration glow, an RGB split or prism fringe on text, a bloom or neon word, a glowing headline shader, or a downsample bloom in WebGL.
---

# Chromatic glow

A word that glows on a coloured wall and splits into warm and cool copies at its edges. See it live at https://design.how/vault/chroma-glow.

## What to build

One short, heavy word sits in the middle of a deep coloured wall and glows. The light is not one colour. Its halo is three copies, a warm one, a cool one and a fringe, pulled a few pixels apart so the edges read as a soft rainbow, and the split wanders on its own path so the colours slide around the letters without the word moving. The card walks six sound-effect words, each with its own colour world, two of them light walls where the word is pressed in dark and the glow becomes a coloured shadow.

The glow is real bloom, built cheaply. The word is drawn once as a white mask, then blurred into four framebuffers at half, a quarter, an eighth and a sixteenth of the canvas, each with a separable 9-tap gaussian. Small buffers make a wide halo for almost nothing. The composite samples the summed levels three times at offset positions, tints each copy and tone-maps the sum with 1 minus exp(-x), so the glow can never clip to flat white. The tight levels carry most of the weight, so the light hugs the letters.

On top of the base split, five taps across the spectrum along the split direction, pushed further toward the edges of the card, add a refined rainbow rim. A faint fbm mottle and sheen make the wall a lit surface instead of flat colour, with grain over everything. Between words the split spreads wide and the core melts, so the old word blooms into haze, swaps under it, and the new word condenses back out in about half a second.

The pointer does not drag the word. It opens a soft pool of extra bloom and spectrum about a third of the card wide, with a small ripple in the sampled position, so the light lifts where the pointer is and settles back when it leaves.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/chroma-glow/`. It is React and TypeScript: `params.ts`, `text-mask.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-wide` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/chroma-glow` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word in white on a transparent 2D canvas at most 1400 pixels wide, sized to 42% of the height and shrunk to fit 78% of the width.
- Build a four-level downsample chain at 1/2, 1/4, 1/8 and 1/16 of the canvas, each level blurring the one before with a separable 9-tap gaussian.
- In the composite, sum the levels with weights 0.85, 0.55, 0.22 and 0.10, sample that sum at +split, -split and a rotated offset, tint the three copies warm, cool and fringe, and tone-map with 1 - exp(-x).
- Drive the split from a smooth wander of layered sines, never from the pointer; the pointer only adds a local pool of bloom and spectrum.
- Swap words by easing a disperse value up over 0.24s, changing the word and palette at the peak, and easing it down over 0.32s.
- Stop the loop on webglcontextlost, and on destroy delete the programs, the buffer, the mask and every bloom framebuffer and texture, then lose the context.
- Under reduced motion, draw the first word in its colour world once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `HERO_CYCLE` | boom, poof, zap, pow, yeet, oof | The words the card walks and the colour world each one gets. |
| `CHROMA_PRESETS` | six colour worlds | Warm, cool and fringe tints, wall colour, split, bloom, core, grain, spectral amount and light or dark wall. |
| `split` | 9 px at 620 tall | How far apart the warm and cool copies sit. |
| `bloom` | 1.62 | The glow gain into the tone map. |
| `spectral` | 0.6 | How much true rainbow rides over the three-colour split. |
| `--visual-wide` in fonts.css | system-ui, sans-serif | The typeface for this role, a wide or extended sans. Put the project's face first. |
