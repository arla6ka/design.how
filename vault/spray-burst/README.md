# Spray burst

A screenprint that reprints itself every three seconds, every edge a boiling spray of dots.

A screenprint on cream paper: bold geometric shapes in two inks over a plate, every edge a fine spray of dots.

See it live at [design.how/vault/spray-burst](https://design.how/vault/spray-burst).

## How it works

Every pixel is exactly one of three inks. There is no anti-aliasing and no blending: each scene resolves to a signed distance for the plate and for the ink, the distance becomes a coverage probability Phi(-d / sigma), and a per-pixel hash decides which ink wins.

## Install

```bash
npx skills add https://design.how/vault/spray-burst
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `PALETTES` (default six {paper, plate, ink} triples). The three inks per drawing. Keep the paper near the same cream in all six.
- `ORDER` (default [1, 4, 0, 5, 2, 3]). The order the six drawings print in.
- `SCENE_MS` (default 3000). How long each drawing holds before the next.
- `FPS` (default 24). The step rate of the boil. Higher reads smoother and loses the film.
- `SPRAY_INK, SPRAY_PLATE` (default 0.028, 0.033). The spray fringe width for ink and plate, in plate units.
- `SPRAY_SCALE, GRAIN_SCALE` (default [1, 0.72, 1.15, 1.3, 0.85, 1.5], [1, 0.9, 1.35, 1.1, 0.8, 0.6]). Per-drawing multipliers on the fringe and the interior grain. Keep them between about 0.6 and 1.5.
- `CURSOR_AMOUNT` (default [0.55, 0.7, 0.45, 0.5, 0.6, 0.8]). How far each drawing leans toward the pointer. 0 turns a drawing's gesture off.
- `CURSOR_SPRAY, CURSOR_GRAIN` (default 0.35, 0.5). How much heavier the print gets under the pointer.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
