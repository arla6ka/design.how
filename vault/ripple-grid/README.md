# Ripple grid

A lattice of soft blobs that blooms into rings, twists and settles back to a grid.

A grid of soft black blobs on a pale field, swelling into rings and a slow spiral.

See it live at [design.how/vault/ripple-grid](https://design.how/vault/ripple-grid).

## How it works

The whole picture is one scalar field, thresholded. Put a gaussian source at every lattice point, sum them, and paint ink wherever the sum clears a threshold.

## Install

```bash
npx skills add https://design.how/vault/ripple-grid
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `INK` (default #1b1b1b). The blob colour.
- `PAPER` (default #fcfcfc). The field colour.
- `GRID_NX, GRID_NY` (default 5, 3). The grid's half-extent in sources, so the full grid is 11 by 7. How many are lit at rest and at full bloom is set by RX_REST, RX_OPEN, RY_REST and RY_OPEN.
- `BLOOM_SEC` (default 8). Seconds from rest to full bloom and back.
- `TWIRL_MAX` (default 0.88). How far the rings shear into a spiral.
- `CURSOR_PUSH` (default 0.045). How hard the pointer parts the field. 0 turns it off.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
