---
name: pixel-cycle
description: Builds a Canvas 2D pixelate transition that cycles through a set of images, each one resolving from big square blocks to sharp along an eased ramp of block sizes, held, dissolved back to blocks, then shrunk away leaning while the next grows in and resolves, with hover particles that lift blocks off the image. Use when someone asks for a pixelate or mosaic transition, an image that resolves from pixels, a character select screen, a pixelated slideshow, or a retro image reveal.
---

# Pixel cycle

One character at a time, breaking into big blocks and resolving sharp, then swapped for the next. See it live at https://design.how/vault/pixel-cycle.

## What to build

A small character stands in the middle of a short, wide card on faint pixel paper, a blue grid of 8 px lines with major lines every 32 px. Every couple of seconds it breaks into big square blocks, shrinks away upward while leaning, and the next one grows in from below, leaning the other way and straightening with a little overshoot, resolving from blocks to sharp as it arrives. The cast is five characters drawn in code with flat fills and a dark outline: a slime, a robot, a mushroom, a ghost and a cactus.

The pixelation needs no shader. The image is drawn shrunk into a tiny canvas, one texel per block, then drawn back up to full size with smoothing off, so the browser scales it into crisp squares. Resolving is a walk down a ramp of 24 block sizes from 120 px to 2 px, eased so the steps bunch at the fine end, where the eye reads smoothness; the ramp is scaled to the image box's width, so a small card starts at about 40 px blocks.

One cycle is a hold of 1.1 seconds, 0.35 seconds dissolving back to blocks, 0.2 seconds shrinking to 15 percent while sliding up 60 percent of the box and shearing by 0.18, then the next image growing back over 0.3 seconds while it resolves over 0.5. The whole cycle is a function of elapsed time, so a pause holds its place. On a fine pointer, the block under the pointer and one to three neighbours lift off as squares in the image's colour there and fade over about a second.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pixel-cycle/`. It is React and TypeScript: `params.ts`, `sprites.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 600, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/pixel-cycle` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build a block-size ramp that only gets finer, eased by t * (2 - t), and scale it by the image box's width.
- Each frame, draw the image into a canvas of ceil(width / block) by ceil(height / block) with smoothing off, then draw that back up over a block grid centred on the image.
- Drive the ramp index and the swap from one clock: resolve with a cubic ease-out, dissolve with a cubic ease-in, shrink away with a quadratic ease-in, grow in with a back ease-out.
- During a swap, scale and shear the image about its centre, and snap its slide to the block grid so the blocks stay aligned.
- On a fine pointer, read the colour of the block under it from the tiny canvas and spawn fading squares there and at a few neighbours.
- Under reduced motion, draw the first image sharp.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `sprites()` | five drawn characters | The images, in loop order. Any canvases or loaded images work. |
| `PIXEL_START, PIXEL_MIN, PIXEL_STEPS` | 120, 2, 24 | The coarsest and finest block, and how many steps between. |
| `HOLD` | 1.1 | Seconds each image stays sharp. |
| `IN_DURATION, OUT_DURATION` | 0.5, 0.35 | Seconds to resolve and to dissolve. |
| `SWAP_SCALE_MIN, SWAP_SKEW` | 0.15, 0.18 | How small and how far leaned an image is at the swap. |
