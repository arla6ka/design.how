# Tile field

A word made of tiny tiles, lit by a slow colour wave and a soft pointer light that leaves a wake.

A wide word made of tiny grey square tiles, a band of larger blue tiles drifting across it.

See it live at [design.how/vault/tile-field](https://design.how/vault/tile-field).

## How it works

Colour comes from one field. Four slow sines, each drifting at its own rate and angle, are summed at every tile, and the sum passed through a smoothstep sets how much that tile has woken up.

## Install

```bash
npx skills add https://design.how/vault/tile-field
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `WORD` (default "made of tiles"). The word. Any short line; it is fitted to the card width.
- `CELLS_ACROSS` (default 460). Tile density. Lower makes bigger, chunkier tiles.
- `HUE, HUE_SWING` (default 263, 16). The wave's hue and how far it drifts.
- `REST` (default oklch(0.64 0.006 263)). The grey of a resting tile.
- `SPEED` (default 0.02). How fast the wave moves.
- `FADE_RATE` (default 0.02). How long the pointer's wake lingers. Lower is longer.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
