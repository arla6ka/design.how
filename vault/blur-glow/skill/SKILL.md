---
name: blur-glow
description: Builds a WebGL bloom effect in which a crisp rounded word sits inside a soft glow on light paper, the glow built from a downsampled multi-pass gaussian blur with variable focus and mapped through a five-stop colour ramp, the word tinted per palette and grained, cross-dissolving letter by letter into the next word and colour world, with the pointer warping the letters. Use when someone asks for glowing text, a bloom or halo around type, a gradient-mapped glow, neon on light, soft dreamy titles, a colour-cycling word, or a gaussian blur chain in WebGL.
---

# Blur glow

A crisp rounded word in a soft gradient-mapped glow on light paper, dissolving into the next word and colour. See it live at https://design.how/vault/blur-glow.

## What to build

One rounded word, crisp, sitting inside a soft halo of colour on light paper. The halo runs from the palette's dark core through two bright bands to the paper colour, so a coloured band hugs the letters and fades out; the letters themselves are tinted the palette's ink, not black. The word holds, then dissolves letter by letter, left to right, into the next of three words, and the colour world changes with it through six palettes. The first word rests a little longer than the others so the loop does not tick like a metronome.

The glow is a real bloom, not a stack of blurred copies. The word mask is blurred with a separable 9-tap gaussian down a chain of four framebuffers at a half, a quarter, an eighth and a sixteenth of the canvas, which gives a huge halo with no banding. The blur gets stronger toward the ends of the word, a depth-of-field that keeps the middle sharp. The composite sums the levels with falling weights, maps that luminance through the five-stop ramp, nudges the coarser levels along one direction so the light reads as cast from the upper left, lays the crisp word on top and adds a soft-light film grain.

The dissolve staggers on purpose: the incoming halo arrives before its letters (an exponent of 0.78 on the eased morph) and the outgoing glow lingers after its body (1.3), with the outgoing clock running 0.22 ahead, so mid-transition there is a moment of almost pure glow. The pointer displaces where the crisp mask and the first blur level are sampled, a swirling bulge stretched along its direction of travel and dragged by its velocity, small enough that it never bands the blur.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/blur-glow/`. It is React and TypeScript: `params.ts`, `text-mask.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-rounded` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/blur-glow` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise each word once into a mask texture in the rounded face; keep two masks so the outgoing and incoming words can blend.
- Blur the mask down a four-level chain of framebuffers with a separable 9-tap gaussian, stronger toward the ends of the word.
- Composite in one pass: sum the levels with falling weights, offset the coarser ones along a cast direction, gradient-map through five stops, lay the crisp word in the palette ink, and soft-light a film grain.
- Cross-dissolve with per-letter stagger, the halo leading and the body lagging by exponents on one eased clock, and lerp the palette uniforms alongside.
- Warp the sampling of the crisp mask and the finest level around the pointer, stretched along its motion and dragged by its velocity.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy free the framebuffers, programs, buffer and textures and lose the context.
- Under reduced motion, draw one frame of the first word, with no fade-in.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | ["hello", "pookie", "monkey"] | The words the card dissolves between. |
| `PALETTES` | Ultraviolet, Molten, Bubblegum, Electric, Jade, Sunburst | The colour worlds: five ramp stops from core to paper, plus ink and paper. |
| `HOLD_MS, HOLD_SCALE` | 700, [1.45, 0.9, 1.0] | How long each word holds, and a per-word multiplier so the cycle breathes. |
| `MORPH_SEC` | 0.8 | Length of the cross-dissolve. |
| `LETTER_SPREAD` | 0.45 | How much of the dissolve separates the first letter from the last. |
| `GRAIN` | 0.4 | Film-grain strength. |
| `WARP_AMP, WARP_RADIUS` | 0.013, 0.2 | How far and how wide the pointer pushes the letters. |
| `--visual-rounded` in fonts.css | ui-rounded, system-ui, sans-serif | The typeface for this role, a rounded sans. Put the project's face first. |
