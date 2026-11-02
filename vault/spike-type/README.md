# Spike type

A word knocked out of a pale ground, its edge chewed ragged and bristling with hundreds of hand-drawn spikes.

The word melon in white on pale grey, outlined in yellow and bristling with fine spikes.

See it live at [design.how/vault/spike-type](https://design.how/vault/spike-type).

## How it works

The letterform is rasterised from the live face and traced into closed contours, and only then roughened, so the spikes grow from the chewed edge and inherit its irregularity. A spike is a stroke that goes out and comes back, not a triangle.

## Install

```bash
npx skills add https://design.how/vault/spike-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `WORD` (default melon). The word. Short words with round letters give the spikes the most edge.
- `PALETTE` (default ground #e4e4e8, mark #ffffff, line #ffc21e). The ground, the letters and spikes, and the outline.
- `MAX_LEN` (default 0.26). The longest spike, as a fraction of the card's height.
- `EVERY` (default 3). Edge points between spike roots. Lower is denser.
- `BREATH_AMT, BREATH_RATE` (default 0.1, 0.55). How much and how fast the spikes breathe.
- `REPEL` (default 0.34). How far the pointer bends spikes, in radians.
- `HUE_TO` (default 104). The hue the outline warms to under the pointer.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
