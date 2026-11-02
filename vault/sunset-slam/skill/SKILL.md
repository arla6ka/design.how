---
name: sunset-slam
description: Builds a Canvas 2D retro logo slam in which a blocky slab word breathes, squashes to a third of its width, then slams forward into an extruded logo whose fan of copies converges to a vanishing point below the baseline and is coloured by a moving window over one fixed dawn ramp, cools to a sticker, holds and unwinds into a seamless loop. Use when someone asks for a retro logo animation, an extruded or 3D text slam, a long-shadow or vanishing-point extrusion, an eighties title card, or a gradient fan behind a word.
---

# Sunset slam

A word squashes, slams forward into an extruded retro logo trailing a fan of dawn colour, cools to a sticker and unwinds. See it live at https://design.how/vault/sunset-slam.

## What to build

A dark pre-dawn sky, and the word sunset in an original blocky slab face, drawn as rectangles on one grid: 40-unit stems, 24-unit horizontals, x-height letters 100 units tall. The word breathes wider, squashes to about a third of its width, ignites for one flickering frame, then slams forward to 952 reference pixels wide trailing a fan of colour, eases back, cools to a resting sticker at 637 wide and holds. An outro then retracts the fan and walks the word back to exactly its first frame, so the loop has no cut.

The motion is a measurement. The word box's width, its vertical centre and the fan's depth are per-frame tables over 89 frames at 25 fps, in pixels of a 1500 by 1000 reference, mapped onto the card with the peak frame's middle pinned to the card's middle. The slop a hand-made curve would never have, a one-frame flicker and a settle that overshoots, comes with the data. A one-frame collapse in the source is bridged over five frames, and the outro adds eleven.

The fan converges. It is not a long shadow spreading from a light above. Every copy of the word shrinks and slides toward a vanishing point 2.17 word heights below the baseline at the word's centre, like a floor receding under it, and the flat bottom of the fan is the baseline's image at the deepest copy. The swept shape is the word dilated by 8.4% of its height, drawn as a fill plus a fat mitred stroke of the same path, which is why the resting logo wears an outline all round: that outline is copy zero.

The gradient never changes, only its window moves. One thirteen-stop dawn ramp, navy through violet and rose to gold, is mapped onto fan depth through a fitted offset and span per frame. At ignition the hot end sits at the face, the slam inverts the window so gold is at the face, and then the heat drains down the fan until only the deep end is left. Bloom layers behind the word fade with it. Hovering with a mouse warms the window and the bloom without moving anything.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/sunset-slam/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/sunset-slam` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build the word once as a Path2D of rectangles on its unit grid; dilate it by OUTLINE times its height with a fill and a mitred stroke.
- Read the word box width, centre and fan depth from the per-frame tables at a fractional frame, and map reference pixels onto the card.
- Draw the fan as copies of the dilated word, each scaled and slid toward a vanishing point VP_DEPTH word heights below the baseline, deepest first.
- Colour each copy by its depth through the fitted window (offset and span) over the fixed RAMP; never edit the ramp per frame.
- Bridge the source's one-frame cut over SETTLE_BRIDGE frames, and append OUTRO frames that decay everything back to frame 0.
- Ease the hover warmth in and out against real time, colour only.
- Under reduced motion, draw frame 60 once: the settled sticker.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `RAMP` | thirteen stops, navy to pale gold | The dawn gradient the window slides over. |
| `BG_TOP, BG_BOTTOM` | #080b16, #171a33 | The sky. |
| `RECTS` | the word sunset on the slab grid | The letterforms. Any word drawn on the same grid inherits the measured anatomy. |
| `BLOOM_LAYERS, BLOOM_ALPHA` | four layers, 0.26 | The glow behind the word. |
| `HOVER_WARM, HOVER_BLOOM` | 0.075, 1.35 | How far a hover warms the window and lifts the bloom. |
| `OUTRO` | 11 | Frames the unwind takes before the loop closes. |
