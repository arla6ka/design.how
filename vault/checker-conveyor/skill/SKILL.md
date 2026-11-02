---
name: checker-conveyor
description: Builds a Canvas 2D checkerboard in which three flat scenes replace each other by conveyor, each of nine rows sliding one full screen width on a measured whip curve a beat after the row above, so the next scene rides in from the edge seam and all, with palettes that crossfade only while the board is at rest. Use when someone asks for a checkerboard animation, a tile or pixel transition, a staggered row wipe, a conveyor or flag-wave effect, or a looping geometric background.
---

# Checker conveyor

Nine rows of checker cells whip sideways one after another, and each pulse carries in the next scene. See it live at https://design.how/vault/checker-conveyor.

## What to build

The card is a checkerboard nine rows tall, with the cell size set by the height, and a rectangle of checker cells twelve wide across rows 2 to 6, centred. There are three scenes. The first is the ground alone, the second fills the rectangle with two new colours over the same ground, and the third swaps every colour at once. The loop goes first, second, third and back.

A scene never fades in. During a pulse each row is a strip of [this scene's row][next scene's row] laid end to end, and the row slides by exactly the visible width, so the next scene arrives from the edge with its seam showing. Where the two scenes meet, two lights or two darks can touch. That break is kept: scenes are absolute patterns, not state carried across.

The motion is measured. Every row follows one whip curve, a 26-entry table of normalised displacement with about a quarter of the travel in the windup, then half the distance in a few frames, then a long settle. It is read through a monotone cubic so the cliff in the middle never overshoots its landing cell. Each row starts from its own fitted frame, about 3.6 frames at 30 fps after the row above, with the source's jitter kept, and the three pulses take 51, 50 and 42 frames.

Two scalings make it fit a scrolling page. The rests between pulses are cut to 0.42 of their length and the pulses play 1.45 times faster, through a piecewise-linear map from clock time to measured time. Palettes cycle every 2.2 seconds, but only at a rest, when no row is moving, and every tile crossfades in place over 0.34 seconds. Some palettes run right, fire bottom to top, or split odd rows against even ones.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/checker-conveyor/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/checker-conveyor` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the cell as the canvas height over ROWS, and cover the width in whole cells; centre the rectangle on the fractional width.
- For each row, find which pulse it is in from its fitted start frame, and its progress k through that pulse.
- Ease k through the whip table with monotone cubic tangents, and offset the row by eased k times the visible width.
- Fill the row as [current scene][next scene] end to end, rounding every edge to a device pixel so neighbours share boundaries.
- Map clock time to measured time with rests scaled by DWELL_SCALE and pulses by PULSE_RATE, so the loop stays seamless.
- Swap palettes only when every row is at rest, and crossfade each tile in place over FADE_SECONDS.
- Under reduced motion, pin the first palette, stop cycling and draw the second scene at rest once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PALETTES` | primary, duplex, plaster, monochrome, acid, dusk | Colour worlds of exactly three scenes each, with a direction (left, right or split) and an optional bottom-up cascade. |
| `PALETTE_SECONDS` | 2.2 | How long a palette holds before the next rest swaps it. |
| `DWELL_SCALE` | 0.42 | How much of each rest to keep. 1 is the measured original. |
| `PULSE_RATE` | 1.45 | How much faster the pulses play than measured. 1 is the original. |
| `FADE_SECONDS` | 0.34 | The palette crossfade. Keep it shorter than the shortest rest. |
| `RECT_COLS, RECT_ROW_START, RECT_ROW_END` | 12, 2, 6 | The centred rectangle's width and rows. |
