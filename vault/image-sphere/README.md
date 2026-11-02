# Image sphere

A cloud of photos on an invisible sphere that drifts, spins on a drag and opens one on a click.

Photos of landscapes, animals and fruit floating on an invisible sphere, nearer ones larger.

See it live at [design.how/vault/image-sphere](https://design.how/vault/image-sphere).

## How it works

Each photo is a three.js plane, 50 units tall and as wide as its aspect, placed at a seeded random point on a sphere of radius 180 with the radius jittered by up to 40 either way. Every frame the planes get the inverse of the group's rotation, which keeps them square to the camera, and a scale of 0.8 plus their world depth over 2000, eased, so depth reads as size.

## Install

```bash
npx skills add https://design.how/vault/image-sphere
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript with three.js.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/image-sphere/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `SPHERE_PATHS` (default seventeen photos). The images. Any count works.
- `RADIUS` (default 180). The sphere the photos sit on.
- `PLANE_SIZE` (default 50). The height of a photo plane before depth scaling.
- `AUTO_ROT_Y` (default 0.0005). The ambient drift per frame around the vertical axis.
- `HOVER_SCALE` (default 1.2). How much the photo under the pointer grows.
- `INERTIA_DECAY` (default 0.94). How fast a flick spin dies away.
- `FOCUS_FILL` (default 0.62). How much of the view height a clicked photo fills.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
