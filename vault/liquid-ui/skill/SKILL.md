---
name: liquid-ui
description: Builds fused UI cards in React and SVG, in which rounded boxes are joined by the smooth union of their signed-distance fields, traced into one path by marching squares and Chaikin smoothing and drawn behind real DOM content, so where two cards meet the corner curves inward, with one blend knob from crisp inverse-rounded joints to gooey metaballs. Use when someone asks for gooey or liquid UI, fused cards, inverse rounded corners, a metaball interface, a blob tab attached to a card, or morphing UI shapes.
---

# Liquid UI

Cards that fuse where they meet, the corner between them curving inward like poured liquid. See it live at https://design.how/vault/liquid-ui.

## What to build

White cards on a pale grey ground step through three little scenes: a grid panel with a "Grid" tab on its top edge, a chat bubble with its tail, and a share card with a "Share" button on its right edge. The playground adds a search bar with a round go button. Where a small piece meets a large one they are one surface: the corner between them curves inward, like they were poured together. Every 1.8 seconds the pieces ease to their next places over 0.56 seconds, with the content swapping at the midpoint, and a slow drift keeps the tab flexing against its panel.

There is no drawing by hand. Each card is a rounded box, and the surface is the union of their signed-distance fields taken with a polynomial smooth minimum, so near a seam the fields blend and that blend is the concave fillet. One number, the blend k, spans the look: about 20 is a crisp inverse-rounded joint, 60 a gooey neck, and 0 a hard seam.

The field is sampled on a 6px grid, marching squares traces its zero contour with linear interpolation along each edge, the loose segments are stitched into closed loops, and two passes of Chaikin smoothing turn the staircase into a fluid curve. The result is one SVG path behind the cards, and the real content, placeholder blocks, lines and labels, sits on top in normal DOM. Each scene is laid out in its own design space and scaled to the card; a phone gets a tighter layout of its own instead of a shrunken one.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/liquid-ui/`. It is React and TypeScript: `params.ts`, `sdf.ts`, `marching-squares.ts`, `engine.ts`, `scenes.tsx`, `group.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/liquid-ui` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Give every piece a box: centre, half-extents and corner radius, and evaluate sdRoundBox for each.
- Combine the pieces with smin(a, b, k) = mix(b, a, h) - k h (1 - h), with h = clamp(0.5 + 0.5 (b - a) / k, 0, 1).
- Sample the field on a grid of cell px over the pieces' bounds plus a margin, and run marching squares at 0 with edge interpolation.
- Stitch the segments into loops, Chaikin-smooth them SMOOTH times, and write one path d; recompute only when a box or k changed.
- Draw the path in an SVG behind the pieces and place each piece's content absolutely on top.
- To animate, ease each piece's box and k between scenes and add a small drift to the tab; to drag, move a piece's box.
- Under reduced motion, hold the first scene.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `CARD_SCENES` | grid panel, chat bubble, share card | The scenes the card steps through, with each piece's box and content, in scenes.tsx. |
| `k` | 20 to 60 per scene | The blend: low is a crisp inverse-rounded joint, high a gooey melt. |
| `HOLD_MS, MORPH_MS` | 1800, 560 | How long a scene holds and how long the pieces travel. |
| `SKIN, GROUND` | #ffffff, #f7f7f7 | The fused surface and the card behind it. |
| `SMOOTH` | 2 | Chaikin passes over the traced outline. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
