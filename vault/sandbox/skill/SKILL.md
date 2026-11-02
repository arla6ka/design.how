---
name: sandbox
description: Builds a three.js halftone shader in which an image or a playing video is cut into a grid of cells, each cell's brightness is bucketed into four bands, and every band stamps its own small symbol tinted with its own colour, so the picture is rebuilt out of marks, with preset looks, a palette and glyph crossfade, PNG export and WebM recording. Use when someone asks for a halftone or symbol mosaic, a glyph or emoji dither, an ASCII-like video filter, a pattern stamp effect on video, or a live image-to-symbols shader.
---

# Symbols effect

A live halftone that rebuilds a clip from small tinted symbols, one per brightness band. See it live at https://design.how/vault/sandbox.

## What to build

A short clip, a running cat, beetles, flowers, blocky letters spelling hi, plays rebuilt from little marks. The frame is split into a grid of square cells about 8 pixels wide on a 600 pixel card, and each cell shows one small symbol, a dot, a ring, a square, a triangle, a cross, tinted in one of four colours. Dark parts of the picture get one symbol and colour, the light parts another, so the image reads from a distance and dissolves into pattern up close. Every two seconds the card moves to a new clip with its own palette and symbols.

It is one fragment shader on one full-frame quad. Each pixel snaps to the centre of its cell and samples the source there, so a whole cell reads one colour, and the luminance of that sample picks a band from four ranges, 0 to 25%, to 50, to 75 and to 100 by default. The band's symbol, a 32 by 32 canvas drawn from paths, tiles once per cell and is multiplied by the band's colour over a white ground; the empty symbol leaves paper. The source is cover-cropped so the grid always fills the frame, and the cell size scales with the card's width so a phone sees the same density as a desktop.

A video is a three.js VideoTexture, preloaded for every preset so a switch never decodes from cold, and the new clip only replaces the old one after its first frame has really been decoded, which avoids a black flash. Switching looks inside the playground crossfades colours and symbols on a spring. The playground also takes an image or a clip of your own, entirely in the browser, and saves a PNG or records the canvas to WebM.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/sandbox/`. It is React and TypeScript: `glyphs.ts`, `presets.ts`, `shaders.ts`, `SandboxRenderer.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Copy `assets/media/` to the app's static folder as `public/sandbox/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/sandbox` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw a full-frame quad with one ShaderMaterial; pass the source, the cell size, four band colours, four band ranges and four glyph textures as uniforms.
- In the fragment shader, snap the pixel to its cell centre, cover-crop and sample the source, and take its luminance.
- Find the band whose range holds that luminance, tile the band's glyph once per cell, and tint it with the band colour over white.
- Scale the cell with the card's width against a 600 pixel reference, so the number of cells across stays constant.
- Keep a pool of preloaded videos and swap the texture only after the new clip has presented a decoded frame.
- Pause the clip and the cycle off screen and on a hidden tab; stop on webglcontextlost; on destroy dispose the textures, the material and the geometry, then renderer.dispose() and renderer.forceContextLoss().
- Under reduced motion, hold the first look on a decoded frame of its clip.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PRESETS` | seven looks | Each clip with its four band colours, four symbols and zoom. |
| `GLYPHS` | twenty-four symbols | The symbols a band can stamp, drawn as canvas paths. |
| `CELL` | 8 | The cell size in pixels at a 600 pixel wide card. |
| `CYCLE_MS` | 2000 | How long the card holds each look. |
| `bandStops` | 0, 0.25, 0.5, 0.75, 1 | Where the four brightness bands split. |
