# Glitch word

A word in a bright badge that tears into shoved bands in short bursts.

The word glitching in white on a small green badge, centred on a pale grey card.

See it live at [design.how/vault/glitch-word](https://design.how/vault/glitch-word).

## How it works

The tear is ten identical copies of the badge and the word stacked in one grid cell over the original. Each copy is clipped to a band by clip-path and shoved by a transform, so the coloured block and the glyphs move together.

## Install

```bash
npx skills add https://design.how/vault/glitch-word
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-grotesk`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORD` (default "glitching"). The word that tears.
- `LAYERS` (default 10). How many copies are stacked. Keep it at least the largest sliceCount.
- `IDLE` (default 1800ms cycle, 7 slices, 20% shove). The resting burst preset.
- `ACTIVE` (default 340ms cycle, 10 slices, 38% shove). The preset under the pointer.
- `WORD_SIZE` (default 5.7). The word size in cqw of the card. The badge is sized in em, so it follows.
- `GREENS` (default #1aa251 and three neighbours). The stops the badge colour drifts through.
- `GROUND` (default #f7f7f7). The card colour.
- `FONT_VAR` (default --visual-grotesk). The CSS variable holding the word's family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
