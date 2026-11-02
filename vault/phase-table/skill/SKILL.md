---
name: phase-table
description: Builds a Canvas 2D table of closed Lissajous curves, four rows by six columns, where the row sets the horizontal frequency and the column the vertical one, every curve shaded as metal wire from its exact normal and swept by one shared phase, with the pointer moving the light. Use when someone asks for a Lissajous grid, a harmonic or frequency table, a mathematical curve animation, generative line art, a metallic line effect or a looping figure-eight pattern.
---

# Phase table

A four by six table of closed harmonic curves, lit as steel wire, breathing on one shared phase. See it live at https://design.how/vault/phase-table.

## What to build

A near-black field holds a table of 24 cells, four rows by six columns, and each cell is one closed curve. The curve is x = sin(fx t + phase), y = cos(fy t), with fx = row + 1 and fy = column + 1. So the diagonal, where the two frequencies agree, is a column of circles, and every cell off it gains lobes, from arches and figure-eights to dense woven lattices in the far corner. t runs to 2 pi / gcd(fx, fy), because past that the curve only retraces itself.

One phase drives the whole table. It turns once every 2.88 seconds and enters only the x argument, so y never moves. A warp, phase - 0.55 * 0.5 * sin(2 phase), makes the sweep linger on the open frames and hurry through the collapse to a flat line. Each cell adds a lag of (row - column) * 0.22 radians, which is zero on the diagonal, so the circles stay circles while a wave crosses the table perpendicular to them.

The wire is lit as metal with no lights at all. The tangent of each curve is known in closed form, so the normal is exact at every sample, and it indexes a five-stop matcap ramp with a hard dark-to-bright horizon. A glint across the grain pushes a segment further up the ramp. Cells far from the diagonal draw thinner and darker, so the diagonal reads as a ridge.

Canvas cannot stroke a gradient along a path, so every segment is sorted into one of 32 colour buckets and each bucket is stroked once per cell. That keeps the draw near a few hundred strokes a frame at 90 samples per unit of fx + fy. The pointer turns the light axis by up to 0.22 of a turn, eased against real time.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/phase-table/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 896, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/phase-table` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Lay the grid out from one pitch: curve radius 35.6/96 of it, stroke 2.15/96 of it, never under one CSS pixel.
- For each cell, bake sin(fx t) and cos(fy t) once at PTS_PER_FREQ * (fx + fy) samples over 2 pi / gcd(fx, fy).
- Each frame, advance one phase by dt / PERIOD_MS turns, warp it with DETENT, add (row - col) * CELL_LAG per cell, and rotate the baked x terms by it.
- Shade each segment from its exact normal against the light axis through the matcap ramp, quantise to SHADE_BUCKETS, and stroke each bucket once.
- Ease the light angle toward the pointer with 1 - exp(-dt / POINTER_EASE), so it settles in the same time at any refresh rate.
- Under reduced motion, draw phase zero once: circles down the diagonal.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `COLS, ROWS` | 6, 4 | The table's size. The diagonal needs at least three rows to read. |
| `PERIOD_MS` | 2880 | One full turn of the shared phase. Larger is calmer. |
| `DETENT` | 0.55 | How long the sweep lingers on the open frames. Keep it under 1. |
| `CELL_LAG` | 0.22 | Radians of lag per step across the diagonal. 0 makes the table pulse as one block. |
| `METALS` | steel, gold, copper, oil | The matcap ramps. The first one renders; each has five stops, a glint colour and a ground. |
| `POINTER_TURN` | 0.22 | How far the pointer turns the light, in turns. |
