# Smooth corners

A glossy button whose corners are a superellipse that flows into the edge with no kink.

A small glossy white button reading Get the app, centred on a pale grey plate.

See it live at [design.how/vault/squircle](https://design.how/vault/squircle).

## How it works

The shape is an SVG path, built per size. At the default exponent each corner is a three-cubic fit of the superellipse on a unit box, scaled by the radius and rotated into place; any other exponent samples the curve in 32 segments.

## Install

```bash
npx skills add https://design.how/vault/squircle
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `radiusFor` (default 0.42 of the height). The corner radius for a control height.
- `SMOOTHING` (default 1). How far the corner reaches along each edge.
- `EXPONENT` (default 5). The superellipse exponent: 2 is a circle, higher is boxier.
- `BUTTON_W, CONTROL_H` (default 132, 36). The button's size in design pixels.
- `LABEL` (default "Get the app"). The button text.
- `GROUND` (default #f6f7f9). The plate colour.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the label's family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
