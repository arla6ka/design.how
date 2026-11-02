---
name: eclipse-grid
description: Builds a grid of eighty eclipses on Canvas 2D, each an opaque outlined ring over a solid disc that part along the diagonal to uncover a crescent and close again on its own phase, held at 25 frames a second, with a pointer that acts as a lamp, tilting every crescent away from it and easing nearby cells open. Use when someone asks for an eclipse or crescent pattern, a grid of circles that open and close, a hover-reactive dot field, or a print-like stepped loop.
---

# Eclipse grid

Eighty rings sliding off the discs they hide, each on its own beat; the pointer is the lamp. See it live at https://design.how/vault/eclipse-grid.

## What to build

Eighty cells, ten across and eight down, on an 800 by 600 scene, 4:3, scaled to the box as one unit. Each cell is two shapes: a solid amber disc of radius 22, and over it an opaque disc in the field colour with a 2px amber stroke at radius 21.5. When the two are concentric the stroke hides the disc's edge and you see an empty ring. The top disc is opaque, and that is the whole trick: a closed cell is a full eclipse, and nothing is clipped or composited.

The shapes part along the 45 degree diagonal until they sit 11px apart on each axis. The ring takes 7 of those pixels up and to the left and the disc 4 down and to the right, so the ring is what moves and the disc seems uncovered rather than arriving. The beat is 56 frames at 25 a second, 2.24 seconds: closed for 20, opening over 11, open for 14, closing over 11, both moves on cubic-bezier(0.37, 0, 0.63, 1). Every cell starts its beat at its own frame from a table spread across the whole cycle with no spatial order, so about half the field is open at once and it never reads as a wave.

Columns sit at 62 + 74.6 i and rows at 60.5 + 68.1 j. The beat is read at whole 40ms frames and the canvas repaints only when the frame changes, so the field keeps a stepped, printed cadence.

The pointer is a lamp, and a crescent is a shadow. While it is over the card, every cell's split leans 55 percent of the way from the diagonal toward the line from the pointer through the cell, and cells nearby are pushed up to half open by a Gaussian of radius 200. The lamp runs on its own smooth clock: its presence eases with a 140ms time constant and its position with 90ms, repainting every animation frame while it is present, so hovering glides while the beat underneath stays stepped.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/eclipse-grid/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 4 / 3, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/eclipse-grid` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Per cell, fill the disc in the ink, then fill an opaque disc in the ground out to the ring's outer edge, then stroke the ring in the ink.
- Open a cell by sliding the ring up-left and the disc down-right along the split direction, 7 to 4, to a total of 11px per axis.
- Drive each cell with a 56-frame beat (closed 20, open over 11, hold 14, close over 11) on cubic-bezier(0.37, 0, 0.63, 1), offset by its own start frame from the PHASE table.
- Read the beat at floor(elapsed / 40ms) and repaint only when the frame changes or the lamp is live.
- For the lamp, lean the split toward the away-from-pointer direction by presence times LIGHT.steer, and take the larger of the beat's openness and presence times LIGHT.push times a Gaussian of distance.
- Ease the lamp's presence and position exponentially in real time, every animation frame.
- Under reduced motion, draw frame 0 once with no lamp.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `GROUND` | #101012 | The field colour, and the fill of every ring. |
| `INK` | #ffb000 | The discs and the ring strokes. |
| `PHASE` | an 8 by 10 table of start frames | Each cell's offset into the beat. A new table is a new field. |
| `SEPARATION` | 11 | How far apart the shapes get per axis, fully open. |
| `RING_SHARE` | 7 / 11 | How much of the travel the ring takes; the disc takes the rest. |
| `LIGHT` | {radius: 200, steer: 0.55, push: 0.5, presenceMs: 140, followMs: 90} | The lamp: its reach, how far it turns the split, how far it opens a cell, and its easing. |
