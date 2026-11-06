---
name: smear-type
description: Builds kinetic typography in WebGL in which two lines of heavy capitals are uncovered by a soft cloud in the ground's own colour whose edge glows a hotter hue, the type smearing sideways where it is half hidden and sliding the last few pixels into place, while pale liquid ribbons churn through a saturated ground and blobs of ink streak across, all played from small traced layers a frame at a time. Use when someone asks for smeared or motion-blurred type, an ink or liquid title reveal, type uncovered by a glowing cloud, a gig poster or event title animation, or a bold two-line headline with a fluid background.
---

# Smear type

Two lines of heavy capitals that a soft cloud with a glowing edge uncovers, while pale ribbons churn through the ground and ink streaks across. See it live at https://design.how/vault/smear-type.

## What to build

Two lines of capitals sit centred on a 600 by 600 scene, scaled to the box as one unit: caps 45 scene pixels tall, cap tops at 250 and 300, the lines no wider than 410. They are set heavy from any face: drawn 1.1 times wide and thickened by a stroke 0.06 of a cap wide, and a touch soft at rest.

The motion is not computed. Every frame of a 48-frame loop, 50ms a frame, was traced into five grey layers on a 5 pixel grid (the ribbons, the cloud's glowing rim, how much of the type shows, how much of it is still sharp, and the ghost streaks outside the lines), plus the ink at 3 pixels on the seven frames that have it. The shader plays them a frame at a time: the ground takes the ribbons, the type shows sharp as far as the sharp layer says and smeared sideways, 30 by 8 pixels, for the darkness beyond that, then the streaks, the rim and the ink lie over it.

Only the type is the visual's own, so any two lines work. Over the lines the traced layers carry the shapes of the letters they were traced from, so there they only say where and when: the cloud's shape is the type itself blurred 26 by 12 pixels into one long mass, filled with ground and glowing at its edge, and the ribbons and the reveal are read blurred. Each line slides the last 20 and 40 pixels into place, on frames 19 to 22 and 26 to 29.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/smear-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1 / 1, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/smear-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Serve the template's layers.webp and ink.webp from the app's static folder, at the paths LAYERS_URL and INK_URL name.
- Rasterise both lines at rest into one texture, centred, caps 45 tall, 1.1 times wide and thickened by a stroke, from the live face.
- Each frame, read that frame's cell of every traced layer: ribbon, rim, reveal, smudge and sharpness, and the ink if the frame has it.
- Mix the ground toward the ribbon colour by the ribbon layer.
- Over the lines, take the cloud from the type blurred 26 by 12 pixels: fill it with ground where the type is hidden and glow its edge where the traced rim says it lies; elsewhere use the traced rim.
- Draw the type sharp by the sharpness layer and smeared 30 by 8 pixels for the rest of the reveal, each line moved by its slide, then the smudge, the rim and the ink.
- Step the layers a frame at a time on 50ms frames and loop after 48.
- Under reduced motion, draw frame 37 once: both lines in, a small cloud over their middle.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `DEFAULT_LINES` | "DESIGN THAT", "MOVES YOU" | The two lines. Capitals read best; a line wider than WIDE is set smaller. |
| `DEFAULT_GROUND` | #1d1cf0 | The ground, and the cloud's fill. |
| `DEFAULT_RIBBON` | #8d90ff | The ribbons' colour at full strength. |
| `DEFAULT_RIM` | #19c3ff | The cloud's glowing edge. A hotter shift of the ground reads best. |
| `DEFAULT_TYPE` | #080616 | The type and its smear. |
| `DEFAULT_INK` | #000000 | The blobs of ink. |
| `KEY_MS` | 50 | One frame's length. The loop is 48 frames. |
| `CAP` | 45 | The cap height in scene pixels, stroke included. |
| `WIDEN` | 1.1 | How much wider than the face sets them the lines are drawn. 1 for a face that is wide already. |
| `EMBOLDEN` | 0.06 | The thickening stroke, as a share of a cap. 0 for a face with a heavy weight. |
| `BLUR` | [30, 8] | How far half-hidden type smears, across and down, in scene pixels. |
| `FONT_WEIGHT` | 500 | The weight the face is drawn at. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. A wide grotesque reads best. |
| `LAYERS_URL` | "/smear-type/layers.webp" | Where the traced layers are served from; INK_URL likewise for the ink. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
