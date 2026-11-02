# Holo

An identity card that tilts in 3D while a holographic foil slides over it and the picture flips its colours.

A pale identity card reading Wanderer, member since May 2023, with a small picture tile, on a soft grey ground.

See it live at [design.how/vault/holo](https://design.how/vault/holo).

## How it works

The lag is the effect. Two followers chase their targets at different weights: the card at 0.16 of the gap per frame and the foil at 0.09, so the surface catches up to the card a few frames late instead of moving with it, which is most of what separates this from a gradient following a cursor.

## Install

```bash
npx skills add https://design.how/vault/holo
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `CARD_NAME, CARD_LINE` (default "Wanderer", "member since May 2023"). What the card says.
- `FOILS` (default ten materials, Holo first). The foil materials, in engine.ts: each one's layers, parallax, bloom and glare.
- `MAX_TILT` (default 14). The most the card turns, in degrees.
- `TILE_IMAGE` (default a sun over two ridges and a lake). The picture on the tile, in tile-image.ts.
- `GROUND` (default a soft grey fall-off). The card's surroundings.
- `DESIGN_WIDTH` (default 528). The card width the corners and type are tuned at; a wider card scales up.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
