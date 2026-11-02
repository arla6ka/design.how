# Flip type

One bold word that keeps becoming the next, each letter falling to a new row through a few random glyphs.

One bold word in butter yellow on midnight indigo, resting on the top row.

See it live at [design.how/vault/flip-type](https://design.how/vault/flip-type).

## How it works

Every letter travels on its own. Its height between two rows is one curve, cubic-bezier(1, 0, 0, 1) over a span of frames, so it leans for a long time, crosses the gap in a frame or two and eases onto the new row.

## Install

```bash
npx skills add https://design.how/vault/flip-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `GROUND` (default #171a3a). The background colour.
- `INK` (default #ffd76a). The type colour.
- `PLAY_RATE` (default 1.15). Playback speed over the 30fps timeline. 1.15 gives a 5.1 second loop.
- `BREATH` (default {px: 3, frames: 8}). The lift against the travel before a letter drops.
- `BOUNCE` (default {px: 5, tau: 3.2, period: 9}). The overshoot past the row when a letter lands.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. The pens in PENS were measured from a grotesque at 600, so a different face needs them measured again.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
