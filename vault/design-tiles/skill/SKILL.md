---
name: design-tiles
description: Builds an SVG typographic bar in which each word of a lowercase sentence sits on a bold colour field made of one measured rect per letter, so the field steps to each glyph's real height, the words flying in one by one and then shuffling through a vivid palette with no two words ever sharing a colour, and hovering a word re-rolls it. Use when someone asks for highlighted words, a colour-blocked headline, a bold identity-style type bar, text on coloured tiles, or a playful word shuffle.
---

# Design tiles

A short sentence as words on bold colour fields, packed into one bar, each field stepped to its letters. See it live at https://design.how/vault/design-tiles.

## What to build

Five lowercase words, "type finds its own shape", sit in one horizontal bar across the middle of the card, the words about 9 percent of the card width tall. Each word is on its own saturated field, black, red, lilac, green and violet to start, with white or near-black type chosen per colour, and the fields touch so the bar reads as one strip.

A field is not a rectangle. Each letter gets its own rect hugging that glyph's real painted height, padded 6 units at a 100-unit font size, and neighbouring rects touch, so a word's field steps up for ascenders, down for descenders and splits around the dot of an i. Font metrics cannot give those bounds, so each glyph is rasterised alone on a canvas and its alpha scanned for the top and bottom painted rows. Every word shares one vertical band in its viewBox, so they scale alike and sit on one baseline.

When the card comes into view the words reveal one by one, 130 ms apart, each slot growing from zero width over 760 ms with an expo-out curve while the word fades in. Then each word re-rolls its colour on its own timer every 1.3 to 3.2 seconds, cross-fading over 520 ms and never taking a colour another word has. Hovering a word re-rolls it at once, and hovering a letter grows that letter's rect by about 2 screen pixels.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/design-tiles/`. It is React and TypeScript: `params.ts`, `measure.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-display` and `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/design-tiles` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise each glyph alone at a 100 px reference size and scan its alpha for the tight top and bottom; take horizontal positions from measureText advances.
- Build one SVG per word: a rect per letter from its bounds plus padding, spanning to the next glyph's left edge, then the word on top.
- Give every SVG the same viewBox band above and below the baseline, and size them by one CSS height so they share a baseline.
- Reveal each word by transitioning its grid slot from 0fr to 1fr, staggered, and fade the SVG in.
- Re-roll a word's colour from the swatches no other word is using, on a random timer and on hover; transition fill.
- Wait for the face (at most 1.5 s) before measuring for the fly-in. Under reduced motion, show the assembled bar without transitions.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | type, finds, its, own, shape | The sentence, one entry per tile. |
| `SWATCHES` | nine vivid fields, each with its type colour | The palette. Keep more swatches than words. |
| `INITIAL` | black, red, lilac, green, violet | The colours before the first shuffle. |
| `SHUFFLE_MIN, SHUFFLE_MAX` | 1300, 3200 | The range of each word's re-roll timer, in ms. |
| `FLY_STAGGER, FLY_MS` | 130, 760 | The gap between words revealing and the glide's length. |
| `WORD_HEIGHT` | 9cqw | The words' height, relative to the card width. |
| `FONT_STACK` | --visual-display, then --visual-sans | The face. Any medium-weight display face works. |
| `--visual-display` in fonts.css | Georgia, serif | The typeface for this role, a display face. Put the project's face first. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
