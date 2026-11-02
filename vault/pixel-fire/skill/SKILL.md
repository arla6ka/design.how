---
name: pixel-fire
description: Builds a Canvas 2D pixel-art fire, a 16 by 16 flipbook generated from a tiny heat simulation and drawn as crisp blocks on a stone block, with a live pixel buffer the pointer edits by pushing lit cells up and along its travel and heating them white, and a tap that blows the flame out to regrow. Use when someone asks for a pixel fire, a retro game flame, an interactive pixel-art sprite, a campfire animation, or a flame you can blow out.
---

# Pixel fire

A 16 by 16 pixel-art fire on a block, where the pointer moves the real pixels and a tap blows it out. See it live at https://design.how/vault/pixel-fire.

## What to build

A small pixel-art fire burns on a dark red block in the middle of a pale green card. The flame is 16 by 16 texels at 60 percent of the card's height, drawn with smoothing off so every texel is a hard square, and the block under it is the same width, cut off by the bottom edge.

The flipbook is generated, not drawn. A hot row sits under the texture, hotter in the middle than at the sides. Every step each cell passes its heat one row up, drifting a column left or right at random and losing a little, so tongues rise and break apart. After a warm-up, 32 steps become 32 frames, played at 18 a second. Heat maps to seven colours from deep red to near white, and alpha is binary: a texel is solid fire or a clean gap, never half transparent.

The pointer edits a live buffer, not a frame. Normally the buffer copies the current frame. Within 2.8 texels of the pointer, lit cells are moved one to four texels along the pointer's travel and upward, heated toward white, and the cells they leave become gaps. Disturbed cells then relight from the flipbook at random, so a carved hole fills in raggedly while the animation keeps playing underneath. The tips also lean toward the pointer by up to two whole texels, and a tap empties every lit cell at once.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pixel-fire/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 520, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/pixel-fire` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Generate the flipbook once from a seeded heat simulation: a hot source row, heat passed up a row per step with a random sideways drift and a random loss.
- Map heat to a short ramp of flame colours with binary alpha, and drop cells below a threshold to gaps.
- Keep a mutable RGBA buffer. Undisturbed cells copy the current frame exactly; disturbed ones relight from it at random and relax back.
- Under the pointer, move lit cells along its velocity plus an upward bias, heat them, keep the brighter colour at the destination, and clear the source.
- Shift each row toward the pointer by a whole number of texels that grows toward the tips, then put the buffer in a 16 by 16 canvas and draw it scaled with smoothing off.
- Under reduced motion, draw one flipbook frame untouched.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `FLAME` | seven colours, deep red to near white | The flame ramp, coolest first. |
| `COOL_MIN, COOL_RANDOM` | 0.02, 0.065 | Heat lost per row. Higher makes shorter, raggeder tongues. |
| `FPS` | 18 | Flipbook speed. |
| `BURN_RADIUS` | 2.8 | How many texels the pointer reaches. |
| `HEAL_RATE` | 6 | How fast a carved hole relights. |
| `BLOCK, GROUND` | dark reds, #f0f7ee | The block's colours and the card's ground. |
| `SEED` | 7 | The roll both textures come from. |
