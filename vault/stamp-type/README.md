# Stamp type

Four lines on highlight bars hop in, park and scatter, each leaving blocks of flat colour behind.

Four lines of black type on spring-green highlight bars, parked on an electric blue field.

See it live at [design.how/vault/stamp-type](https://design.how/vault/stamp-type).

## How it works

The choreography is data: four fixed tracks of breakpoints, each a frame and the line's top-left, linearly interpolated, every hop moving along one axis only, never diagonal. The jagged pacing inside a hop is the easing; a smooth curve reads worse.

## Install

```bash
npx skills add https://design.how/vault/stamp-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORLDS` (default five worlds, each a field, a bar, an ink and four lines). The palettes and the words. Keep the field and bar far apart in hue and value, and the ink near black or white.
- `PARK_FRAMES` (default 48). How long the four lines sit still to be read.
- `STAMP_TTL` (default 16). How long a trail stamp lives, in frames.
- `PASS_OVERLAP` (default 12). How far the next pass overlaps the last; more gives a denser flood.
- `CONDENSE_MIN` (default 0.72). The narrowest a long line may be condensed.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any semibold grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
