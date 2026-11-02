# Cursors

Three labelled collaborator cursors orbit a frosted-glass word and scatter from your pointer.

The word Multiplayer in frosted glass with three coloured, labelled cursors around it.

See it live at [design.how/vault/cursors](https://design.how/vault/cursors).

## How it works

Each cursor rides its own ellipse around a centre spread across the card, alternating high and low, with radii of about a sixth of the width and a fifth of the height, phase-shifted by a third of a turn and running at 0.5, 0.68 and 0.86 times a shared clock, with the vertical term at 1.15 times the horizontal so the loops never close into circles. Each eases 12 percent of the way to its target per frame.

## Install

```bash
npx skills add https://design.how/vault/cursors
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `CURSORS` (default Wexel, Orbo and Visitor in indigo, red and green). The collaborators: names and colours.
- `WORD` (default "Multiplayer"). The frosted word in the middle.
- `GROUND` (default #fcfcfc). The card colour, also the glow behind the word.
- `INK` (default #1b1b1b). The word's colour.
- `WORD_FONT` (default ui-serif, Georgia, serif). The word's family.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the name tags' family.
- `DESIGN_WIDTH` (default 600). The card width the cursor sizes and orbits are tuned at.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
