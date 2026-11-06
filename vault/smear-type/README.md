# Smear type

Two lines of heavy capitals that a soft cloud with a glowing edge uncovers, while pale ribbons churn through the ground and ink streaks across.

Near-black capitals on ultramarine, two lines uncovered by a soft cloud with a cyan glowing edge, pale periwinkle ribbons churning behind and a blob of black ink streaking across.

See it live at [design.how/vault/smear-type](https://design.how/vault/smear-type).

## How it works

The motion is not computed. Every frame of a 48-frame loop, 50ms a frame, was traced into five grey layers on a 5 pixel grid (the ribbons, the cloud's glowing rim, how much of the type shows, how much of it is still sharp, and the ghost streaks outside the lines), plus the ink at 3 pixels on the seven frames that have it.

## Install

```bash
npx skills add https://design.how/vault/smear-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `DEFAULT_LINES` (default "DESIGN THAT", "MOVES YOU"). The two lines. Capitals read best; a line wider than WIDE is set smaller.
- `DEFAULT_GROUND` (default #1d1cf0). The ground, and the cloud's fill.
- `DEFAULT_RIBBON` (default #8d90ff). The ribbons' colour at full strength.
- `DEFAULT_RIM` (default #19c3ff). The cloud's glowing edge. A hotter shift of the ground reads best.
- `DEFAULT_TYPE` (default #080616). The type and its smear.
- `DEFAULT_INK` (default #000000). The blobs of ink.
- `KEY_MS` (default 50). One frame's length. The loop is 48 frames.
- `CAP` (default 45). The cap height in scene pixels, stroke included.
- `WIDEN` (default 1.1). How much wider than the face sets them the lines are drawn. 1 for a face that is wide already.
- `EMBOLDEN` (default 0.06). The thickening stroke, as a share of a cap. 0 for a face with a heavy weight.
- `BLUR` (default [30, 8]). How far half-hidden type smears, across and down, in scene pixels.
- `FONT_WEIGHT` (default 500). The weight the face is drawn at.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. A wide grotesque reads best.
- `LAYERS_URL` (default "/smear-type/layers.webp"). Where the traced layers are served from; INK_URL likewise for the ink.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
