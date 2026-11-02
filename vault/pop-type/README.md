# Pop type

Motion drops in letter by letter, squashes as it lands, swells like a balloon and pops.

The word Motion in chunky cobalt letters with a coral drop shadow on white.

See it live at [design.how/vault/pop-type](https://design.how/vault/pop-type).

## How it works

Everything is a law of time in milliseconds, not a table, but the picture is read at the start of each 100ms frame and held, so a 2.6 second run plays as 26 flipbook frames and a squash is one held picture rather than a blur. The drop is gravity: each letter falls from 250px above the frame at 2600 px/s² and lands at 400, 500, up to 900ms, left to right.

## Install

```bash
npx skills add https://design.how/vault/pop-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `PALETTE` (default six face and shadow pairs, cobalt on coral first). The colour pairs, one per run, in turn.
- `GROUND` (default #ffffff). The background colour.
- `WORD` (default ["M", "o", "t", "i", "o", "n"]). The word, one glyph per entry. CONTACT_MS needs one landing time per letter.
- `CONTACT_MS` (default [400, 500, 600, 700, 800, 900]). When each letter lands, in milliseconds into the run.
- `SQUASH` (default 0.68). How flat a letter gets on landing.
- `SWELL_PEAK` (default 0.34). How far the word inflates before it pops.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any heavy grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
