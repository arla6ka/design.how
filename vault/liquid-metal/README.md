# Liquid metal

One word as flowing polished metal on black, its reflection streaming as the pointer moves.

The word metal in fat, rounded letters of polished silver-teal metal on near-black, a bright horizon line running through them.

See it live at [design.how/vault/liquid-metal](https://design.how/vault/liquid-metal).

## How it works

There is no geometry. The word is rasterised once into a texture with three channels: crisp coverage, a wide blur that becomes the big rounded bulge of each letter, and a tighter blur that adds a little surface curvature.

## Install

```bash
npx skills add https://design.how/vault/liquid-metal
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORD` (default metal). The word. Short and bold reads best: the metal needs surface.
- `RAMPS` (default Silver Teal, Gold, Iridescent, Rose Gold and four more). The colourways, each five ramp stops from sky to base plus a spark tint.
- `DEFAULT_RAMP` (default 0). The colourway it starts in.
- `FONT_CSS, FONT_WEIGHT` (default var(--visual-sans), 600). The face and weight. Heavy weights give the blur more to round.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
