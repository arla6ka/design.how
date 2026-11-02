# Verb type

Five words, each acting out its own verb in its own colours, cut hard.

The word ROTATE in cream letters on forest green, every letter turned to minus 45 degrees about the centre.

See it live at [design.how/vault/verb-type](https://design.how/vault/verb-type).

## How it works

Almost every move runs on one symmetric curve, cubic-bezier(0.85, 0, 0.15, 1), sharper than any named power ease. MOVE is a grid walk: each letter makes four moves back to back, a vertical slide between the top and bottom rows, a horizontal slide to its column, a slide to the middle row and an 80px hop, every slide 10 frames whatever its distance, with the letters' start times staggered by a frame or three.

## Install

```bash
npx skills add https://design.how/vault/verb-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `PHASES` (default five verbs with their frames, grounds and inks). The colour of each word. The verbs' motion is fixed by the tables, so keep the words.
- `MOTTLE_DEPTH` (default 0.18). How much ink the print mottle lifts.
- `SPLIT_PX` (default 9). How far the off-register ghosts sit either side on a cut.
- `SPLIT_HUE` (default 40). The hue shift of the two ghost inks, degrees each way.
- `SMEAR_ALPHA` (default 0.5). Opacity of the first copy in the speed trail.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any grotesque at medium weight works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
