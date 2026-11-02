---
name: blur-reveal
description: Builds a WebGL text reveal in which a short line of type dissolves in through a soft, cloudy noise front, sharp behind the front and blurred at it, with a faint glow riding the edge, then dissolves out as the next coloured panel takes over. Use when someone asks for a blur-in text animation, a dissolve or materialise effect on a headline, a noise mask reveal, cycling slogans on coloured cards, or a shader text transition.
---

# Blur reveal

Coloured panels in turn, each short line dissolving in out of a blur and drifting into focus. See it live at https://design.how/vault/blur-reveal.

## What to build

Six panels take turns. Each one is a single bold background with a short lowercase line set across it in a contrasting colour, such as gold on pine green or hot pink on near black. The line never slides or types on. It condenses out of a haze, holds for 900ms, dissolves back out, and the background cross-fades over 320ms into the next panel while the next line starts to form.

The reveal is one fragment shader over the line drawn to a canvas texture. Each pixel gets a front position from a domain-warped four-octave noise field mixed 70 to 30 with its distance from a centre that wanders per panel. A pixel shows once the reveal progress passes its front position, eased over a wide band of 0.34 either side, so the edge is a soft cloud that moves through the inside of each letter, never a wipe across the line. A per-panel seed shifts the field, so no two cycles dissolve the same way.

Blur sits only at the front. A 17-tap ring blur, up to 18 texels wide, is strongest where the front is and falls to zero behind it, and the unresolved part is sampled a little larger and nudged toward the centre, so letters drift into place as they sharpen. A wide-blurred copy of the glyph alpha adds a faint halo in the panel's text colour along the front, gone by the time the line finishes.

Progress is not an eased curve. A critically damped spring pulls it toward 1 to reveal and toward 0 to leave, slightly stiffer on the way out, so the motion settles the same at any frame rate.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/blur-reveal/`. It is React and TypeScript: `panels.ts`, `text-texture.ts`, `reveal-shader.ts`, `gl.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-wide` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/blur-reveal` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw the line once per panel to a 2D canvas at the capped pixel ratio, sized to fit on one line at most 86% of the card's width, and upload it as a texture.
- In the fragment shader, give each pixel a front position from domain-warped fbm noise mixed with a radial distance, offset by a per-panel seed.
- Reveal each pixel with a smoothstep band around the progress, and blur it with a ring blur whose radius is largest at the front and zero behind it.
- Add a soft glow in the text colour along the front from a wide-blurred copy of the glyph alpha, fading out as the line completes.
- Drive progress with a critically damped spring toward 1, hold, then toward 0, and swap panels when the line is gone.
- Stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw the first panel once with its line fully resolved.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PANELS` | six lines, each with bg and fg | The lines and their colour pairs, in order. |
| `HOLD_MS` | 900 | How long a resolved line holds before it leaves. |
| `BG_MS` | 320 | The background cross-fade between panels. |
| `MAX_BLUR` | 18 | The blur radius at the front, in texels. |
| `K_IN, K_OUT` | 42, 60 | Spring stiffness for the reveal and the exit. Higher is snappier. |
| `--visual-wide` in fonts.css | system-ui, sans-serif | The typeface for this role, a wide or extended sans. Put the project's face first. |
