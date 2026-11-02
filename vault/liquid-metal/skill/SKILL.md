---
name: liquid-metal
description: Builds a WebGL fragment-shader effect that renders one bold word as flowing polished liquid metal on near-black, by blurring the word into a rounded height field and env-mapping its normals through a five-stop matcap-style ramp with a bright horizon band, with a pointer-driven reflection tilt, twinkling sparks on the ridges and eight colourways that crossfade on click. Use when someone asks for mirror-finish or metallic text, a liquid metal or mercury effect, a matcap or environment-mapped shader on type, a shiny 3D-looking title without 3D, or a reflective logo treatment in WebGL.
---

# Liquid metal

One word as flowing polished metal on black, its reflection streaming as the pointer moves. See it live at https://design.how/vault/liquid-metal.

## What to build

The word "metal", set heavy and tight so the letters nearly touch, rendered as poured polished metal on a near-black backdrop. A bright horizon line runs through every letter, with cool sky above it and a dark band and teal ground below, the way a polished object reflects a studio. Moving the pointer tilts the reflection, so the horizon slides and the metal seems to stream; glints twinkle on the brightest, most curved ridges, and the valleys where strokes meet darken. A click crossfades metal and backdrop together to the next of eight colourways.

There is no geometry. The word is rasterised once into a texture with three channels: crisp coverage, a wide blur that becomes the big rounded bulge of each letter, and a tighter blur that adds a little surface curvature. The shader takes the gradient of the combined height as a normal and looks the reflected direction up in a five-stop vertical ramp (sky, horizon light, horizon dark, ground, base), a matcap in all but name. Two blurs instead of one avoid the stair-stepping an 8-bit single blur gives a normal.

Around that sits the rest of the look: an edge bloom that keeps the soft poured rim rather than clipping it, a soft reflected horizon and a two-tone temperature split in the backdrop taken from the same ramp, so the backdrop changes colour with the metal, highlights compressed rather than clipped to white, and a fine grain. The ramp's 18 floats ease toward the next preset every frame, so a colourway change is a crossfade, not a cut.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/liquid-metal/`. It is React and TypeScript: `params.ts`, `text-mask.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/liquid-metal` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word once, fitted to about 82% of the width with slightly negative tracking, into R crisp coverage, G a wide blur and B a tight blur.
- Draw one quad; in the fragment shader, take the normal from the gradient of the combined height and reflect a view direction tilted by the eased pointer.
- Shade by indexing a five-stop ramp with the reflected vector's vertical component, with a sharp horizon between the light and dark stops.
- Add edge bloom, sparks on bright ridges from a hash, a backdrop derived from the same ramp, soft highlight compression and grain.
- Ease the ramp's 18 floats toward the target preset each frame so a colourway change crossfades metal and backdrop together.
- Rebuild the field only when the size, word or font changes, deferred to idle time.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw one still frame in the first colourway.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | metal | The word. Short and bold reads best: the metal needs surface. |
| `RAMPS` | Silver Teal, Gold, Iridescent, Rose Gold and four more | The colourways, each five ramp stops from sky to base plus a spark tint. |
| `DEFAULT_RAMP` | 0 | The colourway it starts in. |
| `FONT_CSS, FONT_WEIGHT` | var(--visual-sans), 600 | The face and weight. Heavy weights give the blur more to round. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
