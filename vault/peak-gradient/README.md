# Peak gradient

A soft rainbow glow of blurred columns that rises from the floor, tallest in the middle.

A soft glow of blurred rainbow columns rising from the bottom of a white card, tallest in the middle.

See it live at [design.how/vault/peak-gradient](https://design.how/vault/peak-gradient).

## How it works

It is far simpler than it looks: nine tall rectangles in one SVG, all filled with the same vertical gradient and each blurred with a gaussian of 15 view-box units in a 1271 by 599 box. The gradient is in each rectangle's own bounding box, so every column carries the full rainbow over its own height, and the columns are 1.23 times their pitch so they overlap and the blur melts them into one surface.

## Install

```bash
npx skills add https://design.how/vault/peak-gradient
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `STOPS` (default ember, blue, steel, near-white, yellow, red-orange, magenta, transparent). The rainbow every column carries, bottom to top.
- `PALETTES` (default seven rainbows). Alternative stops for the same shape.
- `BARS` (default 9). How many columns.
- `BLUR` (default 15). The blur in view-box units.
- `PEAK` (default 0.98). The centre column's height as a share of the box.
- `VALLEY` (default 0.55). The edge columns' height as a share of the centre's.
- `RISE_MS` (default 1100). How long the rise from the floor takes.
- `GROUND` (default #ffffff). The card colour.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
