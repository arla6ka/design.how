---
name: wild-type
description: Builds a warped-type loop on Canvas 2D, in which a word is traced at runtime from the live font into vector contours, types itself in on measured per-letter tracks, then inflates about eight times through one global Catmull-Rom warp mesh played from a fitted table, drapes over an arch and collapses exactly home, with a coloured registration slip under the white ink, film grain, an afterimage on the fast pulses and a pointer that bends the mesh. Use when someone asks for liquid or warped type, a mesh warp on text, letters that balloon and distort, a typewriter-in typewriter-out loop, or wild kinetic lettering.
---

# Wild type

A design word types itself in, goes wild through one warp field, collapses home and un-types. See it live at https://design.how/vault/wild-type.

## What to build

One word per loop, design, type, grid, color, motion, shape, pixel, layout, in a heavy grotesque leaned by a synthetic 0.2 oblique, white on black, spanning 34 percent of the card at rest. The loop is 104 ticks at 30 a second, about 3.5 seconds: two blank ticks, a typewriter in, the wild warp, a hold, and the typewriter out, after which the next word types in.

The letterforms are vector, traced at runtime. Each letter is rasterised alone at a 320px em, its alpha is run through marching squares at iso 0.5 with linear edge interpolation, the segments are stitched into rings, simplified by Douglas-Peucker at 0.45px, and holes are found by containment. The rings are normalised to the word box, so any word rides the same motion. Each contour point gets its 16 Catmull-Rom weights once per word; every frame the engine moves the points and refills a Path2D, never pixels, so edges stay crisp at any size, and magnified rings are drawn as curves through their points except at corners sharper than 48 degrees.

The typewriter in is stepped at 30 ticks a second: letters pop in at full size to the right of their slots, later letters further out, and the line eases left to rest on measured per-tick affine tracks about each letter's centroid, the last letter arriving over-rotated and righting itself. The out plays the same tracks backwards at 1.6 times, so the last letter peels away first. The warp is one global mesh of 9 by 4 control points over the rest word, read from a fitted table and played continuously between rows: it inflates the word about eight times through two zoom pulses, drapes it over an arch and collapses it exactly home, mirrored on alternate loops.

The slip is the word's accent colour drawn under the ink as the same warped path 1.6 ticks earlier, so it only peeks out where the mesh moves and hides under the white at rest. The ground glows up to 16 percent toward the accent with the stretch, the ink thins a little where the mesh stretches most, the previous frame lingers as an afterimage on the fast pulses, and a film grain tile at 6 percent sits over everything. During the warp the pointer pulls the nearest control points through spring-damped Gaussian nudges that relax to zero outside it.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/wild-type/`. It is React and TypeScript: `params.ts`, `motion.ts`, `trace.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-grotesk` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/wild-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Trace each word at runtime: rasterise each letter alone at TRACE_EM, run marching squares on its alpha, stitch, simplify by TRACE_TOL, drop specks under TRACE_MIN_AREA, and mark holes by containment.
- Normalise the rings to the rest word box and precompute each point's Catmull-Rom weights over the MESH_XS by MESH_YS control grid.
- Type in on the stepped TYPE_POSE tracks, mapped onto any word by position, and type out on the same tracks reversed at OUT_SPEED.
- During the warp, sample the MESH table continuously, add the pointer's spring offsets, move every contour point by its weights, and fill the rings as one path.
- Draw the accent copy LAG_TICKS earlier under the white, blend in the previous frame by mesh velocity, tint the ground by BG_GLOW, and screen a grain tile over the frame.
- Mirror the mesh in x on alternate loops and advance to the next word each loop.
- Under reduced motion, draw the first word at rest once, at the end of the warp.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | design, type, grid, color, motion, shape, pixel, layout | One word per loop. Four to six letters keeps the type size even. |
| `ACCENTS` | one colour per word | The slip ink for each word, in the same order. |
| `BG` | #000000 | The ground. |
| `INK` | #ffffff | The letters. |
| `OBLIQUE` | 0.2 | The synthetic slant, as a shear. |
| `REST_WIDTH_FRAC` | 0.34 | How much of the card width the word spans at rest. |
| `GRAIN_ALPHA` | 0.06 | Strength of the film grain. |
| `FONT_CSS` | var(--visual-grotesk), sans-serif | The font family. Any heavy grotesque works; the contours are traced from it. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
