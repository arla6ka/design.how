# Symbols effect

A live halftone that rebuilds a clip from small tinted symbols, one per brightness band.

A short clip rebuilt as a halftone of small coloured symbols on white.

See it live at [design.how/vault/sandbox](https://design.how/vault/sandbox).

## How it works

It is one fragment shader on one full-frame quad. Each pixel snaps to the centre of its cell and samples the source there, so a whole cell reads one colour, and the luminance of that sample picks a band from four ranges, 0 to 25%, to 50, to 75 and to 100 by default.

## Install

```bash
npx skills add https://design.how/vault/sandbox
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript with three.js.

The skill ships placeholder clips, short abstract loops, in `skill/assets/media/`. Copy them to `public/sandbox/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `PRESETS` (default seven looks). Each clip with its four band colours, four symbols and zoom.
- `GLYPHS` (default twenty-four symbols). The symbols a band can stamp, drawn as canvas paths.
- `CELL` (default 8). The cell size in pixels at a 600 pixel wide card.
- `CYCLE_MS` (default 2000). How long the card holds each look.
- `bandStops` (default 0, 0.25, 0.5, 0.75, 1). Where the four brightness bands split.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
