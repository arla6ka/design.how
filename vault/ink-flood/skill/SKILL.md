---
name: ink-flood
description: Builds a seamless two-colour Canvas 2D loop in which a round pen writes a thick cursive scribble whose width breathes with the stroke, the scribble floods the frame by zooming and swelling at once, and its ink becomes the background the next mirrored scribble is drawn on, all driven by swappable scene data under a fixed halftone screen. Use when someone asks for a scribble or handwriting animation, an ink or paint flood transition, a colour-swap loop, a pen drawing effect, a halftone print texture, or a looping brush stroke.
---

# Ink flood

A pen writes a fat scribble, the scribble floods the frame, and its ink becomes the ground the next one is written on. See it live at https://design.how/vault/ink-flood.

## What to build

A pen dot writes a thick cursive scribble across a pale field. Two sparks pop out of it, the scribble swells until its ink covers the whole card, and the drawing starts again mirrored left to right, now light ink on the dark field the last one left behind. Each half is 72 frames at 25 fps, so the loop is 5.76 seconds, and it closes because each half's ink is the next half's ground.

The stroke is the pen's trail, not a path being revealed. The ink is every round dab the pen has laid so far, stamped along a centreline whose samples each carry a local half-width and the frame they were laid. Width breathes with the hand, fat in the valleys and thin over the crests. In the measured scene the centreline sits a few pixels below the visible pen and the resting stroke bulges fatter than the pen, so the spine is its own table and never derived from the pen track.

The flood is two curves at once. The scene zooms about its centre, to 3.94 times over 21 frames, while the stroke width multiplies on its own later curve. Zoom does the early work and the swell closes the notches between humps that no zoom can close. The sparks fly on a third, faster divergence and are drawn as capsules spanning their travel between frames, so they read as thrown off the wave. When the ink owns the frame it holds as a flat fill until the half ends.

The engine holds no numbers. Every look is one Scene object: a palette of two fields and a dot colour, the spine, the pen track, the flood tables and the sparks. The default plays the measured scribble in grey on white and near-black; the authored scenes build their scribble from a generator. A 45-degree dot screen at a 5 pixel pitch is baked once into a tile and laid over every frame in screen space, so it never zooms or mirrors with the ink and both flat holds match exactly.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/ink-flood/`. It is React and TypeScript: `scene.ts`, `ease.ts`, `generate.ts`, `halftone.ts`, `presets/measured.ts`, `presets/authored.ts`, `presets/index.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/ink-flood` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Map the scene's square onto the card's height, centred, and mirror it horizontally in the second half.
- Split time into two halves of scene.half frames; swap the two fields between halves, so ink becomes ground.
- Stamp round dabs along the spine up to the current frame, each segment interpolating position and half-width, spaced by a fraction of the radius.
- From flood.at, zoom the ink about the centre by the scale table and multiply every dab's radius by the swell table.
- Draw the pen and the sparks last, sparks as capsules from half a frame before to half a frame after.
- Lay the baked halftone tile over every frame in screen space, including the flat hold.
- Under reduced motion, draw scene.restAt once: the finished scribble before the flood.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `scene` | DEFAULT_SCENE | Which Scene the card plays. MEASURED, GRAPHITE, SULPHUR and TIDE ship; a new look is a new Scene, never an engine change. |
| `palette.fields, palette.dot` | #fafafa, #111111, #8c8c8c | The two fields that trade places, and the pen. The dot must read on both fields. |
| `generateSpine options` | humps 3, amplitude 0.2, crestR 22, valleyR 46 | The shape of an authored scribble: hump count, height and stroke radius at crests and valleys. |
| `HALFTONE_DEFAULTS` | pitch 5, radius 1.6, alpha 0.12 | The print screen. Alpha 0 turns it off. |
