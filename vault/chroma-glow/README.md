# Chromatic glow

A word that glows on a coloured wall and splits into warm and cool copies at its edges.

A bold word glowing on a deep coloured wall, its edges split into warm and cool fringes.

See it live at [design.how/vault/chroma-glow](https://design.how/vault/chroma-glow).

## How it works

The glow is real bloom, built cheaply. The word is drawn once as a white mask, then blurred into four framebuffers at half, a quarter, an eighth and a sixteenth of the canvas, each with a separable 9-tap gaussian.

## Install

```bash
npx skills add https://design.how/vault/chroma-glow
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

It sets its type in `--visual-wide`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `HERO_CYCLE` (default boom, poof, zap, pow, yeet, oof). The words the card walks and the colour world each one gets.
- `CHROMA_PRESETS` (default six colour worlds). Warm, cool and fringe tints, wall colour, split, bloom, core, grain, spectral amount and light or dark wall.
- `split` (default 9 px at 620 tall). How far apart the warm and cool copies sit.
- `bloom` (default 1.62). The glow gain into the tone map.
- `spectral` (default 0.6). How much true rainbow rides over the three-colour split.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
