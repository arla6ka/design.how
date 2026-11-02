---
name: code-trail
description: Builds a DOM cursor trail in which short code fragments on brightly coloured bars stack into a leftward staircase that chases the pointer, each row easing toward the row above it, with an autonomous steering drift when nobody is pointing. Use when someone asks for a cursor trail, a code-themed hero, a pointer-following stack, a playful developer page header, or coloured tags that follow the mouse.
---

# Code trail

A staircase of code fragments on clashing coloured bars that trails the pointer. See it live at https://design.how/vault/code-trail.

## What to build

A pale grey card holds a ribbon of 22 thin horizontal bars, each a row of one to three code fragments set in a monospace face on saturated colour. The rows step one bar-height down and 1.4 bar-heights left of the row above, so the ribbon is a staircase at about 35 degrees whose head sits at the pointer. The head row carries one fragment, the next two, every other row three, and the last third of the ribbon fades and desaturates into the card.

Rows flow, they never swap. A row is born at the head with its own text and colours, keeps them for its life, moves one slot down each time a new row is born, and is dropped at the tail. Each row eases toward a fixed offset from its parent at one shared rate of 0.24 per frame, so the stack holds one rigid shape in steady travel and drags through a turn. A new row is born after the head has travelled 5.5 percent of the card width, never on a timer, so a still pointer stacks nothing and a fast sweep lays a longer ribbon.

The colour is in the pairs. Twelve background and text pairs are both saturated, orange on lavender or yellow on navy, and a stepper walks them with a stride of 5 so neighbours always clash. Every seventh badge is underlined and every nineteenth breaks the set in black or white. Fragments come from a shuffled bag of 51 and are chained so a piece that leaves an open expression is followed by one that closes it, and a comment ends its row.

With no pointer, the head is a steered point that never stops: it moves at 0.34 px per ms and turns its heading toward a wandering target, re-aiming at the centre once it is within a fifth of an edge, so the ribbon banks through long arcs instead of zigzagging. On a card smaller than 528 by 243 the speed drops and the turn quickens in proportion, so the point never outruns its own turn.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/code-trail/`. It is React and TypeScript: `params.ts`, `fragments.ts`, `palette.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-mono` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/code-trail` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Render each row as real elements: a flex row of spans, padded by 0.12 of the font size, bars exactly 1.24 font sizes tall so they touch.
- Split each row at its anchor into a right-aligned half that grows left and a half that grows right, so the loop never measures text.
- Keep the rows head-first; each frame, ease the head toward the pointer or the drift and every other row toward its parent minus one step left and one bar down.
- Push a new row at the head whenever the head has moved MIN_TRAVEL_RATIO of the width since the last push, advancing every slot and dropping the tail.
- Write transform, opacity, saturation and z-index straight to each element from the loop; React only re-renders when a row is born.
- Show one badge at the head, two in the second row and three after, and fade presence over the last 38 percent of the ribbon.
- Under reduced motion, lay the full staircase once along the card's diagonal and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `GROUND` | #f7f7f7 | The card colour behind the ribbon. |
| `FONT_VAR` | --visual-mono | The CSS variable holding the monospace family. |
| `ROWS` | 22 | How many rows are alive. Raise it with the fade start in presence() or the extra rows are invisible. |
| `CHASE` | 0.24 | How much of the gap every row closes per frame. Higher is snappier. |
| `MIN_TRAVEL_RATIO` | 0.055 | Head travel, as a share of the width, before a new row is born. |
| `FRAGMENTS` | 51 shader and script snippets | The text on the bars, in fragments.ts, each tagged with what it needs on its left and leaves on its right. |
| `PAIRS` | 12 saturated pairs | The background and text colours, in palette.ts, ordered so neighbours clash. |
| `--visual-mono` in fonts.css | ui-monospace, monospace | The typeface for this role, a monospace face. Put the project's face first. |
