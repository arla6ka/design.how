---
name: kinetic-typography
description: Builds a Canvas 2D kinetic type effect in which one heavy serif letter is cut into a grid of tiles that each copy from a source offset by two crossing sine waves, so the letter ripples like cloth, composited in duotone with a chromatic fringe on the warped edges, depth shading and a grain veil. Use when someone asks for a letter that ripples, a tile warp or displacement effect on type, a glitchy animated monogram, or a playful kinetic typography hero.
---

# Kinetic typography

One heavy letter cut into a grid of tiles, each slipping on its own wave, so the letter ripples like cloth. See it live at https://design.how/vault/kinetic-typography.

## What to build

One lowercase letter in a heavy display serif, set at 86 percent of the card's height, sits in a 16:9 card, ink on near-white paper. The letter never redraws. It ripples because the frame is cut into a grid, 34 tiles across and 19 down by default, and every tile shows a slightly different part of the letter.

The letter is drawn once, white on transparent, into an offscreen mask. Each frame, every tile copies the patch of the mask under it, but from a source shifted by a wave. Horizontally the shift is the sum of two sines, one phased by x times y and one by x plus y at about twice the frequency, so the ripple crosses itself instead of sliding as one sheet. Vertically a third sine moves it 70 percent as far. The largest shift is 26 px, and the spread term (0.025) decides whether the grid moves as one calm sheet or breaks up.

The warped letter is then tinted three times. An accent copy, blue by default, goes down a few pixels to the right and its complement a few to the left, both faint, and the ink copy goes on top at its true position, so the body stays clean and only the moving edges fringe. Tiles that moved further are drawn a little brighter, which gives the warp relief, and a fixed layer of noise and scanlines is overlaid on top.

It stays cheap at any tile count: the warp is plain drawImage copies of the tiles inside the letter's bounding box, and each colour is one whole-frame composite through a source-in tint.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/kinetic-typography/`. It is React and TypeScript: `params.ts`, `engine.ts`, `playground.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-serif` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/kinetic-typography` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw the text once as white on transparent into an offscreen mask, and measure its ink bounding box.
- Each frame, for every tile inside the box, copy the mask patch from a source offset by two summed sines in x and a third in y, phased by the tile's x*y and x+y.
- Draw each tile at an alpha that rises with how far it moved.
- Fill the paper, then composite the warped letter tinted to the accent shifted right, to its complement shifted left, and to the ink at zero offset.
- Overlay a prebuilt grain and scanline canvas, and count frames from real time so the speed holds at any refresh rate.
- Under reduced motion, draw frame 90 once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `text` | "a" | The letter, or up to 12 characters, fitted to 90 percent of the width. |
| `paper, ink, accent` | #fcfcfc, #1b1b1b, #3b82f6 | The ground, the letter and the fringe colour. |
| `tiles` | 34 | Tile columns. Fewer makes big, blocky steps. |
| `offset` | 26 | The largest shift in CSS px. |
| `speed, spread` | 0.02, 0.025 | How fast the waves move, and how turbulent the grid gets. |
| `chroma, shade, grain` | 0.35, 0.35, 0.7 | Fringe strength, depth shading and the grain veil. |
| `FONT_VAR` | --visual-serif | The CSS variable holding the font family. Any heavy display serif works. |
| `--visual-serif` in fonts.css | Georgia, serif | The typeface for this role, a heavy display serif. Put the project's face first. |
