# AI lights

One body that becomes four agent UI components in turn, each announced by a pulse of light around its rim.

A white rounded component showing a three-step workflow on a pale blue card, a band of blue to magenta light on its rim.

See it live at [design.how/vault/ai-lights](https://design.how/vault/ai-lights).

## How it works

The glow is a conic gradient, seen through a mask. The gradient packs its five colours into about 84 degrees of the circle, so it reads as a travelling comet, not a spinning disc, and its start angle and stops animate through registered custom properties over 1.6 seconds.

## Install

```bash
npx skills add https://design.how/vault/ai-lights
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans` and `--visual-mono`, a system stack in `fonts.css` (system-ui, sans-serif; ui-monospace, monospace). Put your own face first.

## Knobs

- `VARIANTS` (default chain, progress, terminal, prompt). The components, each its contents, a corner radius and a padding.
- `PULSE_MS` (default 1600). One pulse of light. Keep the CSS animation in step.
- `MORPH_MS, FADE_OUT_MS, SETTLED_MS` (default 380, 160, 260). The handover's beats; the gap between pulses is derived from them.
- `RIM_LAYERS` (default a 1 px ring and four blurred strokes). The glow's falloff.
- `RIM_STOPS` (default lit from 347 round to 54 degrees). How much of the rim can light.
- `ARC_MIN, ARC_MAX` (default 90, 190). How far round the wheel each pulse's palette walks.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
