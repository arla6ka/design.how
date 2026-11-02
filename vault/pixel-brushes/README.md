# Pixel brushes

A brush is one small shape stamped along a path, and five numbers turn it into a crisp line or a loose spray.

Three spirals side by side on off-white paper, in pink, blue and green, drawn as a combed ribbon, a dense spray and a loose drift of squares.

See it live at [design.how/vault/pixel-brushes](https://design.how/vault/pixel-brushes).

## How it works

A brush is a stamp, one or more square cells in a -1 to 1 box each with its own alpha, plus five numbers. The engine walks the path by arc length and drops a stamp every spacing times the stamp size.

## Install

```bash
npx skills add https://design.how/vault/pixel-brushes
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

## Knobs

- `SHOWN` (default rows, scatter-heavy, cluster). Which three brushes from BRUSHES the card shows.
- `BRUSHES` (default twelve brushes, line to spray). The set: each a stamp and its five numbers.
- `INKS, PAPER_BG` (default pink, blue, green on #fbf9f7). One ink per swatch and the shared paper.
- `DRAW_MS, STAGGER_MS` (default 900, 180). How long a swatch takes to draw, and the gap between starts.
- `TWEAKS` (default the spray at size 0.075, spacing 0.4). Per-card overrides of a brush's numbers.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
