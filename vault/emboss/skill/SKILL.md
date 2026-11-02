---
name: emboss
description: Builds a WebGL bevel-and-emboss effect in which words or SVG shapes are debossed into tinted plaster panels, with a height field blurred on the CPU, normals from its slope, a highlight and a shadow from one light, a real plaster texture and a grunge overlay. Use when someone asks for an emboss or deboss effect, letterpress or pressed type, a bevel and emboss shader, text carved into a wall or concrete, or a realistic relief in WebGL.
---

# Realistic emboss

Words and shapes pressed hard into tinted plaster, with the light catching every edge. See it live at https://design.how/vault/emboss.

## What to build

A white card holds three rounded plaster panels side by side, off white, yellow and violet. Into each one something is pressed, the word beep, a five-petal flower and the word boop, hard enough that the light catches a bright rim on one side of every stroke and a shadow on the other. The surface is a photographed plaster, so the grain and the small pits read as a real wall, and a grunge layer of fine scratches sits over the letters too, which keeps them from looking pasted on.

The relief is a height field, not geometry. Each panel's content is drawn white on a 2D canvas, once crisp and once blurred with a canvas filter at that panel's bevel width, and the two are packed into the red and green channels of one texture, at most 1500 pixels wide. The fragment shader takes the slope of the blurred channel from four neighbouring samples, scales it by the panel's depth, and builds a normal from it. Its dot product with one fixed light, set at 73 degrees, splits into a highlight where it is positive and a shadow where it is negative, each weighted by the slope so flat plaster stays untouched.

The crisp channel darkens the pressed face by 14%, so the inside of a letter sits a little lower than the wall. Each panel samples its own clamped window of the plaster at its own zoom, so the three never show the same grain, and nothing tiles or seams. The pointer adds a faint wash centred on itself to the panel it is over. The card draws only when something changes and idles otherwise.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/emboss/`. It is React and TypeScript: `content-mask.ts`, `text-mask.ts`, `shaders.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-wide` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Copy `assets/media/` to the app's static folder as `public/emboss/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
7. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
8. Run `node scripts/check.mjs components/emboss` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise each panel's word or SVG in white, once crisp and once blurred by the panel's bevel width with a 2D canvas filter, and pack crisp coverage into red and blurred height into green.
- In the fragment shader, take the slope of the height from four neighbours, scale it by depth, and build the normal (-slope.x, -slope.y, 1).
- Light it from one fixed direction. Add the positive part of N dot L as the highlight and subtract the negative part as the shadow, both times the slope length.
- Multiply a tinted, contrast-adjusted plaster sample by the panel brightness, darken the crisp face to 86%, and blend a grunge texture over it in overlay mode at 0.38.
- Draw only on a change and idle after the pointer wash settles; rebuild the height field in an idle callback, and only when its size or the face changed.
- Stop on webglcontextlost, and on destroy delete the program, the buffer and the three textures and lose the context.
- Under reduced motion, build the field and draw the pressed panels once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `STYLES` | beep, a flower, boop | Each panel's word or SVG, bevel width, depth, highlight, shadow, grain, brightness, tint and plaster window. |
| `REST_ANGLE` | 73 degrees | The direction the light comes from. |
| `GRUNGE_AMT` | 0.38 | How strongly the scratch and grain overlay shows. |
| `BUILTIN_SVGS` | eleven solid shapes | The shapes a panel can press instead of a word. |
| `--visual-wide` in fonts.css | system-ui, sans-serif | The typeface for this role, a wide or extended sans. Put the project's face first. |
