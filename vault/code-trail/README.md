# Code trail

A staircase of code fragments on clashing coloured bars that trails the pointer.

Code fragments on brightly coloured bars stacked into a staircase across a pale grey card.

See it live at [design.how/vault/code-trail](https://design.how/vault/code-trail).

## How it works

Rows flow, they never swap. A row is born at the head with its own text and colours, keeps them for its life, moves one slot down each time a new row is born, and is dropped at the tail.

## Install

```bash
npx skills add https://design.how/vault/code-trail
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-mono`, a system stack in `fonts.css` (ui-monospace, monospace). Put your own face first.

## Knobs

- `GROUND` (default #f7f7f7). The card colour behind the ribbon.
- `FONT_VAR` (default --visual-mono). The CSS variable holding the monospace family.
- `ROWS` (default 22). How many rows are alive. Raise it with the fade start in presence() or the extra rows are invisible.
- `CHASE` (default 0.24). How much of the gap every row closes per frame. Higher is snappier.
- `MIN_TRAVEL_RATIO` (default 0.055). Head travel, as a share of the width, before a new row is born.
- `FRAGMENTS` (default 51 shader and script snippets). The text on the bars, in fragments.ts, each tagged with what it needs on its left and leaves on its right.
- `PAIRS` (default 12 saturated pairs). The background and text colours, in palette.ts, ordered so neighbours clash.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
