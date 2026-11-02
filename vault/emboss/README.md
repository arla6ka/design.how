# Realistic emboss

Words and shapes pressed hard into tinted plaster, with the light catching every edge.

Three tinted plaster panels with a word, a flower and a word pressed into them.

See it live at [design.how/vault/emboss](https://design.how/vault/emboss).

## How it works

The relief is a height field, not geometry. Each panel's content is drawn white on a 2D canvas, once crisp and once blurred with a canvas filter at that panel's bevel width, and the two are packed into the red and green channels of one texture, at most 1500 pixels wide.

## Install

```bash
npx skills add https://design.how/vault/emboss
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

It sets its type in `--visual-wide`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/emboss/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `STYLES` (default beep, a flower, boop). Each panel's word or SVG, bevel width, depth, highlight, shadow, grain, brightness, tint and plaster window.
- `REST_ANGLE` (default 73 degrees). The direction the light comes from.
- `GRUNGE_AMT` (default 0.38). How strongly the scratch and grain overlay shows.
- `BUILTIN_SVGS` (default eleven solid shapes). The shapes a panel can press instead of a word.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
