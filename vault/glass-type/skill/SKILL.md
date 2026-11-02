---
name: glass-type
description: Builds a WebGL fragment-shader effect in which black serif type on white is seen through a magnifying glass lens with a sine ripple on its radius and a colour fringe at its rim, in three scenes that take turns (a line rising through an invisible lens, a hand-drawn glass ball swapping two words, and words conveying through a wave). Use when someone asks for a lens or magnifier distortion on text, a pincushion or fisheye warp, a glass ball or refraction effect, chromatic aberration on type, or kinetic serif typography in WebGL.
---

# Glass type

Black serif type moving through one glass lens with a ripple in it, in three scenes that take turns. See it live at https://design.how/vault/glass-type.

## What to build

Black serif type on white, seen through glass. Three scenes take turns, each running its own short loop and handing over at the first loop end after five seconds. In the first, one line rises from the bottom of the frame to the top through a frame-filling lens: it arrives arched and melted, reads cleanly through the middle, and smears away off the top. In the second, the lens shrinks to a visible glass ball outlined by a boiling, hand-drawn ink ring; the ball settles from overfilling the frame to about half its height while one word swaps for another. In the third, three single words in turn enter small from the right, dwell just left of centre and accelerate out left through a gentle wave.

The type never animates. Each word is rasterised once to a texture at twice the canvas resolution, and only a content offset moves through one radial lens law: magnification 1 + str * rn^pow + rip * sin(2 pi r / wave - phase), with the ripple faded in toward the rim. The pincushion term bows straight lines toward the centre and smears the rim glyphs; near the rim the ripple is strong enough that the mapping folds, which echoes the same glyphs into concentric arcs. Each scene only changes the lens numbers and the offset, and the offsets come from per-frame tables measured at 24 fps.

Three channels are read at slightly different magnifications, scaled by 1 plus or minus 0.016 times the normalised radius, so colour fringes at the rim and the centre stays neutral where the type has to read. The ball's ring wobbles with three angular harmonics, stepped at 12 fps so it boils like ink rather than flowing. With a mouse over the card the lens centre follows the pointer up to 72% of the way from centre, easing in over 0.22 s and out over 0.5 s; touch is ignored so the glass is never stranded where a finger lifted.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/glass-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-display` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/glass-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise each word once into an offscreen 2D canvas at TEX_SS times the canvas size, fitted to a set width, and upload it only when the word, size or font changes.
- Draw one full-screen triangle and sample that texture through one radial lens law: a pincushion power term plus a rim-weighted sine ripple, with a floor on the magnification.
- Read R, G and B at slightly different magnifications scaled by the normalised radius, for a rim-only fringe.
- Drive each scene from its own per-frame tables (line y, ball radius, word x) read at a fractional 24 fps frame; hand over at the first loop end after SCENE_SECONDS.
- For the ball, mask the content to the wobbling horizon and draw that horizon as an ink ring whose weight breathes around the circle, with the wobble time stepped at 12 fps.
- Ease the lens centre toward a mouse pointer, and the hover weight in and out on separate time constants.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw the first scene once at mid-dwell, the line clean and readable through the lens.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `A_TEXT` | (clear) your view | The line that rises through the first scene. |
| `B_WORDS` | ["Slow Light", "Refraction"] | The two words the glass ball swaps between. |
| `C_WORDS` | ["Light", "is", "soft"] | The three words that convey through the wave. |
| `LENS` | {a, b, c}: radius, str, pow, rip, wave, rim0 | The lens per scene: how hard it magnifies, how strong and tight the ripple is, and where the ripple starts. |
| `DISPERSE` | 0.016 | How far the colour channels split at the rim. Much more turns into a novelty fringe. |
| `SCENE_SECONDS` | 5 | How long each scene plays before handing over at its next loop end. |
| `POINTER_PULL` | 0.72 | How far the lens centre follows the mouse. 0 turns it off. |
| `INK, PAPER` | #0a0a0a, #ffffff | The type and ground colours. |
| `FONT_VAR, FONT_WEIGHT` | --visual-display, 500 | The CSS variable holding the font family, and its weight. A high-contrast serif gives the lens hairlines to break. |
| `--visual-display` in fonts.css | Georgia, serif | The typeface for this role, a display face. Put the project's face first. |
