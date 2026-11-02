# Ink flood

A pen writes a fat scribble, the scribble floods the frame, and its ink becomes the ground the next one is written on.

A thick near-black scribble of three humps on a pale field, under a fine dot screen.

See it live at [design.how/vault/ink-flood](https://design.how/vault/ink-flood).

## How it works

The stroke is the pen's trail, not a path being revealed. The ink is every round dab the pen has laid so far, stamped along a centreline whose samples each carry a local half-width and the frame they were laid.

## Install

```bash
npx skills add https://design.how/vault/ink-flood
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `scene` (default DEFAULT_SCENE). Which Scene the card plays. MEASURED, GRAPHITE, SULPHUR and TIDE ship; a new look is a new Scene, never an engine change.
- `palette.fields, palette.dot` (default #fafafa, #111111, #8c8c8c). The two fields that trade places, and the pen. The dot must read on both fields.
- `generateSpine options` (default humps 3, amplitude 0.2, crestR 22, valleyR 46). The shape of an authored scribble: hump count, height and stroke radius at crests and valleys.
- `HALFTONE_DEFAULTS` (default pitch 5, radius 1.6, alpha 0.12). The print screen. Alpha 0 turns it off.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
