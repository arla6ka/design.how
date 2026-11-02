---
name: tile-field
description: Builds a Canvas 2D wordmark sampled into a dense grid of tiny square tiles that rest small and grey, swell and turn blue where a slow interference wave passes, and light up under the pointer with a morphing brush and a fading trail. Use when someone asks for a tiled or pixel wordmark, a dot-matrix logo effect, text made of squares, a hover light over type, or a calm generative hero word.
---

# Tile field

A word made of tiny tiles, lit by a slow colour wave and a soft pointer light that leaves a wake. See it live at https://design.how/vault/tile-field.

## What to build

A single line of heavy sans type fills 92 percent of a wide, short card, built from tiles about a 460th of the card wide. At rest every tile is a small grey square, between a fifth and a third of its cell, and each one breathes a little on its own phase. Nothing outside the letters is drawn.

Colour comes from one field. Four slow sines, each drifting at its own rate and angle, are summed at every tile, and the sum passed through a smoothstep sets how much that tile has woken up. A woken tile grows toward 90 percent of its cell and takes a navy blue whose hue swings a few degrees with the field, so the wave reads as a soft front moving through the word, not a sweep.

The pointer is a second source. Tiles near the segment from the last pointer position to this one light toward the target fast and fade back slowly, so a move leaves a wake. The brush is not round: its reach wobbles with the angle and with time, so it has turning, breathing lobes, and it grows with pointer speed. About a fifth of the tiles are sparks that wander slightly and carry a soft halo when lit.

A frame is cheap because tiles are bucketed. Hue is quantised to 24 steps and alpha to 6, every tile goes into the Path2D of its bucket, and the whole field draws in a few dozen fills.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/tile-field/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 420, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/tile-field` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word once per resize into an offscreen canvas and keep a tile at every cell centre whose alpha is over half.
- Each frame, sum four drifting sines at the tile's position and smoothstep the sum into a 0 to 1 wake value.
- Light tiles near the pointer's last segment with a lobed reach, easing up fast and down slowly, and take the larger of the two values.
- Size each tile from its wake, add it to a grey path, and add woken ones to a path bucketed by quantised hue and alpha.
- Fill the grey path, then the buckets, then the pointer-lit tiles on top.
- Scale the per-frame rates by the real frame time, so the wave and the wake run the same at 60 and 120 Hz.
- Under reduced motion, draw the wave once at a fixed time with no pointer.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | "made of tiles" | The word. Any short line; it is fitted to the card width. |
| `CELLS_ACROSS` | 460 | Tile density. Lower makes bigger, chunkier tiles. |
| `HUE, HUE_SWING` | 263, 16 | The wave's hue and how far it drifts. |
| `REST` | oklch(0.64 0.006 263) | The grey of a resting tile. |
| `SPEED` | 0.02 | How fast the wave moves. |
| `FADE_RATE` | 0.02 | How long the pointer's wake lingers. Lower is longer. |
