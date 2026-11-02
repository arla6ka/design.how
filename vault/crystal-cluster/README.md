# Crystal cluster

A gold-outlined crystal cluster floating in a flickering gold beam of light.

A small cluster of teal crystals with a thin gold outline in a rising gold beam of light.

See it live at [design.how/vault/crystal-cluster](https://design.how/vault/crystal-cluster).

## How it works

The outline is a hull, not a post effect. Each crystal gets a child mesh with the same geometry, drawn back faces only and before the crystal, whose vertices are pushed out along their normals in clip space by a fixed number of pixels over the drawing-buffer size.

## Install

```bash
npx skills add https://design.how/vault/crystal-cluster
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript with three.js.

## Knobs

- `CRYSTAL_COLOR` (default #2fb6a8). The crystals' colour.
- `OUTLINE_COLOR, OUTLINE_PX` (default #ffef7a, 4). The outline's colour and width in pixels.
- `BEAM_CORE, BEAM_GOLD` (default #ffe63a, #ffd21e). The beam's core and edge colours.
- `PULL` (default 0.4). The most the cluster leans toward the pointer, in radians.
- `BACKDROP` (default a dark warm radial gradient). The room behind the canvas.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
