# Misprint type

HOLD ON, two prints that never register; press and hold to pull them together.

HOLD ON in tall warm-white capitals on hot orange, with a black outline printed slightly off.

See it live at [design.how/vault/misprint-type](https://design.how/vault/misprint-type).

## How it works

The word is printed three times, and the prints never agree. The fill, warm white, is the narrower run.

## Install

```bash
npx skills add https://design.how/vault/misprint-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-grotesk`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `GROUND` (default #ff4d1a). The sheet.
- `FILL` (default #fff6ec). The white ink.
- `OUTLINE` (default #111111). The sharp outline pass.
- `FOIL_STOPS` (default ["#b8f3d8", "#d8c4ff", "#cfefff", "#ffd6b8"]). The foil's colours around its cycle.
- `LINES` (default HOLD and ON with their fill and outline spans). The words and where each print sits. The outline span wider than the fill span is the misprint.
- `PULL_MIN` (default 2.4). The shortest time a sheet stays on the press, in seconds.
- `PULL_MAX` (default 4.6). The longest time a sheet stays on the press, in seconds.
- `PARALLAX_OUTLINE` (default 9). How far a full tilt slides the outline plane.
- `FONT_VAR` (default --visual-grotesk). The CSS variable holding the font family. Any bold grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
