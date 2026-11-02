# Dot globe

Three rounded-cube solids tiled with rounded squares, rocking together, a bright symbol painted on them and handed along the row.

Three rounded tiled forms on grey, lime on aubergine, coral on teal and yellow on cobalt, each carrying a bright symbol.

See it live at [design.how/vault/dot-globe](https://design.how/vault/dot-globe).

## How it works

The tiles are projected quads, not scaled and rotated squares. A patch spanning a range of longitude and latitude projects to a trapezoid whose two ends differ in width, and that is what the eye reads as the corner tiles leaning.

## Install

```bash
npx skills add https://design.how/vault/dot-globe
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `DUOS` (default lime on aubergine, coral on petrol, yellow on cobalt). Each globe's unlit tones, its mark and its hover tone.
- `GROUND` (default #f4f4f4). The shared ground.
- `EXPS` (default 0.42, 0.66, 0.95). How boxy each solid is. Keep them above about 0.4.
- `WOBBLE` (default 14 degrees). How far the row rocks.
- `HOLD_S, SWAP_S` (default 4.2, 1.1). Seconds each symbol holds and each swap takes.
- `HANDOFF` (default 0.35). How far behind its left neighbour each globe swaps, as a fraction of a swap.
- `TURN_EVERY_S` (default 26). Seconds between full turns.
- `GAP, ROUND` (default 0.26, 0.3). Gap between tiles and their corner radius, as fractions of a cell and a tile.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
