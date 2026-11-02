---
name: ghosty-reveal
description: Builds a CSS mask reveal in which images bleed into view through a feathered, cloudy edge by sliding an oversized gradient mask across each box with mask-position, then fade back out and swap, on staggered loops over a scattered layout. Use when someone asks for a soft image reveal, a foggy or ghostly fade-in, a feathered wipe, a mask-position transition, or images that appear out of mist.
---

# Ghosty reveal

Photographs that bleed in and out of view through a soft, cloudy mask, like forming out of fog. See it live at https://design.how/vault/ghosty-reveal.

## What to build

Seven photographs sit in a staggered scatter on a white card, each in a 4:3 box between 13 and 24 percent of the card's width. None of them fades. Each one bleeds in through a soft, cloudy front that rises from the bottom over 1.5 seconds, holds for 1.5 seconds, and dissolves the same way, then comes back as a different photograph. The spots start 0.7 seconds apart, so the field breathes instead of pulsing.

The whole trick is one mask. A feathered ramp, transparent for its first quarter and opaque past two thirds, is laid over the box at 500 percent of its height, so only a sliver of the soft edge ever crosses it. Transitioning mask-position from one end to the other slides that edge across the image, and a gliding ease-out makes it arrive fast and settle slowly. The ramp is pushed around by fractal noise, so the front is cloudy rather than a clean gradient. It is drawn as an inline SVG, so there is nothing to load.

Left and right reveals use a horizontal copy of the ramp sized 500 percent wide, so the feather always runs along the wipe and no element is ever rotated. The image is swapped only after the out-transition has fully finished plus 220ms, so a new photograph never flashes in over the old one.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/ghosty-reveal/`. It is React and TypeScript: `params.ts`, `mask.ts`, `ghost-reveal.tsx`, `loop.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Copy `assets/media/` to the app's static folder as `public/ghosty-reveal/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/ghosty-reveal` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Wrap each image in a box whose mask-image is the feathered ramp, mask-size 100% by MASK_SCALE percent and mask-repeat none.
- Hidden is mask-position 0% 0%, shown is 0% 100% for an upward reveal; transition mask-position over DURATION with EASING.
- For left and right, use the horizontal ramp at MASK_SCALE percent by 100% and slide along x.
- Loop each box: a 140ms beat, reveal, hold, hide, wait DURATION plus 220ms, swap the image, repeat; stagger the boxes.
- Draw the ramp as an SVG linear gradient displaced by feTurbulence, so the edge is cloudy.
- Under reduced motion, show every image and switch the transition to a short opacity fade.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `IMAGES` | 17 photographs | The image set, as bucket paths. |
| `SLOTS` | 7 staggered spots | Where the images sit, in percent of the card. |
| `MASK_SCALE` | 500 | The mask's size as a percent of the box. Bigger is a softer, slower bleed. |
| `DURATION` | 1500 | One reveal in or out, in ms. |
| `HOLD` | 1500 | How long an image stays fully shown, in ms. |
| `EASING` | cubic-bezier(0.16, 1, 0.3, 1) | The reveal curve. |
| `DIRECTION` | up | Which way the soft edge travels: up, down, left or right. |
