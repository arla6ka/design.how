---
name: dot-globe
description: Builds a Canvas 2D row of three superquadric solids, each tiled with an 11 by 11 grid of rounded squares drawn as projected quads so they crowd, shrink and lean toward the edge, rocking in unison with a bitmap symbol painted onto the tiles that swaps as a wave and passes from globe to globe, with a rare full turn and a pointer that leans the row and opens the tiles. Use when someone asks for a tiled globe or sphere, a dot matrix on a 3D surface, a rotating icon grid, pixel symbols on a ball, or a row of 3D tile forms.
---

# Dot globe

Three rounded-cube solids tiled with rounded squares, rocking together, a bright symbol painted on them and handed along the row. See it live at https://design.how/vault/dot-globe.

## What to build

Three solids sit in a row on one quiet grey, each 0.3 of the card's height in radius and each tiled with an 11 by 11 grid of rounded squares. The unlit tiles carry each solid's colour, a muted aubergine, petrol teal or cobalt, and a symbol is painted on top in a bright near-complement, lime, coral or acid yellow. The symbols are 11 by 11 bitmaps (an arrow, a diamond, a cross, a chevron, a slash, a square), painted in grid space, so a lit tile stays lit as the surface turns.

The tiles are projected quads, not scaled and rotated squares. A patch spanning a range of longitude and latitude projects to a trapezoid whose two ends differ in width, and that is what the eye reads as the corner tiles leaning. Drawing each tile by projecting its four corners and joining them gives crowding toward the edges, foreshortening to about half size at the limb and the lean, all from the same trigonometry. The grid spans 68.2 degrees either side of centre, solved from the width of the corner tiles as a difference of two sines rather than a cosine.

The solids are superquadrics, not spheres, with exponents 0.42, 0.66 and 0.95, so one is nearly a cube, one clearly rounded and one almost spherical. They rock together by up to 14 degrees, slow enough that a there-and-back takes about nine seconds and never far enough to hide a column. The mark is what moves along the row: each symbol holds 4.2 seconds, then swaps as a 1.1-second wave crossing the surface, and each globe starts 0.35 of a swap after the one to its left, so the change passes from left to right with a brief trail of colour. About every 26 seconds one globe turns all the way round in 2.6 seconds and comes back carrying the next mark.

A fine pointer tilts the row vertically by up to 0.42 radians and turns each globe toward it by 2.5 degrees, both eased so the globes feel heavy. Tiles within 0.3 of the height swell a little and slide apart by 0.035 of a cell, lit and unlit alike, so the mesh gives under the cursor without the symbol peeling off.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/dot-globe/`. It is React and TypeScript: `params.ts`, `glyphs.ts`, `sphere.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/dot-globe` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- For each globe, project the four corners of every grid patch through the superquadric and join them into a rounded quad; cull tiles past 90 degrees of longitude.
- Rotate by the shared rock, the pointer tilt and the pointer lean before projecting; keep rock plus lean inside the 21.8 degrees the grid leaves.
- Light a tile from the current symbol's bitmap at its (col, row), never from its screen position.
- Swap symbols as a wave across the surface over SWAP_S, each globe offset by SWAP_S * HANDOFF, with a short trail on unlit tiles quantised to TRAIL_BANDS.
- Every TURN_EVERY_S seconds, give one globe in turn a full rotation over TURN_S that lands on the next mark.
- Swell and push tiles near the pointer by fractions of a cell, so the effect holds at any size.
- Under reduced motion, draw the row at clock zero with no pointer, once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `DUOS` | lime on aubergine, coral on petrol, yellow on cobalt | Each globe's unlit tones, its mark and its hover tone. |
| `GROUND` | #f4f4f4 | The shared ground. |
| `EXPS` | 0.42, 0.66, 0.95 | How boxy each solid is. Keep them above about 0.4. |
| `WOBBLE` | 14 degrees | How far the row rocks. |
| `HOLD_S, SWAP_S` | 4.2, 1.1 | Seconds each symbol holds and each swap takes. |
| `HANDOFF` | 0.35 | How far behind its left neighbour each globe swaps, as a fraction of a swap. |
| `TURN_EVERY_S` | 26 | Seconds between full turns. |
| `GAP, ROUND` | 0.26, 0.3 | Gap between tiles and their corner radius, as fractions of a cell and a tile. |
