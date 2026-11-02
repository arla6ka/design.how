---
name: shutter-type
description: Builds kinetic type on Canvas 2D seen through a rolling shutter, where the frame is cut into horizontal stripes that each show the scene a fraction of a frame late, so a jittering line and a scrolling stack tear into sliding bands while still type stays clean, with hard colour inversions on the beats. Use when someone asks for a rolling shutter or scanline glitch, torn or sliced type, a stutter or time-slice effect on text, or a glitchy kinetic headline.
---

# Shutter type

Two lines of type through a rolling shutter: whatever moves tears into bands, whatever is still stays whole. See it live at https://design.how/vault/shutter-type.

## What to build

Two phrases share a 600 by 337.5 scene, 16:9, scaled to the box as one unit, over a 68-frame loop at 25 frames a second, 2.72 seconds. "Design is thinking" jitters in, settles, the ground inverts from paper to sky blue, the line swells a little and lifts away. A hard cut, and a stack of "made visual" scrolls up one row per beat. The type is a grotesque at medium weight in two colours, paper #f6f3ea and sky #00afca, swapped whole on frames 10 to 28 and 54 to the end.

Every slice, ghost and torn edge comes from one post-effect. A fixed map of horizontal stripes, 14 to 60 scene pixels tall, gives each stripe a lag of up to 2.4 frames, quantised to five taps, and no two neighbours share a tap. The engine draws the clean scene five times a frame, once per tap, into offscreen canvases, then copies each stripe from the canvas of its own lag. Where nothing moves the taps agree and the copy is seamless; where a word moves the stripes disagree and it tears. A stripe's lag never reaches back past the start of its phrase, so the cut stays hard, and the ground is drawn once from the present, so the inversion lands as one slap.

The first phrase arrives by jitter, not by easing. For seven frames each word sits at a fresh height within about 15px of home, then takes one larger kick and decays home by 0.62 a frame, from a stepped table. The shutter sees only that jitter at rest scale. The push-in, 0.26 percent a frame about the line's centre, and the 97px lift from frame 22 on cubic-bezier(0.85, 0, 0.15, 1) move the finished, shuttered picture, so the line leaves whole.

The second phrase is stacked on a 126px pitch, and a scroll of exactly one pitch on cubic-bezier(0.8, 0, 0.2, 1) starts every 14 frames and lasts 12. A full pitch is invisible at rest, so the eye only ever sees the tearing mid-move, and "visual" trails "made" by 0.4 of a frame to split the two words on the fast frames. Ink boxes are measured from the live face off an offscreen raster, and each word is squeezed to its set width so the spacing holds whichever grotesque draws it.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/shutter-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/shutter-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build a fixed stripe map from a seeded walk down the scene: heights between STRIPE_MIN and STRIPE_MAX, each on one of STRIPE_TAPS lag taps, never the same tap as its neighbour.
- Each frame, draw the clean ink-only scene once per tap at frame f minus that tap's lag, clamped to the phrase's first frame, into its own offscreen canvas.
- Fill the ground from the present frame, then copy every stripe from its tap's canvas.
- For the first phrase, shutter the words at rest scale with only their jitter, then draw that layer scaled about the line's centre and lifted.
- Measure every word's ink box from the live face at boot and again when the face loads, and squeeze each word horizontally to its set width.
- Read the clock as elapsed / 40ms at a fractional frame every animation frame.
- Under reduced motion, draw frame 40 once: the stack at rest on paper.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PAPER` | #f6f3ea | One of the two colours, the ground for most of the loop. |
| `SKY` | #00afca | The other colour, the ground on the inverted beats. |
| `SKY_SPANS` | [[10, 28], [54, 67]] | The frames on which the colours invert. |
| `STRIPE_LAG_MAX` | 2.4 | The longest lag a stripe carries, in frames. Higher tears further. |
| `STRIPE_SEED` | 0x51ab7e | Seed for the stripe map. A new seed moves the cuts and leaves the choreography alone. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any grotesque works; the words are squeezed to their set widths. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
