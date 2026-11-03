# Roll type

Three short phrases taking turns, every word rolling up out of sight through glass as the next phrase rolls in under it.

Three short phrases taking turns on ultramarine, vermilion and black, their words bending through glass as they roll up and out and the next ones roll in.

See it live at [design.how/vault/roll-type](https://design.how/vault/roll-type).

## How it works

Words move one at a time, 100ms apart in reading order. A leaving word goes on its first frame: its ink centre rises to y 94 over 280ms and it folds flat over the last 120ms, its top leaning toward the centre line as if it turned away on a drum.

## Install

```bash
npx skills add https://design.how/vault/roll-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `DEFAULT_PHRASES` (default three phrases on ultramarine, vermilion and black). The phrases, one or two lines of words each, with a ground, an ink and two fringe hues per phrase.
- `STAGGER_MS` (default 100). The delay between one word and the next.
- `PHRASE_MS` (default 2080). Time from one phrase leaving to the next.
- `GLASS_SPEED` (default 26). The speed, in scene pixels a frame, at which the glass is at full strength.
- `LENS` (default 0.22). How much the glass rod magnifies a moving word's middle. 0 turns the bend off.
- `FRINGE` (default 3.5). How far the two hues split along the motion at full speed. 0 turns the fringe off.
- `FONT_WEIGHT` (default 500). The weight the face is drawn at.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
