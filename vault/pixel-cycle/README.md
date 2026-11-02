# Pixel cycle

One character at a time, breaking into big blocks and resolving sharp, then swapped for the next.

A cartoon green slime with big eyes on a faint blue pixel-paper grid.

See it live at [design.how/vault/pixel-cycle](https://design.how/vault/pixel-cycle).

## How it works

The pixelation needs no shader. The image is drawn shrunk into a tiny canvas, one texel per block, then drawn back up to full size with smoothing off, so the browser scales it into crisp squares.

## Install

```bash
npx skills add https://design.how/vault/pixel-cycle
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `sprites()` (default five drawn characters). The images, in loop order. Any canvases or loaded images work.
- `PIXEL_START, PIXEL_MIN, PIXEL_STEPS` (default 120, 2, 24). The coarsest and finest block, and how many steps between.
- `HOLD` (default 1.1). Seconds each image stays sharp.
- `IN_DURATION, OUT_DURATION` (default 0.5, 0.35). Seconds to resolve and to dissolve.
- `SWAP_SCALE_MIN, SWAP_SKEW` (default 0.15, 0.18). How small and how far leaned an image is at the swap.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
