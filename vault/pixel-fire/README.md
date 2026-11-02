# Pixel fire

A 16 by 16 pixel-art fire on a block, where the pointer moves the real pixels and a tap blows it out.

A small orange and yellow pixel-art fire in square texels on a dark red block, on a pale green ground.

See it live at [design.how/vault/pixel-fire](https://design.how/vault/pixel-fire).

## How it works

The flipbook is generated, not drawn. A hot row sits under the texture, hotter in the middle than at the sides.

## Install

```bash
npx skills add https://design.how/vault/pixel-fire
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `FLAME` (default seven colours, deep red to near white). The flame ramp, coolest first.
- `COOL_MIN, COOL_RANDOM` (default 0.02, 0.065). Heat lost per row. Higher makes shorter, raggeder tongues.
- `FPS` (default 18). Flipbook speed.
- `BURN_RADIUS` (default 2.8). How many texels the pointer reaches.
- `HEAL_RATE` (default 6). How fast a carved hole relights.
- `BLOCK, GROUND` (default dark reds, #f0f7ee). The block's colours and the card's ground.
- `SEED` (default 7). The roll both textures come from.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
