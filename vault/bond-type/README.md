# Bond type

Two words in a pixel face that unfold into a molecule, pixel bonds joining each letter to the next.

The words Atoms and Bonds, typeset in a white pixel face on bright red.

See it live at [design.how/vault/bond-type](https://design.how/vault/bond-type).

## How it works

The motion is keyposes, not a wobble. Six scatter poses each put the two lines on different contours, an arc, a vee, a tilt, a wave or a step, with the first line lifting above its baseline and the second sinking below, so the lines never cross and every letter stays 70px inside the frame.

## Install

```bash
npx skills add https://design.how/vault/bond-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-pixel`, a system stack in `fonts.css` (ui-monospace, monospace). Put your own face first.

## Knobs

- `LINES` (default ["Atoms", "Bonds"]). The two words. The pose tables are set for five letters a line.
- `GREEN` (default #f5333f). The field colour.
- `WHITE` (default #fdfefd). The type and the bonds.
- `FPS` (default 32). Ticks a second the timeline plays at.
- `SCATTERS_MIN` (default 2). The fewest poses a cycle runs through.
- `SCATTERS_MAX` (default 4). The most poses a cycle runs through.
- `BOND_WEIGHT_CELLS` (default 2). Bond thickness in cells; two is one font pixel.
- `FONT_VAR` (default --visual-pixel). The CSS variable holding the font family. It must be a bitmap pixel face.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
