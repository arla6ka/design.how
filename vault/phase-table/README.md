# Phase table

A four by six table of closed harmonic curves, lit as steel wire, breathing on one shared phase.

Twenty-four looping steel curves on a near-black field, circles down the diagonal and woven lattices away from it.

See it live at [design.how/vault/phase-table](https://design.how/vault/phase-table).

## How it works

One phase drives the whole table. It turns once every 2.88 seconds and enters only the x argument, so y never moves.

## Install

```bash
npx skills add https://design.how/vault/phase-table
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `COLS, ROWS` (default 6, 4). The table's size. The diagonal needs at least three rows to read.
- `PERIOD_MS` (default 2880). One full turn of the shared phase. Larger is calmer.
- `DETENT` (default 0.55). How long the sweep lingers on the open frames. Keep it under 1.
- `CELL_LAG` (default 0.22). Radians of lag per step across the diagonal. 0 makes the table pulse as one block.
- `METALS` (default steel, gold, copper, oil). The matcap ramps. The first one renders; each has five stops, a glint colour and a ground.
- `POINTER_TURN` (default 0.22). How far the pointer turns the light, in turns.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
