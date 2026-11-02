# Rush type

A word rests, then blasts toward you and tears into streaks of coloured light before the next one lands.

A small white word, sharp and alone at the centre of a black field.

See it live at [design.how/vault/rush-type](https://design.how/vault/rush-type).

## How it works

The colour is a byproduct of speed, and there is no colour constant anywhere. The three channels are the same white word accumulated over three different shutter lengths, in the ratio 0.62, 1.0 and 0.34 for red, green and blue.

## Install

```bash
npx skills add https://design.how/vault/rush-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORDS` (default ["gone", "before", "you", "look"]). The words, one per cycle. Keep the count even and the words short.
- `SY_PEAK, SX_PEAK` (default 7.0, 1.57). How tall and wide the word stretches at the blast, before perspective.
- `REST_S` (default 0.38). Seconds the word rests, readable.
- `SHUTTER_K` (default [0.62, 1.0, 0.34]). Per-channel shutter length. The further apart, the stronger the colour split.
- `SAMPLES` (default 28). Fetches per channel. The visible banding is part of the look.
- `ORBIT_YAW, ORBIT_PITCH` (default 0.55, 0.26). How far the word turns on its way through the blast, in radians.
- `CRT_GAIN` (default 1.0). Strength of the grille, scanlines and hum during the blast. 0 turns them off.
- `HOLD_STRENGTH` (default 0.96). How hard pointing at the card holds the word at its peak.
- `FONT_VAR` (default var(--visual-sans)). The font family. Any neo-grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
