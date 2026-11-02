# Text reveal

Two small serif text blocks that un-blur into focus through a cloudy mask, corner by corner, then clear and return.

Two short lines of dark serif text in the top-left corner and two in the bottom-right, on a pale warm-grey plate.

See it live at [design.how/vault/text-reveal](https://design.how/vault/text-reveal).

## How it works

The text is drawn once per pair into a canvas texture and revealed in one fragment shader. The mask is mostly a steepened diagonal, so the corners stage one after the other, textured with domain-warped fbm for tendrils and a fine stipple so the leading edge breaks into grain.

## Install

```bash
npx skills add https://design.how/vault/text-reveal
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-display`, a system stack in `fonts.css` (Georgia, serif). Put your own face first.

## Knobs

- `TEXT_PAIRS` (default three {top, bottom} pairs of two lines). The phrases. Keep lines short: a block spans at most about half the card.
- `BG, INK, EDGE` (default #fdfdfb, #242320, #f2f1ec). The plate, the text and the glow on the front.
- `HOLD_MS` (default 320). How long the revealed pair lingers before it clears.
- `K_IN, K_OUT, DAMP` (default 16, 22, 1.12). Spring stiffness in and out, and damping. Lower is slower and softer.
- `MAX_BLUR` (default 16). Blur radius at the front, in texels.
- `PARALLAX_AMP` (default 0.006). How far each corner leans toward the pointer.
- `WASH_SECONDS` (default 48). How long the white wash takes to drift there and back.
- `FONT_CSS, FONT_WEIGHT` (default var(--visual-display), Georgia, serif; 500). The face and weight.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
