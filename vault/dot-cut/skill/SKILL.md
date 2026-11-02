---
name: dot-cut
description: Builds a Canvas 2D field of touching circles, 42 across on a square lattice, in which a letter or a procedural pattern appears by removing circles so the background shows through, each scene arriving by its own wipe, ripple, scatter, collapse or column sweep, cells hollowing into rings, the whole field filled as one even-odd path. Use when someone asks for a dot grid, a halftone or circle mesh, negative-space or knockout typography, a dot matrix transition, a pattern of circles that morphs, or a grid that you can rub away with the cursor.
---

# Dot cut

A dense grid of touching circles with a letter or a pattern cut out of it as negative space. See it live at https://design.how/vault/dot-cut.

## What to build

A grid of circles 42 across, each exactly one pitch wide, so neighbours touch and the little concave diamonds between every four of them are the texture. Pull them apart even slightly and the field stops reading as one surface and turns into polka dots. The grid is inset: the pitch comes from the width with a 0.75 pitch margin on each side, then only whole rows are fitted into the height and centred, so no circle is ever cut by the frame.

Nothing is drawn on top. A symbol is a hole: where the glyph covers a cell, that circle is removed and the flat background shows through. Scenes are rasterised on a small canvas at grid resolution and read back as one flag per cell, so any glyph a font can draw works, and procedural scenes (rings, columns, a checker, boxes, bars) use the same mask. Six scenes rotate, each with its own two-tone palette, held 600 milliseconds and changed over 520.

Each transition has a schedule and a motion. The schedule gives every cell a delay, from a soft front sweeping across, rings expanding from the centre, random moments, the whole field collapsing, or columns falling in turn, and each cell changes within 28% of the window so the change sweeps rather than crossfades. The motion moves the cell a fraction of a pitch while it changes, so each transition reads as its own event. A second field hollows surviving cells into rings by boring a hole outward from the centre, so a cell can be solid, a hairline or a thin ring, and the bore only moves during a change.

The whole field is one Path2D: every disc, and every ring's bore as a reverse-wound inner circle, accumulated and filled once under the even-odd rule. A few thousand per-cell fills is what makes this stutter; one composite path is what makes it smooth. A fine pointer erases cells within 1.6 cells of it, and they flow back when it leaves.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/dot-cut/`. It is React and TypeScript: `scenes.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/dot-cut` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Fit the pitch to the width with a 0.75 pitch margin per side, then fit whole rows into the height and centre the grid.
- Rasterise each scene at grid resolution, the glyph at 600 weight in the live face, and read one present-or-absent flag per cell.
- On a scene change, give each cell a delay from the transition kind and tween its presence over the last 28% of the window from that delay.
- Offset and scale a changing cell by the transition's motion, a fraction of a pitch, only while it is changing.
- Accumulate every disc and every bore into one Path2D, bores reverse-wound, and fill it once with even-odd.
- Crossfade the two-tone palette with the scene; scale cells down near a fine pointer.
- Under reduced motion, draw the first scene settled, once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SCENES` | A, rings, columns, checker, boxes, bars | What is carved, how it arrives, its palette and its ring pattern. A text scene takes any glyph. |
| `PALETTES` | six pairs, the first #8aa9ff on #1f45f5 | Circle and background colours. The background is also the symbol. |
| `DEFAULTS.cols` | 42 | Circles across. Fewer is chunkier; past about 38 the dots start reading as a halftone. |
| `DEFAULTS.hold, DEFAULTS.morph` | 600, 520 | Milliseconds each scene holds and each change takes. |
| `DEFAULTS.fill` | 1 | Circle diameter as a fraction of the pitch. Keep it at 1 so the circles touch. |
| `DEFAULTS.brush` | 1.6 | The pointer's erase radius, in cells. 0 turns it off. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the glyph's font family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
