---
name: spray-burst
description: Builds a WebGL fragment-shader effect that looks like a three-ink screenprint reprinting itself, cycling through six bold geometric drawings (a touring starburst, broken rings, sliding bars, fusing discs, a pinwheel and a halftone wave) with every edge a dithered spray fringe that re-rolls at 24 fps, and the pointer laying ink on heavier. Use when someone asks for a screenprint or risograph look, a sprayed or stippled edge, a dithered signed-distance shader, a hand-printed boil, or a looping poster animation in WebGL.
---

# Spray burst

A screenprint that reprints itself every three seconds, every edge a boiling spray of dots. See it live at https://design.how/vault/spray-burst.

## What to build

A sheet of warm off-white paper, inset with a coloured plate and an ink drawing printed over it. Every three seconds the press runs a new job: broken rings whose gaps whip round, a seven-wedge pinwheel, an eight-ray starburst that hops between three stations on its plate, a halftone field swelling under a travelling wave, six bars sliding across each other, and a cluster of discs that drift together and fuse. Each drawing has its own plate and ink, chosen to share nothing with the last, but the paper stays within a few levels of the same cream, so the six read as one press and not six cards.

Every pixel is exactly one of three inks. There is no anti-aliasing and no blending: each scene resolves to a signed distance for the plate and for the ink, the distance becomes a coverage probability Phi(-d / sigma), and a per-pixel hash decides which ink wins. That dither is the whole texture. A sparse far tail of spatter carries specks well past the edge, a low-frequency wobble moves each outline about two pixels a frame, and the interior grain darkens pixels by zero, one or two steps, heaviest on the plate.

Playback is stepped at 24 fps on purpose. The hash and wobble are seeded by the frame index, so every frame is a fresh drawing and the stepping reads as film rather than lag; the loop runs at display rate and only redraws when the 24 fps index moves. Nothing moves linearly either. Each scene runs its travel through a sampled ease table with a long hold, a fast crossing and a long settle, and the starburst keeps its measured move: a creep, half the gap in one frame, then a slow settle.

The pointer changes how it prints, not what it draws. Within about 1.6 plate units the ink sprays up to 35% wider and grains harder, as if that part of the sheet took more ink. Each drawing also takes one small lean toward the hand from a shelf of gestures: the star's spikes reach, the ring gaps turn to face it, the bars are raked along their axis, the discs gather and fuse, the pinwheel aims a wedge, the halftone dots swell. The pull eases in over about 0.28 s.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/spray-burst/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 820, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/spray-burst` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw one full-screen triangle; do every scene in one fragment shader that outputs one of three flat inks per pixel.
- Inset the plate by a margin scaled by height, and measure every shape in units of half the plate height so the print scales with the card.
- For the plate and for the ink, build a signed distance, turn it into coverage with Phi(-d / sigma) plus a small exponential spatter tail, and dither it against a hash seeded by the frame.
- Pack each scene's per-frame numbers into two shared uniform arrays, so one program serves every drawing.
- Step the drawing at 24 fps from a display-rate loop that skips frames where the index has not moved, and repaint early only while the pointer is easing.
- Run each scene's motion through a hold, cross, hold ease table, a fixed number of beats per three-second scene.
- Ease the pointer's strength exponentially in seconds, then feed it to the spray width and grain everywhere and to one gesture per scene.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy delete the program and buffer and lose the context.
- Under reduced motion, draw the centred starburst once, mid-hold.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PALETTES` | six {paper, plate, ink} triples | The three inks per drawing. Keep the paper near the same cream in all six. |
| `ORDER` | [1, 4, 0, 5, 2, 3] | The order the six drawings print in. |
| `SCENE_MS` | 3000 | How long each drawing holds before the next. |
| `FPS` | 24 | The step rate of the boil. Higher reads smoother and loses the film. |
| `SPRAY_INK, SPRAY_PLATE` | 0.028, 0.033 | The spray fringe width for ink and plate, in plate units. |
| `SPRAY_SCALE, GRAIN_SCALE` | [1, 0.72, 1.15, 1.3, 0.85, 1.5], [1, 0.9, 1.35, 1.1, 0.8, 0.6] | Per-drawing multipliers on the fringe and the interior grain. Keep them between about 0.6 and 1.5. |
| `CURSOR_AMOUNT` | [0.55, 0.7, 0.45, 0.5, 0.6, 0.8] | How far each drawing leans toward the pointer. 0 turns a drawing's gesture off. |
| `CURSOR_SPRAY, CURSOR_GRAIN` | 0.35, 0.5 | How much heavier the print gets under the pointer. |
