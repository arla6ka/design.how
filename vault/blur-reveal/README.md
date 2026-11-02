# Blur reveal

Coloured panels in turn, each short line dissolving in out of a blur and drifting into focus.

A short lowercase line on a bold coloured panel, dissolving in from a cloudy blur.

See it live at [design.how/vault/blur-reveal](https://design.how/vault/blur-reveal).

## How it works

The reveal is one fragment shader over the line drawn to a canvas texture. Each pixel gets a front position from a domain-warped four-octave noise field mixed 70 to 30 with its distance from a centre that wanders per panel.

## Install

```bash
npx skills add https://design.how/vault/blur-reveal
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-wide`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `PANELS` (default six lines, each with bg and fg). The lines and their colour pairs, in order.
- `HOLD_MS` (default 900). How long a resolved line holds before it leaves.
- `BG_MS` (default 320). The background cross-fade between panels.
- `MAX_BLUR` (default 18). The blur radius at the front, in texels.
- `K_IN, K_OUT` (default 42, 60). Spring stiffness for the reveal and the exit. Higher is snappier.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
