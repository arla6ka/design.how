---
name: datamosh
description: Builds a Canvas 2D datamosh loop in which fixed columns of flat saturated colour fall forever, each tile stretching open through the centre of the frame and squeezing to a sliver at the edges, staggered into a zig-zag. Use when someone asks for a glitch effect, a corrupted video look, a datamosh, a pixel-sorting style background, or a loud generative colour field.
---

# Datamosh

Columns of saturated colour that fall, snap open through the middle and squeeze shut, like a broken video decode. See it live at https://design.how/vault/datamosh.

## What to build

Eleven columns of flat colour fill a wide card. Each column is a stack of fifteen tiles falling down the frame forever, and a tile changes height as it goes: a sliver at the top, about half the card tall as it crosses the centre, a sliver again at the bottom. The columns start a few milliseconds apart from the right, and each one is offset 0.4 of a tile from its neighbour, so the stacks interlock into a zig-zag that rides higher to the right.

One curve does all of it. A tile boundary that has travelled k tiles sits at a sigmoid of k over the tile count, with a sharpness of 8.5. The sigmoid is flat at both ends and steep in the middle, and steepness is height, so the stretch is not animated at all; it is the shape of the curve. The tile count is odd, so one tile owns the whole bulge. Past both ends the curve continues as a shallow line instead of a clamp, so tiles leaving the frame keep tapering instead of stacking on the edge.

The columns never move sideways. Their edges are fixed on a power curve (exponent 1.65), narrow on the left and wide on the right, so the grid reads as receding perspective. Each tile step lasts 0.2 seconds and is sprung, fast in, a hang through the middle, fast out, and the travel is unbounded so there is no seam where a loop would wrap.

Every column reads one shared, rolled strip of 61 colours, offset by its index. A colour therefore spans the card as one leaning band instead of confetti. The strip is rolled from a seed at mount: about a quarter white, about a sixth near-black, the rest hues, never the same colour twice in a row.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/datamosh/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/datamosh` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Fix the column edges once per resize at width times (i / COLS) ^ POWER; never move them.
- For each column, take elapsed time minus its stagger, divide by CYCLE, add i times COL_PHASE, and spring only the fractional part of the step.
- Place each tile boundary at a sigmoid of (id + flow) / TILES, extended linearly past 0 and 1, and draw the tiles bottom up with a small bleed so they lap.
- Colour each tile by its identity, strip[id - column], never by its position on screen.
- Roll the strip from a seed with a prime length coprime with COLS and TILES, and break up any two equal neighbours.
- Under reduced motion, draw one frame at 0.45 of a step with every column swept in.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PALETTE` | white, two near-blacks, eight saturated hues | The colours. Keep white and a dark in it for contrast. |
| `COLS, POWER` | 11, 1.65 | How many columns, and how hard their widths recede. |
| `TILES` | 15 | Tiles per column. Keep it odd; move STRETCH with it. |
| `CYCLE` | 0.2 | Seconds per tile step, so the fall speed. |
| `STRETCH` | 8.5 | How tall the centre tile opens against the shoulders. |
| `SPRING_K` | 1.6 | How long a tile hangs at the middle of its step. Tune against CYCLE. |
| `COL_PHASE` | -0.4 | Offset between columns, in tiles. Sets the zig-zag. |
