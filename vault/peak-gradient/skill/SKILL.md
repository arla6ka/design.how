---
name: peak-gradient
description: Builds an SVG glow made of a row of tall, heavily blurred columns that share one vertical rainbow gradient, arranged in a symmetric curve, tallest in the centre, fading to transparent at the top, and rising from the bottom edge with a scaleY transition. Use when someone asks for a rainbow glow, an aurora footer, a gradient that rises from the bottom of the screen, a soft blurred colour backdrop, or a hero glow behind a call to action.
---

# Peak gradient

A soft rainbow glow of blurred columns that rises from the floor, tallest in the middle. See it live at https://design.how/vault/peak-gradient.

## What to build

At the bottom of a white card sits a soft glow: dark at the floor, then blue, steel, near-white, yellow, red-orange and magenta, fading to nothing at the top. Its outline is a gentle mountain, highest in the middle and lower toward both sides, and it grows up from the floor over 1.1 seconds whenever the card comes into view.

It is far simpler than it looks: nine tall rectangles in one SVG, all filled with the same vertical gradient and each blurred with a gaussian of 15 view-box units in a 1271 by 599 box. The gradient is in each rectangle's own bounding box, so every column carries the full rainbow over its own height, and the columns are 1.23 times their pitch so they overlap and the blur melts them into one surface. The last stop is transparent, so the tallest column dissolves before its edge would show.

The heights follow a power falloff, not a cosine bell: the centre is 98 percent of the box and the edges 55 percent of that, with height falling as one minus the distance from the centre to the power 1.24, which gives the flatter, pyramid-like rise. The rise is a transform alone, scaleY from 0 to 1 about the bottom edge with a gliding ease-out, so it costs nothing per frame.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/peak-gradient/`. It is React and TypeScript: `params.ts`, `gradient.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/peak-gradient` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw BARS rectangles side by side in a 1271 by 599 view box with preserveAspectRatio none, each 1.23 columns wide.
- Set each height from the centre out as PEAK times the box height times (VALLEY + (1 - VALLEY)(1 - t^1.24)), and stand it on the bottom edge.
- Fill every bar with one vertical linearGradient in objectBoundingBox units, bottom to top through STOPS, ending transparent.
- Wrap each bar in a group with a feGaussianBlur of BLUR.
- Rise the whole field with transform-origin bottom and a scaleY(0) to scaleY(1) transition over RISE_MS, started two frames after the collapsed state paints.
- Under reduced motion, show the field risen and never transition.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `STOPS` | ember, blue, steel, near-white, yellow, red-orange, magenta, transparent | The rainbow every column carries, bottom to top. |
| `PALETTES` | seven rainbows | Alternative stops for the same shape. |
| `BARS` | 9 | How many columns. |
| `BLUR` | 15 | The blur in view-box units. |
| `PEAK` | 0.98 | The centre column's height as a share of the box. |
| `VALLEY` | 0.55 | The edge columns' height as a share of the centre's. |
| `RISE_MS` | 1100 | How long the rise from the floor takes. |
| `GROUND` | #ffffff | The card colour. |
