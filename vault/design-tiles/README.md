# Design tiles

A short sentence as words on bold colour fields, packed into one bar, each field stepped to its letters.

The words type finds its own shape on black, red, lilac, green and violet fields, joined into one stepped bar.

See it live at [design.how/vault/design-tiles](https://design.how/vault/design-tiles).

## How it works

A field is not a rectangle. Each letter gets its own rect hugging that glyph's real painted height, padded 6 units at a 100-unit font size, and neighbouring rects touch, so a word's field steps up for ascenders, down for descenders and splits around the dot of an i.

## Install

```bash
npx skills add https://design.how/vault/design-tiles
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-display` and `--visual-sans`, a system stack in `fonts.css` (Georgia, serif; system-ui, sans-serif). Put your own face first.

## Knobs

- `WORDS` (default type, finds, its, own, shape). The sentence, one entry per tile.
- `SWATCHES` (default nine vivid fields, each with its type colour). The palette. Keep more swatches than words.
- `INITIAL` (default black, red, lilac, green, violet). The colours before the first shuffle.
- `SHUFFLE_MIN, SHUFFLE_MAX` (default 1300, 3200). The range of each word's re-roll timer, in ms.
- `FLY_STAGGER, FLY_MS` (default 130, 760). The gap between words revealing and the glide's length.
- `WORD_HEIGHT` (default 9cqw). The words' height, relative to the card width.
- `FONT_STACK` (default --visual-display, then --visual-sans). The face. Any medium-weight display face works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
