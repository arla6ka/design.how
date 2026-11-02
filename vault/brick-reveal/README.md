# Brick reveal

A picture restyled as toy bricks, voxels and a cartoon that peels back to the plain picture behind the pointer.

A square picture of a mountain lake at sunset, part toy bricks and part plain picture, on a soft glow.

See it live at [design.how/vault/brick-reveal](https://design.how/vault/brick-reveal).

## How it works

The trail is a 220 by 220 half-float texture in a ping-pong pair. Each frame it keeps the minimum of four diagonal neighbours a little way off, times a slow decay, so it shrinks evenly from its edges and stays one connected shape as it fades, and it paints a soft spot at the cursor whose edge is pushed around by 3D Perlin noise.

## Install

```bash
npx skills add https://design.how/vault/brick-reveal
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `STYLES` (default bricks, blocks, toon). The styles in order, each with its maker and glow colour.
- `STYLE_HOLD, STYLE_FADE` (default 2.8, 0.28). Seconds each style holds and crossfades.
- `TRAIL_SIZE, TRAIL_SIZE_AUTO` (default 0.13, 0.2). The reveal radius under the pointer and under the virtual cursor.
- `scene()` (default a mountain lake at sunset). The plain picture. Draw any square scene, or load an image into the same canvas.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
