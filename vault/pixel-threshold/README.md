# Pixel threshold

A word printed into a flat colour poster in hard pixel blocks, collapsing and resolving into the next word.

The word pixel in black blocky italic letters with a white halo, printed into a hot red poster with a moire surface.

See it live at [design.how/vault/pixel-threshold](https://design.how/vault/pixel-threshold).

## How it works

The blocks come from real low resolution, not from thresholding a blur. The word is rasterised into a tiny canvas the size of the grid, thresholded to one bit, and the halo and keyline are dilated in whole cells on that same grid, so all three layers quantise in register.

## Install

```bash
npx skills add https://design.how/vault/pixel-threshold
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/pixel-threshold/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `SEQUENCE` (default ["pixel", "insert coin", "player one", "game over"]). The words the cycle rotates through.
- `COLORWAYS` (default six {ground, ink, paper, fringe}). The poster colours. The first is the resting one.
- `DEFAULTS.threshold` (default 0.588). The luminance below which the ground's own shadows deepen, a mild burn under the print. The letterforms come from the grid, not from this.
- `FINE, COARSE` (default 150, 55). Cells across at rest and at the bottom of the collapse.
- `HOLD_MS, COLLAPSE_MS, RESOLVE_MS` (default 1900, 240, 380). How long each phase of the cycle runs.
- `DEFAULTS.halo, DEFAULTS.keyline` (default 3, 3). White halo and black keyline width, in cells.
- `DEFAULTS.keylineOffset` (default [1, 1]). How far the keyline is pushed into a drop shadow, in cells.
- `DEFAULTS.texture` (default 0.25). Strength of the printed surface. 0 is a clean vector poster.
- `FONT_CSS, FONT_WEIGHT` (default var(--visual-sans), 600). The face and weight. A thin stroke does not survive being quantised.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
