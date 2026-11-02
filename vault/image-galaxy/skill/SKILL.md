---
name: image-galaxy
description: Builds a DOM and CSS 3D image field in which small square photographs drift vertically forever under one perspective, each at its own depth and parallax speed, scaling up as they descend, fading with depth and wrapping from one edge to the other, fed by page scroll and a drag. Use when someone asks for floating images, a parallax photo field, a drifting gallery background, an infinite image stream, or a depth field of thumbnails.
---

# Image galaxy

Small photographs drifting through a perspective field, growing as they fall and wrapping forever. See it live at https://design.how/vault/image-galaxy.

## What to build

A near-white card with twelve small square photographs scattered over it, six on a phone. They drift upward together, each at its own parallax speed, and grow as they move down the field: a photo at the top sits at half size and one at the bottom at 1.4 times. When one leaves an edge it re-enters at the other, so the stream never ends. Scrolling the page pushes the drift, and a mouse drag up or down does too.

Each photo is one element under a single CSS perspective, given a depth from nine steps between -200px and 200px and a speed from five multipliers between 0.55 and 1.6, cycled so neighbours differ. Images behind the plane carry a wash of the ground colour at up to 40 percent, so depth reads as haze as well as size. Placement avoids clumping: x is spread over evenly spaced columns across the middle 84 percent of the width with half a column of jitter, and y is staggered by row.

The motion is one number. A target advances 1.1 px per frame plus whatever scroll fed in, clamped at 60px per event, and the field eases toward it at 0.16 per frame; every image's offset is that value times its speed. Scale is read from the image's height in the field and eased at 0.25, so it never jumps when an image wraps. The field is half again as tall as the card, so wrapping happens out of sight.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/image-galaxy/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Copy `assets/media/` to the app's static folder as `public/image-galaxy/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/image-galaxy` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Lay the images absolutely in a field 150 percent of the card's height under one perspective, with column-spread x and row-staggered y in percent.
- Give each a depth and a speed from the pools, and a ground-coloured overlay whose opacity rises as depth goes negative.
- Each frame, advance the target by CONFIG.speed, ease the current value toward it, and set each image to translate3d(0, -current * speed, z) scale(s).
- Wrap an image that leaves one edge by adding the field height to its offset, in the direction of travel.
- Ease scale toward scaleMin plus its height fraction times the scale range.
- Feed page scroll velocity and a vertical mouse drag into the target, clamped so a jump never teleports the field.
- Under reduced motion, lay the field out once with each image at the scale its height asks for, and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `IMAGES` | 17 photographs | The image set, as bucket paths. |
| `COUNT_DESKTOP, COUNT_MOBILE` | 12, 6 | How many images fly. |
| `IMAGE_SIZE, IMAGE_SIZE_MOBILE` | 112, 64 | An image's side in design pixels, on a wide window and on a phone. |
| `DESIGN_WIDTH` | 528 | The card width the sizes and the 800px perspective are tuned at; a wider card scales the field up. |
| `CONFIG` | speed 1.1, ease 0.16, scale 0.5 to 1.4 | The drift speed, the smoothing, the scroll feed and the scale range. |
| `Z_POOL` | -200 to 200 in 50px steps | The depths images are spread over. |
| `SPEED_POOL` | 0.55, 0.75, 1, 1.3, 1.6 | The parallax multipliers. |
| `GROUND` | #fcfcfc | The card colour and the depth wash. |
