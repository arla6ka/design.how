---
name: vector-editor
description: Builds a React and SVG selection frame and bezier path editor, a thin accent box that draws itself open around any element with corner handles that pop in and a live width by height badge, and inside it an SVG path whose anchors and bezier handles are draggable, with mirrored, angle-only or free tangents. Use when someone asks for a design tool selection box, bounding box handles, a bezier or pen tool editor, editable SVG paths, or a canvas editor look.
---

# Vector editor

A design tool's selected-layer look for the web: a blue frame, corner handles, a size badge and a live bezier rig. See it live at https://design.how/vault/vector-editor.

## What to build

On a pale grey card, a blob, a star and a rounded square sit inside the frame a design tool draws around a selected layer: a one-pixel bright blue box 40px outside the shape, four small white square handles at its corners, and a blue badge under it reading the box's width by height. Each time the card comes into view the box scales open from its top-left corner over 0.6 seconds, the handles pop in one after another 0.1 seconds apart, and the badge pops in under the box.

Inside, the shape shows its rig. Every anchor of the path is a dot, every bezier handle a diamond joined to its anchor by a thin arm. Dragging an anchor moves it with its handles; dragging a handle reshapes the curve, and the anchor's other handle follows by the mirror rule: mirrored in angle and length, in angle only, or free. Holding Alt breaks the tangent into a corner for that drag. The editor maps the pointer into the SVG's own user units through the live screen matrix, so it stays exact at any size, and hands back the new path after each move.

The path is parsed once from a normal SVG d string, absolute or relative M, L, H, V, C, S, Q, T and Z, into subpaths of anchors with in and out handles, and serialised back the same way. The frame takes its size from the content, or from explicit numbers, and its badge stays honest as the shape changes.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/vector-editor/`. It is React and TypeScript: `params.ts`, `types.ts`, `parse.ts`, `styles.ts`, `selection-frame.tsx`, `editor.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/vector-editor` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Parse the d string into anchors, each a point with optional in and out handles, grouped into subpaths: a line leaves an anchor without handles, a quadratic is raised to the equivalent cubic.
- Draw the path, then over it the rig: an arm line and a diamond per handle and a dot per anchor, each with its own pointer handler.
- On drag, map clientX and clientY through the SVG's inverse screen matrix, move the anchor and its handles together, or the handle alone with its twin following the mirror rule.
- Wrap the content in the frame: an absolutely placed border plus four handles and a badge reading the measured size.
- Play the intro with three keyframe animations, the border scaling open from top-left and the handles and badge popping in with delays, and remount it to replay.
- Under reduced motion, skip the intro animations.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SHAPE` | a blob, a star and a rounded square | The SVG path being edited. |
| `VIEW_BOX` | 0 0 520 170 | The path's coordinate box. |
| `SHAPE_W, PAD` | 300, 40 | The drawn width of the shape and the gap to the frame. |
| `FRAME` | blue #0d99ff, 8px white handles, badge on | The selection frame's colours, handle size, border width and badge. |
| `GROUND` | #f7f7f7 | The card colour. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
