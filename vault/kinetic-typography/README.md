# Kinetic typography

One heavy letter cut into a grid of tiles, each slipping on its own wave, so the letter ripples like cloth.

A large black lowercase a on near-white paper, its outline broken into wavering tile steps with a faint blue fringe.

See it live at [design.how/vault/kinetic-typography](https://design.how/vault/kinetic-typography).

## How it works

The letter is drawn once, white on transparent, into an offscreen mask. Each frame, every tile copies the patch of the mask under it, but from a source shifted by a wave.

## Install

```bash
npx skills add https://design.how/vault/kinetic-typography
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site, its playground included.

It sets its type in `--visual-serif`, a system stack in `fonts.css` (Georgia, serif). Put your own face first.

## Knobs

- `text` (default "a"). The letter, or up to 12 characters, fitted to 90 percent of the width.
- `paper, ink, accent` (default #fcfcfc, #1b1b1b, #3b82f6). The ground, the letter and the fringe colour.
- `tiles` (default 34). Tile columns. Fewer makes big, blocky steps.
- `offset` (default 26). The largest shift in CSS px.
- `speed, spread` (default 0.02, 0.025). How fast the waves move, and how turbulent the grid gets.
- `chroma, shade, grain` (default 0.35, 0.35, 0.7). Fringe strength, depth shading and the grain veil.
- `FONT_VAR` (default --visual-serif). The CSS variable holding the font family. Any heavy display serif works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
