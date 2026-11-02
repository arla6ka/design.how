---
name: folder-embroidery
description: Builds a WebGL fragment-shader effect of overlapping embroidered word patches stitched onto fabric, each patch cut to its word's silhouette in coloured cloth with dark satin lettering and a white merrowed border, lit with a real fabric-weave bump, a puff bevel, inner and drop shadows, a hover glint across the threads and a press that pushes the patches into the cloth. Use when someone asks for embroidery, stitched or sewn text, patches or badges, a fabric or textile texture on type, a tactile craft look, or a felt or thread effect in WebGL.
---

# Folder embroidery

Three embroidered word patches stitched onto cloth, with a glint on hover and a press that springs back. See it live at https://design.how/vault/folder-embroidery.

## What to build

Three word patches, made, with and love, overlap on a deep muted purple cloth, each set at a slight hand-placed tilt and stacked back to front. Each patch is cut to the outline of its word: the coloured cloth (blue, yellow, pink) is the word's silhouette dilated outward, the letters are stitched in near-black thread on top, and a white merrowed border traces the outer edge. The whole card is the scene; there is no motion until someone touches it.

Two textures do the drawing. The first is the flat art, cloth, ink and border painted back to front in Canvas 2D. The second packs the structure the light needs: a blurred coverage ramp that becomes the puff bevel, an ink mask, a border ring and, in alpha, each patch's satin stitch direction, uploaded as raw bytes so the browser never premultiplies it. A real tiled fabric-weave photograph, from the media bucket, supplies the thread bumps both on the patches and on the background cloth.

The shader lights that art as thread: the weave and the bevel tilt the normal, a light at a fixed 73 degrees rakes across it, the patch edge gets a tight inner shadow and the patches cast a close contact shadow on the cloth. Hovering eases in a glint that rides the satin ridges around the pointer and swings the light a little with it. A press kicks a spring that flattens the shadow and dents the patches near the press point, then lets them spring back; the cloth itself never moves.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/folder-embroidery/`. It is React and TypeScript: `patches.ts`, `scene.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-wide` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Copy `assets/media/` to the app's static folder as `public/folder-embroidery/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
7. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
8. Run `node scripts/check.mjs components/folder-embroidery` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build the scene once per size and font in Canvas 2D: per word, draw the glyphs, dilate the silhouette into the cloth shape, paint cloth, ink and border back to front.
- Pack coverage ramp, ink mask, border ring and stitch angle into one RGBA field and upload it as raw bytes, not a canvas, so alpha is never premultiplied.
- Load a tiled grayscale fabric weave with crossOrigin set; use a flat placeholder texture until it arrives.
- In one fragment shader over one quad, tilt the normal by weave and bevel, light it from a fixed angle, add an inner shadow at the patch edge and a contact drop shadow on the cloth.
- On hover, ease in a glint around the pointer on the satin ridges; on press, drive a damped spring that flattens the shadow and dents the patches near the press.
- Idle the loop once hover, glint and spring have all settled, so a still card costs nothing.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the program, buffer and three textures and lose the context.
- Under reduced motion, draw one still frame.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | made, with, love | Each patch: its word, centre, height, tilt, cloth, ink and border colours, and stitch direction. |
| `FABRIC` | [0.16, 0.13, 0.2] | The background cloth colour. |
| `WEAVE_SCALE` | 15 | How many times the weave tiles across the card. |
| `REST_ANGLE, LIGHT_Z` | 73 degrees, 0.55 | Where the light rakes from and how high it sits. |
| `--visual-wide` in fonts.css | system-ui, sans-serif | The typeface for this role, a wide or extended sans. Put the project's face first. |
