# Slide stack

Five dark blocks slide between two stops a beat out of step, and the orange behind them is traced from where they are.

Five black blocks stacked on light grey, offset along a slanted orange shape behind them.

See it live at [design.how/vault/slide-stack](https://design.how/vault/slide-stack).

## How it works

Stagger is the whole piece. Every row does the identical move, offset by -0.083 of a cycle from the row above.

## Install

```bash
npx skills add https://design.how/vault/slide-stack
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `STAGGER` (default -0.083). Each row's offset from the row above, in cycles. Flip the sign and the wave falls instead of climbing.
- `TRAVERSE, DWELL` (default 0.306, 0.316). Seconds per move and per pause.
- `GROUND, BLOCK, ACCENT` (default #dedede, #191919, #f0461e). The three flat colours.
- `HUE_MID, HUE_HOT` (default #ff2d6f, #ffd84a). Where the accent warms to with speed and under the pointer.
- `LABEL_TO_RIGHT, LABEL_TO_LEFT` (default RIGHT, LEFT). The labels, naming where each block goes next.
- `MAG_PULL` (default 0.028). How far a row leans toward the pointer past its stop. 0 turns it off.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the label font family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
