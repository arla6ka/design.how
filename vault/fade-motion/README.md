# Fade motion

A pixel word trailing into light, its fade built from two hundred overlapping copies.

The word motion in a pixel face, glowing, with a long fading trail of light falling away beneath it.

See it live at [design.how/vault/fade-motion](https://design.how/vault/fade-motion).

## How it works

Nothing is blurred. The trail is accumulation: after k overlapping copies at alpha a, coverage is 1 - (1 - a)^k, which falls fast and then leaves a long tail, and that law is the whole look.

## Install

```bash
npx skills add https://design.how/vault/fade-motion
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-pixel`, a system stack in `fonts.css` (ui-monospace, monospace). Put your own face first.

## Knobs

- `WORD` (default motion). The word. Short and lowercase reads best; descenders give the trail something to start from.
- `DEFAULTS.echoes, DEFAULTS.step` (default 210, 1.0). How many copies build the trail and how far apart they sit. Past about 2 px they stop overlapping and read as ghosts.
- `DEFAULTS.alpha` (default 0.019). Per-copy opacity. The trail builds from overlap, so keep it low.
- `DEFAULTS.angle` (default Math.PI / 2). The trail direction. Straight down by default.
- `DEFAULTS.hueShift` (default 26). How far the hue drifts from the word to the tail, in degrees.
- `DEFAULTS.turbulence, DEFAULTS.spread` (default 16, 0.22). How much the tail wavers, and how much each copy widens as it falls.
- `DEFAULTS.fringe` (default 0.045). Per-channel offset at the thin end of the trail. Above about 0.1 it reads as a mistake.
- `PALETTES` (default seven presets, add or subtract). The colour worlds the card washes between. A light preset must use subtract mode.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
