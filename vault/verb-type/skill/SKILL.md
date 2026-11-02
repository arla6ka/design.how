---
name: verb-type
description: Builds kinetic typography on Canvas 2D in which five verbs act out their meaning, MOVE walking its letters around a grid, SKEW shearing them one at a time, ROTATE orbiting the frame's centre while two letters swap, BREAK dropping half the word onto a floor, CONDENSE squeezing to a hairline, each in its own ink and ground with print mottle, off-register ghosts on the cuts and a speed smear, plus press to hold the frame. Use when someone asks for type that does what it says, verb animations, a kinetic type reel, motion design typography, or expressive word animations.
---

# Verb type

Five words, each acting out its own verb in its own colours, cut hard. See it live at https://design.how/vault/verb-type.

## What to build

Five words take turns on a 1920 by 1080 scene, 16:9, scaled to the box as one unit, over 162 frames at 25 a second, a 6.48 second loop. Each verb performs itself, and each has its own ink on its own ground, alternating dark and light so the flip at every cut lands: MOVE in bone on cobalt, SKEW in vermilion on cream, ROTATE in cream on forest green, BREAK in black on yellow, CONDENSE in coral on aubergine. The cuts fall on frames 38, 65, 102 and 118, hard and mid-motion; no word settles before the next appears. One grotesque at medium weight throughout, at a different cap height per word.

Almost every move runs on one symmetric curve, cubic-bezier(0.85, 0, 0.15, 1), sharper than any named power ease. MOVE is a grid walk: each letter makes four moves back to back, a vertical slide between the top and bottom rows, a horizontal slide to its column, a slide to the middle row and an 80px hop, every slide 10 frames whatever its distance, with the letters' start times staggered by a frame or three. SKEW is a shear, not an italic: the word leans 25 degrees, then single letters lean to their own round angles in turn, with each letter's shift shipped as a per-frame table of centroid offsets. ROTATE moves six letters rigidly about the frame's centre on their own clocks from a table, and O and the second T take one extra turn to swap places before all settle at minus 45 degrees. BREAK throws E, A and K up, drops them to a floor at y 1050 and bounces them, while B and R rise 64px. CONDENSE is the face scaled horizontally about the centre in three eased steps that touch, 1832 to 1496 to 1158 to nothing, so the bars keep their weight while the stems thin.

The ink reads as print. A static low-frequency mottle, up to 18 percent, is cut out of the letters with destination-out and anchored to the frame like paper. On the two frames after each cut two hue-shifted ghost prints sit 9px either side of the word and fade. On MOVE a sliding letter leaves five fading copies along its own path, weighted by speed so the trail is exactly zero at rest. Glyph ink boxes are measured from the live face off an offscreen raster, so the layout holds for any grotesque.

Pressing the picture stops the clock on the current frame, and letting go resumes from the same instant: every word cuts away mid-motion, so a way to hold one frame is the interaction that belongs to this piece.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/verb-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/verb-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure each glyph's ink box off an offscreen raster at boot, and again when the face loads; place letters by ink-box centre.
- Read the clock as elapsed / 40ms at a fractional frame every animation frame, and pick the word from PHASES by frame.
- Drive every slide, lean and squeeze with EASE over a fixed number of frames, whatever the distance.
- Draw each letter under its own transform: grid slides and hops for MOVE, a shear plus a centroid offset for SKEW, a rigid rotation about the frame's centre for ROTATE, a ballistic drop with a bounce for BREAK, a horizontal scale about the centre for CONDENSE.
- Draw the ink into a layer, cut the mottle tile out of it with destination-out, then composite it over the ground.
- On the SPLIT_FRAMES after a cut, add two hue-shifted copies SPLIT_PX either side, fading to nothing; on MOVE, add SMEAR_TAPS trailing copies weighted by speed.
- Stop the clock on pointer down and resume on release.
- Under reduced motion, draw frame 91 once: ROTATE with every letter at minus 45 degrees.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PHASES` | five verbs with their frames, grounds and inks | The colour of each word. The verbs' motion is fixed by the tables, so keep the words. |
| `MOTTLE_DEPTH` | 0.18 | How much ink the print mottle lifts. |
| `SPLIT_PX` | 9 | How far the off-register ghosts sit either side on a cut. |
| `SPLIT_HUE` | 40 | The hue shift of the two ghost inks, degrees each way. |
| `SMEAR_ALPHA` | 0.5 | Opacity of the first copy in the speed trail. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any grotesque at medium weight works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
