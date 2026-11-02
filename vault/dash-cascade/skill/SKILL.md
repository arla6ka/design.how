---
name: dash-cascade
description: Builds scanline lettering on Canvas 2D, in which three-letter words are drawn as rows of fat round-capped dashes that all scale about one vertical axis, so the resting state is a dotted line and every dash plays the same excursion waveform shifted by a per-letter delay law, the first letter wiping top-down, the last bottom-up and the middle pinched between them, stepped at ten frames a second in a slowly turning yellow hue field. Use when someone asks for scanline or striped type, letters that unfold from a line, a dashed or barcode-like logo animation, or a stepped retro type loop.
---

# Dash cascade

Three-letter words built from fat scanline dashes, unfurling out of a dotted line and folding back. See it live at https://design.how/vault/dash-cascade.

## What to build

Words of three letters, LOL, ART, TRY and TOY, one per loop, are built from fat horizontal dashes on ten fixed rows, on a 600 by 337 reference frame scaled to the card and centred. Every dash is a round-capped capsule 18 units tall, so a dash of zero length is a dot, and every dash scales both its ends about one vertical axis at x 281.5. At rest all of them sit on that axis as dots: the dotted line is the whole word parked, and nothing is hidden or swapped.

The choreography is delays, not motion. Every dash plays one 25-entry excursion waveform, a rise over about six frames, a plateau of five at full width, a symmetric fall and a rest, shifted in time by a law per letter. The first letter wipes top-down, its delay rising 0.58 frames a row; the last wipes bottom-up at 0.42 a row; the middle letter is pinched, each of its dashes leaving on whichever neighbour's wave reaches it first. The twisted, almost three-dimensional shear mid-flight is nothing but those delays interfering.

The loop is 25 frames at 10 a second, 2.5 seconds, and the engine redraws only when the frame index changes, so the mid-flight strobe stays. The word changes on frame 0, the one frame where every dash is under 1 percent of full width, so the next word simply unfurls out of the same line of dots. The letters are hand-built from horizontal runs on three zones of the grid, with converging strokes merged into one dash so no join doubles its ink.

The ink is not one yellow. Each dash samples a hue from three cosine waves at different angles, frequencies and drift speeds, weighted 0.5, 0.32 and 0.18, spreading 14 degrees of hue and a little lightness across the card and drifting over a minute, drawn as seven overlapping segments along each dash. Hovering lifts the saturation and speeds the drift, eased over half a second, and repaints at the screen's rate while the colour moves.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/dash-cascade/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/dash-cascade` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Lay each word out as runs [x0, x1, letter] on ROW_Y rows; draw every run as a round-capped capsule of height DASH_H scaled about the AXIS column by its excursion.
- Give every dash a delay from its letter's law: top-down for letter 0, bottom-up for letter 2, the minimum of both for letter 1.
- Read the shared WAVE at (frame - delay + WAVE_LEAD) mod 25 for each dash's excursion.
- Tick the frame at FPS and redraw only when it changes or the hover colour is moving; swap the word on frame 0.
- Colour each dash from the summed HUE_WAVES field around INK, over HUE_LAYERS segments along its length, on a real-time drift clock.
- Under reduced motion, draw frame 13 once: the word at full width.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | LOL, ART, TRY, TOY as dash runs | The words. Each must use the same ten rows and three letter zones. |
| `INK` | #f2c94c | The base yellow the hue field turns around. |
| `BG` | #ffffff | The field. |
| `HUE_SPREAD_DEG` | 14 | Total hue travel across the field, peak to peak. |
| `HUE_DRIFT_S` | 60 | Seconds for the base wave to drift one cycle. |
| `FPS` | 10 | The stepped frame rate of the cascade. |
