# Liquid UI

Cards that fuse where they meet, the corner between them curving inward like poured liquid.

White rounded cards on pale grey, a small tab fused to a larger panel with an inward-curving joint.

See it live at [design.how/vault/liquid-ui](https://design.how/vault/liquid-ui).

## How it works

There is no drawing by hand. Each card is a rounded box, and the surface is the union of their signed-distance fields taken with a polynomial smooth minimum, so near a seam the fields blend and that blend is the concave fillet.

## Install

```bash
npx skills add https://design.how/vault/liquid-ui
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `CARD_SCENES` (default grid panel, chat bubble, share card). The scenes the card steps through, with each piece's box and content, in scenes.tsx.
- `k` (default 20 to 60 per scene). The blend: low is a crisp inverse-rounded joint, high a gooey melt.
- `HOLD_MS, MORPH_MS` (default 1800, 560). How long a scene holds and how long the pieces travel.
- `SKIN, GROUND` (default #ffffff, #f7f7f7). The fused surface and the card behind it.
- `SMOOTH` (default 2). Chaikin passes over the traced outline.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
