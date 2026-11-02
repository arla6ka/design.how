# Datamosh

Columns of saturated colour that fall, snap open through the middle and squeeze shut, like a broken video decode.

Columns of flat saturated colour, the middle tiles stretched tall and the edges squeezed to thin bands.

See it live at [design.how/vault/datamosh](https://design.how/vault/datamosh).

## How it works

One curve does all of it. A tile boundary that has travelled k tiles sits at a sigmoid of k over the tile count, with a sharpness of 8.5.

## Install

```bash
npx skills add https://design.how/vault/datamosh
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

## Knobs

- `PALETTE` (default white, two near-blacks, eight saturated hues). The colours. Keep white and a dark in it for contrast.
- `COLS, POWER` (default 11, 1.65). How many columns, and how hard their widths recede.
- `TILES` (default 15). Tiles per column. Keep it odd; move STRETCH with it.
- `CYCLE` (default 0.2). Seconds per tile step, so the fall speed.
- `STRETCH` (default 8.5). How tall the centre tile opens against the shoulders.
- `SPRING_K` (default 1.6). How long a tile hangs at the middle of its step. Tune against CYCLE.
- `COL_PHASE` (default -0.4). Offset between columns, in tiles. Sets the zig-zag.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
