---
name: bond-type
description: Builds a molecule-diagram type effect on Canvas 2D, in which two words in a bitmap pixel face unfold into a chain of nodes, stair-stepped pixel bonds on the face's own grid joining each letter to the next within its word, re-scatter through a random run of contour poses on measured ease tables, and fold back into plain typeset words. Use when someone asks for a molecule or chemistry-style logo animation, letters connected by lines, a pixel-font kinetic name, or a typographic node graph.
---

# Bond type

Two words in a pixel face that unfold into a molecule, pixel bonds joining each letter to the next. See it live at https://design.how/vault/bond-type.

## What to build

Two five-letter words, Atoms above Bonds, in a white bitmap pixel face on bright red. The lines sit at fixed fractions of the card's height and the type is sized from the measured cap of the loaded face. A cycle unfolds them into a molecule: the letters become nodes, the gaps between neighbours within each word grow bonds, the chain re-scatters through two to four poses, then folds back into the plain typeset words and holds for 8 ticks before the next cycle.

The motion is keyposes, not a wobble. Six scatter poses each put the two lines on different contours, an arc, a vee, a tilt, a wave or a step, with the first line lifting above its baseline and the second sinking below, so the lines never cross and every letter stays 70px inside the frame. Each cycle draws a random run of poses. All ten letters ride one shared ease table per move, 20 ticks out and between poses and 17 back, played at 32 ticks a second and sampled between ticks so it moves at the screen's rate, with up to 8 percent of spread in when each letter lands. There is no spring: on a bitmap face an overshoot reads as the letter arriving twice.

A bond is leftover space. It runs on the line between two letters' optical centres, inset from each letter's ink by one font pixel of air, so it is born as a single cell when the gap opens, stretches into a run as the letters part and dies back to a dot as they close, with no length animation of its own. It is drawn as square cells stepped along that line, a staircase on the type's own grid: the engine measures the face's pixel from the greatest common divisor of the ink runs across a rasterised capital, and steps bonds at half that pixel, two cells thick to match a stem. Each bond bows by one cell on a slow seven second drift.

While the words are a molecule, each letter now and then steps a whole font pixel on one axis when its own slow wave crests, fading in and out with the bonds, so the chain is never quite still and the typeset words never shiver.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/bond-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-pixel` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/bond-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the type from the measured cap of the live face and measure the face's pixel as the GCD of the ink runs across a rasterised capital.
- Lay the two lines out typeset, then define each scatter pose as per-line centre gaps, a line shift and per-letter lifts on a contour.
- Per cycle, pick SCATTERS_MIN to SCATTERS_MAX random poses; move between them on EASE_MOVE over MOVE_TICKS and home on EASE_RETURN over RETURN_TICKS, one clock for every letter plus a small per-letter arrival spread.
- Draw a bond between each pair of neighbours in a word, on the line between their optical centres, inset BOND_AIR_CELLS from each letter's ink, as square cells of BOND_CELL_SCALE font pixels stepped along the line and BOND_WEIGHT_CELLS thick; skip it below BOND_MIN_CELLS.
- Jitter each letter by one whole cell only while the bonds are on, gated by JITTER_GATE.
- Sample the tick timeline at FPS ticks a second, fractionally, every animation frame.
- Under reduced motion, draw the last tick of a cycle once: the typeset words with no bonds.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `LINES` | ["Atoms", "Bonds"] | The two words. The pose tables are set for five letters a line. |
| `GREEN` | #f5333f | The field colour. |
| `WHITE` | #fdfefd | The type and the bonds. |
| `FPS` | 32 | Ticks a second the timeline plays at. |
| `SCATTERS_MIN` | 2 | The fewest poses a cycle runs through. |
| `SCATTERS_MAX` | 4 | The most poses a cycle runs through. |
| `BOND_WEIGHT_CELLS` | 2 | Bond thickness in cells; two is one font pixel. |
| `FONT_VAR` | --visual-pixel | The CSS variable holding the font family. It must be a bitmap pixel face. |
| `--visual-pixel` in fonts.css | ui-monospace, monospace | The typeface for this role, a pixel or bitmap face. Put the project's face first. |
