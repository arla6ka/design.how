# Pixel scan

A diagonal band assembles a word out of a spray of tiny blocks, then a pool of blocks follows the pointer.

A dark word on a pale card, half solid and half broken into a spray of tiny light blue and pink squares along a diagonal band.

See it live at [design.how/vault/pixel-scan](https://design.how/vault/pixel-scan).

## How it works

Everything is one fragment shader over the card. The word is drawn with fillText into an offscreen canvas and uploaded as a texture, and its alpha is the glyph mask.

## Install

```bash
npx skills add https://design.how/vault/pixel-scan
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-display`, a system stack in `fonts.css` (Georgia, serif). Put your own face first.

## Knobs

- `WORD` (default "scanline"). The word. Short words read best.
- `ACCENT, ACCENT2` (default light blue, pink). The two ends of the cells' shimmer.
- `TEXT_COLOR, GROUND` (default #191b24, #fafdff). The word's ink and the card's ground.
- `ENTRANCE_SECONDS` (default 2.6). How long the assemble scan takes.
- `MODE` (default 3). Scan direction: 0 left to right, 1 top down, 2 radial, 3 diagonal.
- `SPOT_RADIUS, TRAIL_LIFE` (default 0.28, 1.1). The pointer pool's size and how long its wake lasts.
- `FONT_VAR` (default --visual-display). The CSS variable holding the font family. Any display serif works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
