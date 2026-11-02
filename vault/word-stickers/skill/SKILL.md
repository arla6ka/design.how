---
name: word-stickers
description: Builds a set of die-cut vinyl word stickers on a page, each word with a thick coloured border that hugs the letters, popping in one by one, curling up off the surface when grabbed through a WebGL peel shader, and thrown with momentum, friction and edge bounces. Use when someone asks for draggable stickers, a sticker peel effect, die-cut text, a throwable or physics word cloud, or a playful interactive hero with grabbable words.
---

# Word stickers

Die-cut word stickers that pop in one by one, peel up when grabbed and fling with momentum. See it live at https://design.how/vault/word-stickers.

## What to build

Six short words sit scattered across a light page as vinyl stickers, wow, design, vault, yes!, hello and ship it, all in one bitmap serif. Each has a thick die-cut border in its own bold colour that follows every letter, holes in the o and the e included, and a contrasting text colour on top. When the card first comes into view they scale in one at a time from left to right, 140ms apart.

The die-cut is drawn, not traced. Each word is stamped in the border colour many times around concentric rings out to the border width, about 16% of the type size, which dilates the silhouette into an even band; the word is then filled once on top in its own colour. That canvas becomes the sticker's texture. The type is 8.8% of the card's width, kept between 32 and 66 pixels.

Grab a sticker and it peels. All six share one WebGL layer that draws each as a 24 by 24 subdivided quad; for the grabbed one a lift wave rolls across the mesh from the grab point toward the opposite corner, raising vertices in z and pulling them back along that axis, so a corner curls up and catches the light. The sticker also grows to 112% and follows the pointer with an eased, weighty lag. Let go and it keeps the drag velocity at 70%, glides with 0.92 friction per frame and bounces off the edges keeping 55% of its speed, while the peel settles flat.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/word-stickers/`. It is React and TypeScript: `stickers.ts`, `sticker-render.ts`, `peel-shaders.ts`, `gl-sticker.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-pixel` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/word-stickers` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Render each sticker to a 2D canvas by stamping the word around concentric rings out to the border width in the border colour, then filling the word once in its text colour.
- Draw every sticker on one WebGL layer as a subdivided quad with its canvas as the texture, and put a transparent DOM hit area over each for the pointer.
- On grab, ease a peel fraction to 1 and lift the vertices behind a moving front that runs from the grab point to the opposite corner; light the raised part in the fragment shader.
- Follow the pointer with an eased lag while dragging; on release keep part of the velocity, apply friction each frame and reflect it at the edges.
- Scale the stickers in one at a time on the first start, ordered left to right.
- Stop on webglcontextlost, and on destroy delete the program, the three buffers and every sticker texture and lose the context.
- Under reduced motion, lay every sticker out flat at full size once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `STICKERS` | six words, each with fill, outline and position | The words, their colour pairs and where each sits on the card. |
| `GRAB_SCALE` | 1.12 | How much a grabbed sticker grows. |
| `THROW_SCALE` | 0.7 | How much of the drag velocity a release keeps. |
| `FRICTION` | 0.92 | Velocity kept per frame while a thrown sticker glides. |
| `BOUNCE` | 0.55 | Speed kept when a sticker hits an edge. |
| `PEEL_ELEVATION` | 0.4 | How high the curl lifts. |
| `--visual-pixel` in fonts.css | ui-monospace, monospace | The typeface for this role, a pixel or bitmap face. Put the project's face first. |
