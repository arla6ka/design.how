---
name: flood-type
description: Builds a flooding wordmark on Canvas 2D, in which a two-line word falls in with each letter turning to face front, holds, then rushes at the camera to 2.2 times its size with every letter at its own heavy-tailed angle and depth until it overruns the frame, and tumbles out of the bottom, in two flat colours per word with a flat speed smear and a pointer lean during the hold. Use when someone asks for type that zooms into the camera, an exploding or flooding headline, a kinetic wordmark loop, or letters that scatter and fall.
---

# Flood type

A two-line word that falls in, floods the frame and tumbles out. See it live at https://design.how/vault/flood-type.

## What to build

Six two-line words, each with its own pair of high-chroma colours, take turns on a wide card: Full Bleed in lime on deep green, then Tight Tracking, Hard Return, Grid Systems, Loose Leading and Type Setting. The lockup is a grotesque at its regular weight, sized so the longer line fills 68 percent of the card's width, its cap held under 30 percent of the height, with lines a hair more than a cap apart and tracking pulled in. Two flat colours, no blur and no gradient: every effect is a per-letter affine transform over a handful of global ramps.

One word is 62 ticks of a 30 tick a second timeline, about two seconds, read continuously so it plays at the screen's rate. The letters fall in from 1.3 half-heights above over 14 ticks, staggered by 3, each turning from up to 95 degrees edge-on to face front, the turn lagging the drop so it resolves in view. The lockup holds dead still for 10 ticks. Then the zoom: over 22 ticks the scale follows a measured table that hangs, snaps through the middle steeper than any cubic-bezier, overshoots a few percent and pins at 2.2. The scale stops; the exit is translation and rotation only. Over the last 15 ticks the word falls on an exponential ramp out of the bottom, drifting sideways a little so the frame empties.

Each letter gets its own settle angle drawn as 95 times a uniform sample to the power 2.6, so most barely turn and one or two lie on their side, plus an escape spin of up to 130 degrees and a tumble of up to 200 about its vertical axis, drawn as a horizontal scale by its cosine. Each letter carries a depth offset of up to 8 percent that changes its size but never its position, and the draw is depth-sorted. As the word floods, every glyph squeezes 10 percent of its own advance, so the frame fills with ink and stays readable. Fast letters leave three flat stamped copies back along their velocity, only above a measured speed, about one frame in ten.

While the pointer is over the card during the hold, the lockup leans up to 5.5 percent of the card toward it, easing with a 130ms time constant, and the launch waits up to 34 more ticks for it to leave. The lean fades out as the zoom starts, so the flood always fires from a centred lockup.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/flood-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-grotesk` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/flood-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Solve the font size so the longer line hits TARGET_WIDTH of the card, capped by MAX_CAP, and pivot every glyph on its own actualBoundingBox centre.
- Advance a tick clock at FPS times real seconds and sample the ENTER, SCALE, ROT and FALL tables at fractional positions.
- Draw each letter under its own transform: position from the shared global scale, size from that scale times its depth offset, rotation from its settle angle times the rotation ramp plus its escape spin, and a horizontal scale by the cosine of its tumble.
- Draw rarely-large rotations by sampling SPIN_MAX times a uniform to the power SPIN_TAIL, once per letter per word.
- Depth-sort the letters every frame and add SMEAR_STEPS flat copies back along the velocity of any letter faster than SMEAR_MIN_SPEED.
- Lean the lockup toward the pointer during the hold only, and stretch the hold up to HOLD_STRETCH ticks while it stays.
- Under reduced motion, draw the middle of the hold once: the settled lockup of the first word.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PRESETS` | six words, each with a ground, an ink and a spin | The words and their colour pairs. spin scales how wild the letters turn; below about 0.5 it becomes a plain zoom. |
| `PEAK_SCALE` | 2.2 | How far the word floods past the frame. |
| `SPIN_MAX` | 95 | The largest settle angle a letter can draw, degrees. |
| `SPIN_TAIL` | 2.6 | How strongly the angles bias toward small; 1 is uniform. |
| `HOLD_TICKS` | 10 | How long the lockup holds still before the flood. |
| `PULL` | 0.055 | How far the lockup leans toward the pointer during the hold. |
| `FONT_VAR` | --visual-grotesk | The CSS variable holding the font family. A light weight is the look. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
