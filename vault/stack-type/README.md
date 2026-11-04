# Stack type

One line of capitals stacked nine deep on a drum, every letter draining to the one solid row on its own beat while the outlined echoes scramble.

Violet capitals on pale lilac stacked nine deep on a shallow drum, one solid line in the middle and outlined echoes above and below that scramble into other letters, each column shrinking to the one line at its own pace and growing back.

See it live at [design.how/vault/stack-type](https://design.how/vault/stack-type).

## How it works

Every letter is its own column, and a column is always one unbroken run of rows. Its top steps down a row four times and its foot steps up a row four times, each on its own 40ms key, until only the middle row is left.

## Install

```bash
npx skills add https://design.how/vault/stack-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `DEFAULT_TEXT` (default "DESIGN FOR AGENTS"). The line. Capitals read best; it is scaled to the width, so a shorter line is set bigger, until the rows reach the top and foot.
- `DEFAULT_GROUND` (default #e7e0ff). The ground colour.
- `DEFAULT_INK` (default #3a12ff). The letters' colour.
- `KEY_MS` (default 40). One step's length. The loop is 48 keys.
- `DEFAULT_LOOK` (default drum, outline and scramble). Which treatments the rows get. Any mix works; none gives the flat stack.
- `DRUM_STEP` (default 0.28). How far round the drum each row sits, in radians. Higher curves it harder.
- `SCRAMBLE` (default 0.85). The chance an outer row's cell shows another capital.
- `SCRAMBLE_KEYS` (default 6). How many 40ms keys a stand-in capital holds before it changes.
- `TRACKS` (default twenty measured beats). When each column's top and foot step, in keys. Shift a track's keys to change when that letter drains.
- `FONT_WEIGHT` (default 500). The weight the face is drawn at.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
