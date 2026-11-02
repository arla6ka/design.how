# Swing type

Huge letters swinging past a fixed window, turning edge-on so the word never assembles.

A large red P at full face in the middle of a white field, the next letter squashed to an orange sliver beside it.

See it live at [design.how/vault/swing-type](https://design.how/vault/swing-type).

## How it works

The one law is that rotation is proportional to screen x, about 0.44 cap heights per radian, not a cylinder. Each letter is drawn as a parallelogram, an affine transform of a pre-rendered glyph bitmap, so one drawImage reproduces it with no slicing and no WebGL.

## Install

```bash
npx skills add https://design.how/vault/swing-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORDS` (default ["Pivot", "Swing", "Turns", "Angle"]). The words, cycled. Every word must have the same number of letters.
- `INK` (default ["#F0413B", "#E88500", "#0FA3A3", "#2F6BE0", "#7A3BD6"]). One colour per letter slot, left to right.
- `BG` (default #FFFFFF). The field.
- `PERIOD` (default 2.0). One full swing, in seconds.
- `DETENT` (default 0.7). How hard the row clicks from letter to letter. Keep it below 1.
- `CAP_FRAC` (default 0.46). Cap height as a fraction of the card height.
- `WORD_SECONDS` (default 3). How long each word holds before the next.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. A plain grotesque with a heavier cut works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
