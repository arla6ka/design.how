---
name: brick-reveal
description: Builds a WebGL reveal in which a square picture, restyled in turn as studded toy bricks, voxel blocks and a flat cartoon, melts back to the plain picture in rounded merging blocks along a soft, fading trail behind the pointer, with a virtual cursor that wanders when idle, a 3D tilt toward the cursor and a glow in each style's colour. Use when someone asks for a hover reveal, a before and after image wipe, a cursor trail mask, a pixel or brick reveal effect, a style-switch image card, or a ping-pong trail shader.
---

# Brick reveal

A picture restyled as toy bricks, voxels and a cartoon that peels back to the plain picture behind the pointer. See it live at https://design.how/vault/brick-reveal.

## What to build

A square tile floats in the middle of the card over a soft glow. On it is a mountain lake at sunset, but restyled, first as a mosaic of studded toy bricks, then as chunky voxel blocks, then as a flat cartoon with inked edges, each held for 2.8 seconds and crossfaded in 0.28. Wherever the pointer has just been, the style peels away in rounded blocks and the plain picture shows through, and the peeled patch heals over as the trail fades. With no pointer, a virtual cursor wanders over the upper middle on a few layered sines, so the card reveals itself on its own.

The trail is a 220 by 220 half-float texture in a ping-pong pair. Each frame it keeps the minimum of four diagonal neighbours a little way off, times a slow decay, so it shrinks evenly from its edges and stays one connected shape as it fades, and it paints a soft spot at the cursor whose edge is pushed around by 3D Perlin noise. The display pass snaps the trail to a 24 by 24 grid: a cell is on when its trail value passes one half, every on cell draws a rounded box slightly larger than the cell, and the boxes are joined with a smooth minimum, so neighbours fuse into one shape with rounded outer corners. A freshly lit cell overshoots its size for a moment, so blocks pop in. A thin bevel along the inside of the edge makes the revealed patch look pressed in.

Every picture is drawn in code. The plain one is a painted scene with a reflection, pines and film grain, and the three styles are made from that same canvas, so they line up with it exactly. The tile tilts up to about 7 degrees toward the pointer, 12 while the virtual cursor drives, and the glow behind it follows the cursor in the current style's colour.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/brick-reveal/`. It is React and TypeScript: `scene.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/brick-reveal` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Paint the plain picture on a 2D canvas, derive the three style canvases from it, and upload all four as textures.
- Keep the trail in a half-float ping-pong pair. Erode it with the minimum of four neighbours, decay it, and paint a noise-edged spot at the eased cursor.
- In the display pass, threshold the trail per cell of a 24 by 24 grid and union a rounded box per lit cell with a smooth minimum, antialiased with a fixed width.
- Mix the style crossfade and the plain picture by that mask, and add an inner bevel from the mask's gradient.
- Drive a virtual cursor from layered sines when the pointer is away, and report tilt and glow to the card each frame.
- Stop on webglcontextlost, and on destroy delete both programs, the buffer, every texture and both framebuffers and lose the context.
- Under reduced motion, draw the brick picture once with no trail and no tilt.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `STYLES` | bricks, blocks, toon | The styles in order, each with its maker and glow colour. |
| `STYLE_HOLD, STYLE_FADE` | 2.8, 0.28 | Seconds each style holds and crossfades. |
| `TRAIL_SIZE, TRAIL_SIZE_AUTO` | 0.13, 0.2 | The reveal radius under the pointer and under the virtual cursor. |
| `scene()` | a mountain lake at sunset | The plain picture. Draw any square scene, or load an image into the same canvas. |
