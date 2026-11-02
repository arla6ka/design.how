# Flood type

A two-line word that falls in, floods the frame and tumbles out.

The words Full Bleed in a light grotesque, two tight lines of lime on deep green.

See it live at [design.how/vault/flood-type](https://design.how/vault/flood-type).

## How it works

One word is 62 ticks of a 30 tick a second timeline, about two seconds, read continuously so it plays at the screen's rate. The letters fall in from 1.3 half-heights above over 14 ticks, staggered by 3, each turning from up to 95 degrees edge-on to face front, the turn lagging the drop so it resolves in view.

## Install

```bash
npx skills add https://design.how/vault/flood-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-grotesk`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `PRESETS` (default six words, each with a ground, an ink and a spin). The words and their colour pairs. spin scales how wild the letters turn; below about 0.5 it becomes a plain zoom.
- `PEAK_SCALE` (default 2.2). How far the word floods past the frame.
- `SPIN_MAX` (default 95). The largest settle angle a letter can draw, degrees.
- `SPIN_TAIL` (default 2.6). How strongly the angles bias toward small; 1 is uniform.
- `HOLD_TICKS` (default 10). How long the lockup holds still before the flood.
- `PULL` (default 0.055). How far the lockup leans toward the pointer during the hold.
- `FONT_VAR` (default --visual-grotesk). The CSS variable holding the font family. A light weight is the look.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
