---
name: stack-type
description: Builds kinetic typography on Canvas 2D in which one line of capitals is stacked nine rows deep and every letter is its own column, each column's top and foot stepping a row at a time toward the middle on its own beat until one line is left, holding, then refilling outward on the same beat run backward, the rows wrapped on a shallow drum, outlined away from the solid middle row and scrambling to other capitals toward the rim. Use when someone asks for stacked or repeated text, a collapsing or draining headline, stepped or staccato type motion, a letter-by-letter cascade, split-flap or scrambled letters, outlined echo type, or a looping title made of one line.
---

# Stack type

One line of capitals stacked nine deep on a drum, every letter draining to the one solid row on its own beat while the outlined echoes scramble. See it live at https://design.how/vault/stack-type.

## What to build

One line of capitals is set nine times, one row under the next, on a 1200 by 675 scene, 16:9, scaled to the box as one unit. It is set at medium weight with caps 58 scene pixels tall and rows 67.625 apart, the middle row centred. Then the whole stack is scaled about its middle row until the line's ink runs to 24 pixels from each side, or until the outer rows come within 16 pixels of the top and foot, whichever is first.

Every letter is its own column, and a column is always one unbroken run of rows. Its top steps down a row four times and its foot steps up a row four times, each on its own 40ms key, until only the middle row is left. Steps fall two to four keys apart, a little slower as the column closes, and each column starts between key 1 and key 11, so the stack drains unevenly from both ends. It holds as one line, then each end steps back out four times, on nearly the same keys mirrored about key 24.5, and the loop closes on the full stack after 48 keys, 1.92 seconds.

A step is a whole row, all at once, and nothing in the columns moves between keys. There are twenty tracks, one per letter in reading order, cycling for a longer line, and spaces take room but no column, so any text works.

Three treatments mark the middle row as the real one. The rows wrap a still drum seen front on, 0.28 radians a row apart, so they close up, flatten, fade by up to 45% and narrow by up to 35% toward the rim, with the solid row centred. The drum never turns, so the only motion is the beat. Every row but the middle is a 1.6 pixel stroke. A cell away from the middle may show another capital, more often the further out it is (85% on the outer rows), picked by a hash of its column, row and beat so it holds for 240ms, and squeezed to the width of the letter it stands in for.

The pattern rotates. At every hold, when every column is one row, each letter moves seven places along the twenty tracks, so twenty loops pass before one drains like another. Given several phrases, the line changes at the same moment, key 24, so each refill grows out of the next phrase and its colours.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/stack-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/stack-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the font so a capital is 58 scene pixels tall, and place each letter at its pen in the centred line, from the live face.
- Scale the stack about its centred middle row so the line's ink runs to 24 pixels from each side, unless that would bring the outer rows within 16 pixels of the top or foot.
- Give the n-th letter, not counting spaces, the n-th of twenty tracks: the keys its top steps down and back up on, and the keys its foot steps up and back down on.
- At each 40ms key, count the steps each end has taken, and draw the letter in every row from its top to its foot, nine rows 67.625 apart.
- Place each row on a still drum, 0.28 radians a row from the centred middle: move it to the radius times the sine, scale its height by the cosine, narrow and fade it with the tilt.
- Draw the middle row solid and every other row as a stroke; away from the middle, swap a cell to a hashed capital, squeezed to the letter's width, with a chance that grows to 85% at the rim.
- At every hold, move each letter seven places along the tracks. Paint only when the key changes; loop after 48 keys.
- Under reduced motion, draw key 9, the stack half drained, once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `DEFAULT_TEXT` | "DESIGN FOR AGENTS" | The line. Capitals read best; it is scaled to the width, so a shorter line is set bigger, until the rows reach the top and foot. |
| `DEFAULT_GROUND` | #e7e0ff | The ground colour. |
| `DEFAULT_INK` | #3a12ff | The letters' colour. |
| `KEY_MS` | 40 | One step's length. The loop is 48 keys. |
| `DEFAULT_LOOK` | drum, outline and scramble | Which treatments the rows get. Any mix works; none gives the flat stack. |
| `DRUM_STEP` | 0.28 | How far round the drum each row sits, in radians. Higher curves it harder. |
| `SCRAMBLE` | 0.85 | The chance an outer row's cell shows another capital. |
| `SCRAMBLE_KEYS` | 6 | How many 40ms keys a stand-in capital holds before it changes. |
| `TRACKS` | twenty measured beats | When each column's top and foot step, in keys. Shift a track's keys to change when that letter drains. |
| `FONT_WEIGHT` | 500 | The weight the face is drawn at. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
