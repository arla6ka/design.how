# Dash cascade

Three-letter words built from fat scanline dashes, unfurling out of a dotted line and folding back.

The word LOL built from fat yellow scanline dashes on white, at full width.

See it live at [design.how/vault/dash-cascade](https://design.how/vault/dash-cascade).

## How it works

The choreography is delays, not motion. Every dash plays one 25-entry excursion waveform, a rise over about six frames, a plateau of five at full width, a symmetric fall and a rest, shifted in time by a law per letter.

## Install

```bash
npx skills add https://design.how/vault/dash-cascade
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `WORDS` (default LOL, ART, TRY, TOY as dash runs). The words. Each must use the same ten rows and three letter zones.
- `INK` (default #f2c94c). The base yellow the hue field turns around.
- `BG` (default #ffffff). The field.
- `HUE_SPREAD_DEG` (default 14). Total hue travel across the field, peak to peak.
- `HUE_DRIFT_S` (default 60). Seconds for the base wave to drift one cycle.
- `FPS` (default 10). The stepped frame rate of the cascade.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
