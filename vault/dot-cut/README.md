# Dot cut

A dense grid of touching circles with a letter or a pattern cut out of it as negative space.

A capital A cut out of a grid of touching pale blue circles on a deep blue ground.

See it live at [design.how/vault/dot-cut](https://design.how/vault/dot-cut).

## How it works

Nothing is drawn on top. A symbol is a hole: where the glyph covers a cell, that circle is removed and the flat background shows through.

## Install

```bash
npx skills add https://design.how/vault/dot-cut
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `SCENES` (default A, rings, columns, checker, boxes, bars). What is carved, how it arrives, its palette and its ring pattern. A text scene takes any glyph.
- `PALETTES` (default six pairs, the first #8aa9ff on #1f45f5). Circle and background colours. The background is also the symbol.
- `DEFAULTS.cols` (default 42). Circles across. Fewer is chunkier; past about 38 the dots start reading as a halftone.
- `DEFAULTS.hold, DEFAULTS.morph` (default 600, 520). Milliseconds each scene holds and each change takes.
- `DEFAULTS.fill` (default 1). Circle diameter as a fraction of the pitch. Keep it at 1 so the circles touch.
- `DEFAULTS.brush` (default 1.6). The pointer's erase radius, in cells. 0 turns it off.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the glyph's font family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
