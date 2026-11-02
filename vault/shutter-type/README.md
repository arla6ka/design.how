# Shutter type

Two lines of type through a rolling shutter: whatever moves tears into bands, whatever is still stays whole.

A stack of the words "made visual" in sky blue on warm paper, at rest.

See it live at [design.how/vault/shutter-type](https://design.how/vault/shutter-type).

## How it works

Every slice, ghost and torn edge comes from one post-effect. A fixed map of horizontal stripes, 14 to 60 scene pixels tall, gives each stripe a lag of up to 2.4 frames, quantised to five taps, and no two neighbours share a tap.

## Install

```bash
npx skills add https://design.how/vault/shutter-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `PAPER` (default #f6f3ea). One of the two colours, the ground for most of the loop.
- `SKY` (default #00afca). The other colour, the ground on the inverted beats.
- `SKY_SPANS` (default [[10, 28], [54, 67]]). The frames on which the colours invert.
- `STRIPE_LAG_MAX` (default 2.4). The longest lag a stripe carries, in frames. Higher tears further.
- `STRIPE_SEED` (default 0x51ab7e). Seed for the stripe map. A new seed moves the cuts and leaves the choreography alone.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any grotesque works; the words are squeezed to their set widths.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
