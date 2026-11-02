---
name: reality-split
description: Builds a Canvas 2D design-tool animation in which a selected word splits into letter objects with their own handles, scatters across the card, dives into the first letter and steps through the rest at large scale on a spring conveyor, collapses to a dot and pops back whole, then replays as a new word, palette, box shape and handle style. Use when someone asks for a design tool or canvas editor animation, selection handles, letters splitting into objects, an exploding word, a typographic inspector effect, or a looping editor-style hero.
---

# Reality split

A selected word splits into letter objects, scatters, is inspected letter by letter at huge scale, and pops back whole. See it live at https://design.how/vault/reality-split.

## What to build

A word sits selected on a flat field: white bold grotesque type on a solid box, with four handles on its corners. Then it acts like an editor that has started thinking for itself. At 0.36 seconds seams open between the letters and each becomes its own object with its own handles. At 0.64 they leave the row and scatter, then drift outward. At 1.92 the view dives into the first letter while the rest blur and fade, and from 3.36 the letters take turns sliding through the centre at large scale, like someone stepping through objects in an inspector. Finally everything collapses to a dot and the word pops back whole.

It works on any word. The cells come from prefix advances so the seams land exactly between glyphs, and each letter's box is fitted to its real ink bounds from measureText, so a wide capital never hangs out of its own selection. The scatter puts the first letter at the centre and the rest on a golden-angle spiral from 0.26 to 0.46 of the height, then relaxes overlapping boxes apart over 60 passes. The six measured seam gaps repeat for longer words, and the loop stretches so every letter gets its turn: the inspection never races.

Every move shares one motion language: a lazy wind-up, a violent middle, a long soft landing, and no rotation anywhere. Each phase ships its own measured control points, played through a monotone cubic spline. In the inspection each letter enters from the right on a damped spring that overshoots the centre by 0.02 of the width and rings down, holds at least 0.09 seconds, and leaves to the left. Only the focused object carries handles.

Each pass is a different world: a new word, a new four-colour palette (field, box, handles, ink), a new box shape (rectangle, rounded, ellipse or superellipse, inflated so the glyph stays inside) and a new handle mark. The change happens only at the dot, the one frame where every palette looks alike, with the field crossfading as the next word grows out of it.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/reality-split/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/reality-split` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure the word at FONT_SIZE times the height: cells from prefix advances, letter boxes from each glyph's ink bounds plus FIT_PAD.
- Run one timeline in seconds: split, spread, scatter, drift, dive, inspect, pop, hold. Stretch only the inspection to fit the word.
- Play every move through its own measured control points with a monotone cubic spline; never substitute a closed-form ease.
- Lay the scatter on a golden-angle spiral around the first letter and push overlapping boxes apart, the centre letter pinned.
- In the inspection, slide each letter in from the right on a damped spring, hold it, and slide it out to the left; draw handles on the focused object only.
- Swap word, palette, shape and handle only at the dot, crossfading the field while the next word grows.
- Under reduced motion, draw time 0 once: the first word whole and selected.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `VARIANTS` | six words, from Animation to Canvas | The passes in order, each a word, a palette, a box shape, a handle mark and a scatter seed. |
| `PALETTES` | volt, mint, ultramarine, terminal, press, studio and more | Four flat colours each: field, box, handles and ink. Keep the handles clear of both field and box. |
| `FONT_FAMILY` | sans-serif | The family, drawn at 700. Any bold grotesque works; the boxes are measured from it. |
| `SCATTER_SPREAD` | 0.5 | How far the scatter stretches into a wide card. 0 keeps a square constellation. |
| `TRAIN_DWELL_MIN` | 0.09 | Seconds each inspected letter sits still at the centre. |
| `SPRING_AMP, SPRING_FREQ, SPRING_DAMP` | 0.02, 8.5, 5 | The inspection's landing: overshoot, ring and decay. |
| `CYCLE_VARIANTS` | true | False plays the first variant forever. |
