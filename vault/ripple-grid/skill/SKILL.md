---
name: ripple-grid
description: Builds a WebGL fragment-shader effect in which a grid of soft black blobs ripples out of a flat lattice into concentric rings, shears into a spiral and settles back, with the pointer parting the field. Use when someone asks for a metaball grid, a shader background, an organic generative pattern, a ripple or bloom effect, or a thresholded field in WebGL.
---

# Ripple grid

A lattice of soft blobs that blooms into rings, twists and settles back to a grid. See it live at https://design.how/vault/ripple-grid.

## What to build

A pale field holds a small rectangular lattice of soft black blobs, seven across and three down at rest. Over about eight seconds the lattice swells open, its rows bend into concentric rings, the rings shear into a slow spiral that leans off centre and thins to slivers at the edge, and then it all folds back into the plain grid. The grid it starts and ends on is the composition; the bloom is a visit away from it.

The whole picture is one scalar field, thresholded. Put a gaussian source at every lattice point, sum them, and paint ink wherever the sum clears a threshold. Merges, pinches and slivers all fall out of that one evaluation, with no per-blob state. The blobs come out a little out of round, fat on the axes and pinched on the diagonals, because axis neighbours sit closer than diagonal ones and bleed into each other. That shape is not drawn.

Nothing zooms. The lattice pitch stays fixed through the bloom; only a domain warp changes, made of a radial ripple, a twirl, a drift of the centre and a small wobble, each on its own slow rate so the loop never visibly repeats. A sum of gaussians over a rectangular grid factors into a sum over columns times a sum over rows, so the shader costs a handful of exp() calls per pixel, not one per source.

The pointer pushes the field away from itself and becomes the point the rings travel out from. Both ease in and out, so leaving the card heals the furrow instead of snapping it flat.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/ripple-grid/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/ripple-grid` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw one full-screen triangle and do all the work in the fragment shader.
- Evaluate the field as (sum over columns of a 1D gaussian) times (sum over rows), at a warped position, and threshold it with a soft edge from fwidth.
- Warp the position with a ripple, a twirl, a drift and a wobble, each driven by its own rate so the phases never line up.
- Ease the pointer's position and strength with an exponential approach, so the follow is the same at 60 and 120 Hz.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy delete the program and buffer and lose the context.
- Under reduced motion, draw the rest state once: the clean lattice at zero energy.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `INK` | #1b1b1b | The blob colour. |
| `PAPER` | #fcfcfc | The field colour. |
| `GRID_NX, GRID_NY` | 5, 3 | The grid's half-extent in sources, so the full grid is 11 by 7. How many are lit at rest and at full bloom is set by RX_REST, RX_OPEN, RY_REST and RY_OPEN. |
| `BLOOM_SEC` | 8 | Seconds from rest to full bloom and back. |
| `TWIRL_MAX` | 0.88 | How far the rings shear into a spiral. |
| `CURSOR_PUSH` | 0.045 | How hard the pointer parts the field. 0 turns it off. |
