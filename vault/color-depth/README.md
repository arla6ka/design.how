# Colour depth

Buttons that look like real objects, glossy or lit from inside, from gradients and inset shadows alone.

Two Get Started pills on a pale plate, one glossy orange and one glowing violet.

See it live at [design.how/vault/color-depth](https://design.how/vault/color-depth).

## How it works

Every recipe is the same element and one class. The depth is layered paint, not geometry: the body is a gradient, the bevel and the glow are stacks of inset box-shadows, ::before holds the hover state as a full second skin that only changes opacity, and ::after holds the highlight.

## Install

```bash
npx skills add https://design.how/vault/color-depth
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

## Knobs

- `SHOWCASE` (default glossy and glow). The recipes the card shows.
- `RECIPES` (default ten recipes). Each recipe's name, class, note and best backdrop, in recipes.ts.
- `LABEL` (default "Get Started"). The pill text, in recipes.ts.
- `GROUND` (default #f8f9fb). The plate colour.
- `DESIGN_WIDTH` (default 528). The card width the pills are sized at.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
