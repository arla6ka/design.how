# Word carousel

Four words on a three-slot conveyor that slams one slot left every half second, with a fourth hidden tiny behind the big one.

The words Motion, Type and Grid in blue on white, small, large and small on one line.

See it live at [design.how/vault/word-carousel](https://design.how/vault/word-carousel).

## How it works

Every word hangs from one optical middle. Its baseline sits half a cap height below the card's centre at its own scale, so three sizes read as one quiet line.

## Install

```bash
npx skills add https://design.how/vault/word-carousel
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `WORDS` (default Type, Grid, Color, Motion). The four words. Exactly four, one per role.
- `INK, INK_FAR` (default #002fa7, #7fb2ff). The centre tone and the tone at the small slots.
- `BG` (default #ffffff). The ground.
- `FONT_FAMILY` (default sans-serif). The family the words are drawn in. Any plain grotesque works.
- `SCALE_SMALL, SCALE_TINY` (default 0.35, 0.145). The side words and the hidden word, as fractions of the big word.
- `TINY_ALPHA` (default 0.4). How much the hidden word shows through the big one.
- `BLUR_STAMPS_MIN, BLUR_STAMPS_MAX` (default 4, 18). The range of stamps per moving word.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
