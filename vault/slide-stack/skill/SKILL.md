---
name: slide-stack
description: Builds a Canvas 2D stack of five identical dark blocks sliding between a left and a right stop, each row a twelfth of a cycle ahead of the one below so the motion runs through the stack as a wave, with an orange accent that is the convex hull of the blocks rather than a shape of its own, plus motion blur, direction labels and a pointer magnet. Use when someone asks for a staggered slide animation, a cascading or wave stack, sliding bars, a rhythmic block loop, or an accent shape derived from moving objects.
---

# Slide stack

Five dark blocks slide between two stops a beat out of step, and the orange behind them is traced from where they are. See it live at https://design.how/vault/slide-stack.

## What to build

Five identical near-black blocks sit in a stack on a light grey ground, each sliding between a left and a right stop. The vertical measures come from a 720 square: blocks 121 tall on a 132.5 pitch, so the gutters are a thin 11.5 and the stack reads as one mass with slots cut in it. Across the wide card each block takes 0.29 of the drawn width, which keeps the reference's ratio of block to travel, a block moving a little more than its own length.

Stagger is the whole piece. Every row does the identical move, offset by -0.083 of a cycle from the row above. The sign matters: each row runs slightly ahead of the one below, so the wave climbs the stack, and a twelfth of a cycle keeps neighbouring rows overlapping in flight so it reads as one gesture. A traverse takes 0.306 seconds and a dwell 0.316, so the pause is a touch longer than the move and the piece reads as a sequence of arrivals.

The move is 1 - (1 - smoothstep(k))^2: a clean departure with no corner, ground covered early, and a long closing creep, monotonic with no overshoot, because heavy blocks arriving at hard stops do not bounce.

The orange is not an animated shape. It is the convex hull of the twenty block corners, filled under the blocks, so the slanted silhouette reshapes continuously as the cascade travels. Layers sit on that skeleton in draw order: a hairline wake where the hull was eleven frames ago, the hull filled with a per-row heat gradient that warms toward magenta and gold with speed and with the pointer, blur stamped back along each block's travel, the hard blocks, labels that name where each block goes next and swap corners when it turns, and a fixed grain. A mouse near a row lets it lean up to 0.028 of the square past its stop.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/slide-stack/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/slide-stack` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure every vertical size as a fraction of the card's height and every horizontal one as a fraction of its width.
- Give row r the phase t / CYCLE + r * STAGGER, wrapped to 0..1, split into right traverse, right dwell, left traverse, left dwell.
- Ease each traverse with 1 - (1 - smoothstep(k))^2, and draw the block at the eased position.
- Collect the twenty block corners, take their convex hull and fill it as the accent before drawing the blocks.
- Smear a moving block back along its last frame's travel with BLUR_TAPS copies at falling alpha; never smear a parked one.
- Ease the pointer's pull and each row's light toward their targets every frame, so nothing snaps to the cursor.
- Under reduced motion, draw t = 0 once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `STAGGER` | -0.083 | Each row's offset from the row above, in cycles. Flip the sign and the wave falls instead of climbing. |
| `TRAVERSE, DWELL` | 0.306, 0.316 | Seconds per move and per pause. |
| `GROUND, BLOCK, ACCENT` | #dedede, #191919, #f0461e | The three flat colours. |
| `HUE_MID, HUE_HOT` | #ff2d6f, #ffd84a | Where the accent warms to with speed and under the pointer. |
| `LABEL_TO_RIGHT, LABEL_TO_LEFT` | RIGHT, LEFT | The labels, naming where each block goes next. |
| `MAG_PULL` | 0.028 | How far a row leans toward the pointer past its stop. 0 turns it off. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the label font family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
