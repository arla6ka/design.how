# Blur glow

A crisp rounded word in a soft gradient-mapped glow on light paper, dissolving into the next word and colour.

The word hello in deep indigo, crisp, inside a soft glow that runs from violet through magenta to gold on pale paper.

See it live at [design.how/vault/blur-glow](https://design.how/vault/blur-glow).

## How it works

The glow is a real bloom, not a stack of blurred copies. The word mask is blurred with a separable 9-tap gaussian down a chain of four framebuffers at a half, a quarter, an eighth and a sixteenth of the canvas, which gives a huge halo with no banding.

## Install

```bash
npx skills add https://design.how/vault/blur-glow
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-rounded`, a system stack in `fonts.css` (ui-rounded, system-ui, sans-serif). Put your own face first.

## Knobs

- `WORDS` (default ["hello", "pookie", "monkey"]). The words the card dissolves between.
- `PALETTES` (default Ultraviolet, Molten, Bubblegum, Electric, Jade, Sunburst). The colour worlds: five ramp stops from core to paper, plus ink and paper.
- `HOLD_MS, HOLD_SCALE` (default 700, [1.45, 0.9, 1.0]). How long each word holds, and a per-word multiplier so the cycle breathes.
- `MORPH_SEC` (default 0.8). Length of the cross-dissolve.
- `LETTER_SPREAD` (default 0.45). How much of the dissolve separates the first letter from the last.
- `GRAIN` (default 0.4). Film-grain strength.
- `WARP_AMP, WARP_RADIUS` (default 0.013, 0.2). How far and how wide the pointer pushes the letters.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
