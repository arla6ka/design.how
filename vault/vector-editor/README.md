# Vector editor

A design tool's selected-layer look for the web: a blue frame, corner handles, a size badge and a live bezier rig.

A blob, a star and a rounded square inside a blue selection frame with corner handles and a size badge.

See it live at [design.how/vault/vector-editor](https://design.how/vault/vector-editor).

## How it works

Inside, the shape shows its rig. Every anchor of the path is a dot, every bezier handle a diamond joined to its anchor by a thin arm.

## Install

```bash
npx skills add https://design.how/vault/vector-editor
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `SHAPE` (default a blob, a star and a rounded square). The SVG path being edited.
- `VIEW_BOX` (default 0 0 520 170). The path's coordinate box.
- `SHAPE_W, PAD` (default 300, 40). The drawn width of the shape and the gap to the frame.
- `FRAME` (default blue #0d99ff, 8px white handles, badge on). The selection frame's colours, handle size, border width and badge.
- `GROUND` (default #f7f7f7). The card colour.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
