# Orbit

Twenty-six labelled cursors ride an invisible sphere around a thin breathing ring, and the sphere can be thrown.

Coloured cursor arrows with name pills scattered around a thin violet ring on white, large at the front and faint at the back.

See it live at [design.how/vault/orbit](https://design.how/vault/orbit).

## How it works

The projection is orthographic, so depth never moves a cursor sideways. It shows only as scale, linear in depth from a pill 0.057 of the height at the front to 0.020 at the back, and as opacity, full through the front half and gone below -0.85, so the deepest few vanish.

## Install

```bash
npx skills add https://design.how/vault/orbit
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `CAST` (default twenty-six first names in eight hues). The names and their colours.
- `RING_COLOR` (default #6B3EB5). The ring.
- `BG` (default #fdfdfd). The ground.
- `PHRASE` (default 27). Seconds in one phrase of drift, build, fast pass and settle.
- `RATE_DRIFT, RATE_WHIP` (default 0.03, 0.45). The calm and the fast spin rate, in turns per second.
- `MAG_RADIUS, MAG_FORCE` (default 0.19, 5.2). How far and how hard a moving pointer pushes cursors aside.
- `THROW_FRICTION` (default 1.25). How fast a throw bleeds back into the phrase.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the label font family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
