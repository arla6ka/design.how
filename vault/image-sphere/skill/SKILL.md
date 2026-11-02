---
name: image-sphere
description: Builds a three.js image sphere in which photos sit as camera-facing planes scattered over an invisible sphere that drifts on its own, spins with flick momentum when dragged, enlarges the photo under the pointer and glides a clicked photo to the centre as a lightbox while the rest dim. Use when someone asks for a 3D image sphere, a spinning photo globe, a draggable gallery in three.js, an orbiting image cloud, or a billboard sprite gallery with a lightbox.
---

# Image sphere

A cloud of photos on an invisible sphere that drifts, spins on a drag and opens one on a click. See it live at https://design.how/vault/image-sphere.

## What to build

Seventeen photos float in a loose ball in the middle of the card, fjords, waterfalls, mountains, a deer, a walrus, strawberries, a bird in flight. Each one is a flat picture that always turns to face the viewer, so the sphere is never drawn; it shows up only as the arrangement, with the near photos bigger and in front and the far ones small behind them. The whole cloud turns slowly on two axes at once, so it never settles into one plain spin.

Each photo is a three.js plane, 50 units tall and as wide as its aspect, placed at a seeded random point on a sphere of radius 180 with the radius jittered by up to 40 either way. Every frame the planes get the inverse of the group's rotation, which keeps them square to the camera, and a scale of 0.8 plus their world depth over 2000, eased, so depth reads as size. Transparent planes do not write depth, so overlaps blend cleanly.

A drag adds to a target rotation that the sphere eases toward at 0.2 a frame; on release the last step becomes a spin that decays by 0.94 a frame and hands back to the drift. A press that moves less than 6 pixels is a click. It ray-casts the front-most photo and eases it to a point 300 units in front of the camera, scaled to fill 62% of the view height there, while every other photo fades to 16% opacity. Hovering a photo grows it to 120%.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/image-sphere/`. It is React and TypeScript: `images.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Copy `assets/media/` to the app's static folder as `public/image-sphere/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/image-sphere` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Make one plane per photo with a basic material, depthWrite off, and place it at a seeded random point on a sphere with a jittered radius.
- Each frame, add a small constant drift to the group rotation plus the eased drag rotation, and copy the inverse group quaternion onto every plane so it faces the camera.
- Scale each plane by 0.8 + worldZ / 2000, times the hover scale when the ray cast hits it, eased toward that target.
- Turn the last drag step into a velocity on release and decay it each frame, so a flick keeps spinning.
- On a click, ease the hit plane from its home spot to a fixed point in front of the camera, converted into group space, and dim the others.
- Stop on webglcontextlost, and on destroy dispose every geometry, texture and material, then renderer.dispose() and renderer.forceContextLoss().
- Under reduced motion, snap every plane to its billboard and depth scale and draw once; clicking does nothing.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SPHERE_PATHS` | seventeen photos | The images. Any count works. |
| `RADIUS` | 180 | The sphere the photos sit on. |
| `PLANE_SIZE` | 50 | The height of a photo plane before depth scaling. |
| `AUTO_ROT_Y` | 0.0005 | The ambient drift per frame around the vertical axis. |
| `HOVER_SCALE` | 1.2 | How much the photo under the pointer grows. |
| `INERTIA_DECAY` | 0.94 | How fast a flick spin dies away. |
| `FOCUS_FILL` | 0.62 | How much of the view height a clicked photo fills. |
