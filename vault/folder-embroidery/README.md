# Folder embroidery

Three embroidered word patches stitched onto cloth, with a glint on hover and a press that springs back.

Three overlapping embroidered patches reading made, with, love, in blue, yellow and pink cloth with white stitched borders, on purple fabric.

See it live at [design.how/vault/folder-embroidery](https://design.how/vault/folder-embroidery).

## How it works

Two textures do the drawing. The first is the flat art, cloth, ink and border painted back to front in Canvas 2D.

## Install

```bash
npx skills add https://design.how/vault/folder-embroidery
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-wide`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/folder-embroidery/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `WORDS` (default made, with, love). Each patch: its word, centre, height, tilt, cloth, ink and border colours, and stitch direction.
- `FABRIC` (default [0.16, 0.13, 0.2]). The background cloth colour.
- `WEAVE_SCALE` (default 15). How many times the weave tiles across the card.
- `REST_ANGLE, LIGHT_Z` (default 73 degrees, 0.55). Where the light rakes from and how high it sits.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
