# Wild type

A design word types itself in, goes wild through one warp field, collapses home and un-types.

The word design in heavy white oblique lowercase, small and centred on black.

See it live at [design.how/vault/wild-type](https://design.how/vault/wild-type).

## How it works

The letterforms are vector, traced at runtime. Each letter is rasterised alone at a 320px em, its alpha is run through marching squares at iso 0.5 with linear edge interpolation, the segments are stitched into rings, simplified by Douglas-Peucker at 0.45px, and holes are found by containment.

## Install

```bash
npx skills add https://design.how/vault/wild-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-grotesk`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORDS` (default design, type, grid, color, motion, shape, pixel, layout). One word per loop. Four to six letters keeps the type size even.
- `ACCENTS` (default one colour per word). The slip ink for each word, in the same order.
- `BG` (default #000000). The ground.
- `INK` (default #ffffff). The letters.
- `OBLIQUE` (default 0.2). The synthetic slant, as a shear.
- `REST_WIDTH_FRAC` (default 0.34). How much of the card width the word spans at rest.
- `GRAIN_ALPHA` (default 0.06). Strength of the film grain.
- `FONT_CSS` (default var(--visual-grotesk), sans-serif). The font family. Any heavy grotesque works; the contours are traced from it.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
