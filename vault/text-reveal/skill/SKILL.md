---
name: text-reveal
description: Builds a WebGL mask-reveal effect in which two small serif text blocks in opposite corners materialise through a cloudy fractal front that sweeps the card diagonally, each part un-blurring into focus as it is uncovered, then clear the other way and return with the next phrase pair, on a warm monochrome plate with a drifting white wash, paper grain and a pointer that wipes text clear under it. Use when someone asks for a text reveal, a fog or smoke dissolve on type, blur-to-focus text, a noise mask transition, an editorial or quiet typographic animation, or fbm dissolve in WebGL.
---

# Text reveal

Two small serif text blocks that un-blur into focus through a cloudy mask, corner by corner, then clear and return. See it live at https://design.how/vault/text-reveal.

## What to build

A pale warm-grey plate with two small blocks of dark serif text, two lines in the top-left corner and two in the bottom-right, right-aligned. The text arrives through fog: a soft, wispy front sweeps from top-left to bottom-right, and every part of a letter starts blurred and drifting slightly and settles into focus as the front passes it, so the top-left block resolves first and the bottom-right after it. The pair holds for about a third of a second, breathing faintly, then clears the same way in reverse, a little quicker, and the next of three phrase pairs comes in.

The text is drawn once per pair into a canvas texture and revealed in one fragment shader. The mask is mostly a steepened diagonal, so the corners stage one after the other, textured with domain-warped fbm for tendrils and a fine stipple so the leading edge breaks into grain. Where the mask is ahead of the progress the pixel is hidden; near the front the texture is sampled with a 17-tap ring blur of up to 16 texels, scaled up a touch and drifted toward the centre, which decays to nothing as it resolves. A faint glow and a hair of colour split ride only on the front band.

Progress is a slightly overdamped spring toward 1 for the reveal and toward 0 for the clear, with a stiffer spring on the way out, so it accelerates and settles the same at any frame rate. Behind the canvas an eight-layer white radial wash drifts over 48 seconds and a fractal-noise grain sits at 5% opacity. The pointer leans each corner toward itself by its offset from that corner's anchor, and pushes the mask down near it so text wipes into focus under the hand.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/text-reveal/`. It is React and TypeScript: `params.ts`, `reveal-gl.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-display` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/text-reveal` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Render each phrase pair once into a 2D canvas at the card size, fitting the font so no line is wider than about half the card, and upload it as a texture.
- In one fragment shader over one quad, build the mask from a steepened diagonal plus domain-warped fbm and a fine stipple; flip the diagonal while clearing.
- Hide pixels the front has not reached; near the front, sample with a ring blur, a small scale-up and a drift toward centre, all scaled by how unresolved the pixel is.
- Add a faint glow and a slight per-channel offset only on the front band.
- Drive progress with a damped spring toward 1 or 0, gated by thresholds into in, hold and out phases, with a stiffer spring out.
- Ease the pointer and a hover weight; lean each corner by the cursor's offset from its anchor and push the mask down near the cursor.
- Drift the white wash from the same loop, so it pauses with everything else.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw the first pair fully revealed, in focus, with the wash at rest.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `TEXT_PAIRS` | three {top, bottom} pairs of two lines | The phrases. Keep lines short: a block spans at most about half the card. |
| `BG, INK, EDGE` | #fdfdfb, #242320, #f2f1ec | The plate, the text and the glow on the front. |
| `HOLD_MS` | 320 | How long the revealed pair lingers before it clears. |
| `K_IN, K_OUT, DAMP` | 16, 22, 1.12 | Spring stiffness in and out, and damping. Lower is slower and softer. |
| `MAX_BLUR` | 16 | Blur radius at the front, in texels. |
| `PARALLAX_AMP` | 0.006 | How far each corner leans toward the pointer. |
| `WASH_SECONDS` | 48 | How long the white wash takes to drift there and back. |
| `FONT_CSS, FONT_WEIGHT` | var(--visual-display), Georgia, serif; 500 | The face and weight. |
| `--visual-display` in fonts.css | Georgia, serif | The typeface for this role, a display face. Put the project's face first. |
