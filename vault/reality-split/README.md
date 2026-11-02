# Reality split

A selected word splits into letter objects, scatters, is inspected letter by letter at huge scale, and pops back whole.

The word Animation in white on an ultramarine box with corner handles, on an acid yellow field.

See it live at [design.how/vault/reality-split](https://design.how/vault/reality-split).

## How it works

It works on any word. The cells come from prefix advances so the seams land exactly between glyphs, and each letter's box is fitted to its real ink bounds from measureText, so a wide capital never hangs out of its own selection.

## Install

```bash
npx skills add https://design.how/vault/reality-split
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `VARIANTS` (default six words, from Animation to Canvas). The passes in order, each a word, a palette, a box shape, a handle mark and a scatter seed.
- `PALETTES` (default volt, mint, ultramarine, terminal, press, studio and more). Four flat colours each: field, box, handles and ink. Keep the handles clear of both field and box.
- `FONT_FAMILY` (default sans-serif). The family, drawn at 700. Any bold grotesque works; the boxes are measured from it.
- `SCATTER_SPREAD` (default 0.5). How far the scatter stretches into a wide card. 0 keeps a square constellation.
- `TRAIN_DWELL_MIN` (default 0.09). Seconds each inspected letter sits still at the centre.
- `SPRING_AMP, SPRING_FREQ, SPRING_DAMP` (default 0.02, 8.5, 5). The inspection's landing: overshoot, ring and decay.
- `CYCLE_VARIANTS` (default true). False plays the first variant forever.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
