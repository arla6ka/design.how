---
name: warp-type
description: Builds kinetic typography on Canvas 2D in which each sentence's verb deforms its own letters, with a swelling wave, a stair of echoes, lines that fall together, a turn, a fold and a letter sort, cut hard every half second. Use when someone asks for animated type, a typographic loop, a hero headline that moves, or text that acts out what it says.
---

# Warp type

Six short sentences, half a second each, where the verb bends its own letters. See it live at https://design.how/vault/warp-type.

## What to build

Six sentences take turns on a 1080 by 608 scene, 16:9, scaled to the box as one unit. Each holds for about half a second and cuts hard to the next. Every sentence is "Design" plus a verb and a noun, set centred at one size in a grotesque at medium weight, pale mint on a deep sea green.

The sentence never changes once it is on screen. The verb changes what happens to it. In the first the letters swell and shrink along a wave. In the second the last word leaves a stair of smaller copies behind it. In the third three lines fall together and close up. In the fourth the two lines turn against each other. In the fifth each word turns on its own centre, a hinge at the gap. In the sixth neighbouring letters swap places in three rounds.

Every glyph is one fillText under its own affine matrix, and nothing is pre-rendered. The motion is authored as 75 keys at 25 frames a second, three seconds a loop, and read at a fractional key every animation frame, so it plays smooth at the screen's rate while the six cuts land on whole keys.

The lines are laid out from the live font at mount: pens from the widths of each prefix, so kerning is the face's own, and ink boxes from measureText. Any six sentences of one to three lines work, because the tables describe the deformation along a line, not the letters.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/warp-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/warp-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Lay each phrase out at rest from the live face: measure every prefix for the pens and every glyph for its ink box.
- Give every glyph a 2D affine matrix per key, from the scene's table, and draw it with one fillText under that matrix.
- Read the clock as elapsed / 40ms mod 75 and draw at the fractional key; cut scenes at keys 0, 13, 25, 38, 50 and 63.
- For the wave, sample six smooth curves along the line for x scale, y scale, rotation, skew and drift, all about the glyph's foot.
- For the sort, derive the swapped pairs from the phrase, then hop one letter of each pair and slide the other over four keys.
- Under reduced motion, draw key 12 once: the wave at full swell.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `DEFAULT_PHRASES` | six "Design + verb + noun" lines | The sentences. Six scenes of one to three lines; the third scene takes three. |
| `GROUND` | #0b1a1f | The background colour. |
| `INK` | #d9f5ea | The type colour. |
| `FONT_WEIGHT` | 500 | The weight the face is drawn at. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
