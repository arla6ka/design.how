# Checker conveyor

Nine rows of checker cells whip sideways one after another, and each pulse carries in the next scene.

A blue and cyan checkerboard with a red and pink checkered rectangle at its centre.

See it live at [design.how/vault/checker-conveyor](https://design.how/vault/checker-conveyor).

## How it works

A scene never fades in. During a pulse each row is a strip of [this scene's row][next scene's row] laid end to end, and the row slides by exactly the visible width, so the next scene arrives from the edge with its seam showing.

## Install

```bash
npx skills add https://design.how/vault/checker-conveyor
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `PALETTES` (default primary, duplex, plaster, monochrome, acid, dusk). Colour worlds of exactly three scenes each, with a direction (left, right or split) and an optional bottom-up cascade.
- `PALETTE_SECONDS` (default 2.2). How long a palette holds before the next rest swaps it.
- `DWELL_SCALE` (default 0.42). How much of each rest to keep. 1 is the measured original.
- `PULSE_RATE` (default 1.45). How much faster the pulses play than measured. 1 is the original.
- `FADE_SECONDS` (default 0.34). The palette crossfade. Keep it shorter than the shortest rest.
- `RECT_COLS, RECT_ROW_START, RECT_ROW_END` (default 12, 2, 6). The centred rectangle's width and rows.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
