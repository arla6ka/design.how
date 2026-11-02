---
name: flip-type
description: Builds a kinetic word swap on Canvas 2D in which one bold word becomes the next letter by letter, each letter hanging, then snapping to another row on a cubic-bezier(1, 0, 0, 1) curve while its glyph flips through a few random letters, middle letters first, with a breath before the drop and a bounce on landing. Use when someone asks for a split-flap or departure-board word change, letters that shuffle into a new word, a rotating headline, or type that falls between rows.
---

# Flip type

One bold word that keeps becoming the next, each letter falling to a new row through a few random glyphs. See it live at https://design.how/vault/flip-type.

## What to build

Four words take turns on a 1080 by 810 scene, 4:3, scaled to the box as one unit: Letterform, Alignments, Hierarchies and Kerning, in a ring. Each word sits on its own row, top, middle, bottom, then middle again, set centred at a 197px em in a grotesque at semibold, butter yellow on midnight indigo. Letterform rests the longest; the other three barely settle before the next fall starts.

Every letter travels on its own. Its height between two rows is one curve, cubic-bezier(1, 0, 0, 1) over a span of frames, so it leans for a long time, crosses the gap in a frame or two and eases onto the new row. The centres of those crossings form a V from the middle letter outward, two or three frames apart, so the word tears from the middle and the ends catch up. During a move a slot can hold two letters at once, the old one still leaving while the new one arrives.

X never moves. Each letter is drawn at its word's pen, from the face's own advances and kerning, and the glyphs it flips through on the way ride at that pen. The flips are a table, up to eight random letters held one to three frames, with capitals for a capital slot. Before a drop the letter lifts three pixels against its travel over eight frames; on landing a damped sine takes it five pixels past the row and back in about ten frames, sized per letter so no two land alike.

The motion is authored as 176 frames at 30 frames a second and played at 1.15 times, a 5.1 second loop, as held frames, so the snap keeps its stepped bite and the canvas repaints only when the frame index changes. The pointer pokes a resting letter: it flips through two strangers, two frames each, and comes back as itself.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/flip-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 4 / 3, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/flip-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Centre each word as a whole and store every letter's pen x and advance, measured from the face with kerning on; draw with kerning off at those pens.
- Give every letter a chain of keys: the centre of its arrival, the frame it lands, the frame it leaves, the centre of its departure, and the frames it shows and hides.
- Move a letter between rows with cubic-bezier(1, 0, 0, 1) over twice the gap between its centre and its knot; never move it in x.
- Add a breath (a half sine against the travel over eight frames after leaving) and a bounce (a damped sine past the row after landing), each scaled 0.75 to 1.25 per letter.
- Swap the glyph from a per-letter flip table while it arrives or leaves; a "." is a blank frame.
- Read the clock as floor(elapsed / FRAME_MS) mod 176 and paint only when that frame changes.
- Under reduced motion, draw frame 0 once: the first word at rest on the top row, with no poke.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `GROUND` | #171a3a | The background colour. |
| `INK` | #ffd76a | The type colour. |
| `PLAY_RATE` | 1.15 | Playback speed over the 30fps timeline. 1.15 gives a 5.1 second loop. |
| `BREATH` | {px: 3, frames: 8} | The lift against the travel before a letter drops. |
| `BOUNCE` | {px: 5, tau: 3.2, period: 9} | The overshoot past the row when a letter lands. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. The pens in PENS were measured from a grotesque at 600, so a different face needs them measured again. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
