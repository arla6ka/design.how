# Eclipse grid

Eighty rings sliding off the discs they hide, each on its own beat; the pointer is the lamp.

A grid of thin amber rings on near black, about half of them showing an amber crescent to the lower right.

See it live at [design.how/vault/eclipse-grid](https://design.how/vault/eclipse-grid).

## How it works

The shapes part along the 45 degree diagonal until they sit 11px apart on each axis. The ring takes 7 of those pixels up and to the left and the disc 4 down and to the right, so the ring is what moves and the disc seems uncovered rather than arriving.

## Install

```bash
npx skills add https://design.how/vault/eclipse-grid
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `GROUND` (default #101012). The field colour, and the fill of every ring.
- `INK` (default #ffb000). The discs and the ring strokes.
- `PHASE` (default an 8 by 10 table of start frames). Each cell's offset into the beat. A new table is a new field.
- `SEPARATION` (default 11). How far apart the shapes get per axis, fully open.
- `RING_SHARE` (default 7 / 11). How much of the travel the ring takes; the disc takes the rest.
- `LIGHT` (default {radius: 200, steer: 0.55, push: 0.5, presenceMs: 140, followMs: 90}). The lamp: its reach, how far it turns the split, how far it opens a cell, and its easing.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
