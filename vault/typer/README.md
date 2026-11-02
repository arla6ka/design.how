# Typer

A line that types itself in, each letter flickering through pills and highlights before it lands.

The line design engineered by hand set in lilac on mint.

See it live at [design.how/vault/typer](https://design.how/vault/typer).

## How it works

The engine wraps each character in a span and runs a frame loop at the look's rate, 20 frames a second by default, for about a second plus one percent per letter. Progress is normalised across the line, and each character gets its own control point on a bezier, so the wave of state changes ripples instead of marching.

## Install

```bash
npx skills add https://design.how/vault/typer
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `LINES` (default ["design engineered by hand :)"]). The text, one entry per line.
- `PRESETS` (default 13 looks). Each look's four colours, state pool, frame rate and number of states, in presets.ts.
- `REPLAY_MS` (default 1800). How long each look holds before the next types in.
- `STAGGER` (default 0.15). Seconds between lines starting.
- `SIZE_CQW, SIZE_MIN` (default 5.8, 16). The type size as a share of the card width, and its floor in px.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
