---
name: cloud-type
description: Builds a WebGL2 kinetic-type effect in which a line of white letters on a pale sky arrives as soft puffs of cloud, lands and sharpens one letter at a time, holds with a grainy dithered edge, then lifts away and dissolves back into cloud, with the pointer acting as a light breeze. Use when someone asks for cloud text, smoke or vapour type, text that blurs into focus, a dithered threshold edge, a staggered letter entrance, or a soft dreamy title animation in WebGL.
---

# Cloud type

A line of white type that blows in as cloud, sharpens letter by letter, then lifts away as cloud again. See it live at https://design.how/vault/cloud-type.

## What to build

Fourteen white letters, "Drift into focus", on a pale sky blue field. They fly in from the lower left as fat, soft puffs that run together into one cloud, slide onto the line one after another from left to right, and come into focus. The line holds for a moment with a fine grain fizzing on every edge, drifting upward the whole time, then the letters lift away to the upper right, open back into cloud and thin out to nothing. The whole run lasts about four seconds and loops.

The trick is that cloud and letter are the same picture. Each glyph is a coverage mask with its own blur. Every frame the fourteen blurred masks are added into one field, the field is cut at a threshold near 0.29, and the cut edge is dithered. Where a letter is blurred wide the cut runs outside its shape and swallows its neighbours, which reads as cloud; where the blur is tight the cut hugs the letterform. The grain is a probability: a pixel at signed distance d from the cut is white with probability Phi(-(d + 0.5) / 1.8), drawn from a fresh hash on each step of a 30 fps clock, so the same rule makes the cloud edge and the sharp stem.

Each letter reads the same motion curve on its own clock, offset by its position on the line at 24 scene pixels per frame, so the arrival sweeps left to right. The curve is a table of knots for blur, offset, scale and amplitude, read with a monotone cubic so no velocity kinks. A letter arrives about 100 px left and 235 px low with a 54 px blur and is sharp about 40 frames later; a smoothstep on the blur between frames 12 and 32 of its clock makes it linger soft before it settles. The exit is a second curve, faster at 36 px per frame, whose amplitude drops to zero so the field falls through the cut and the letter is simply gone. The line rises 1.28 px a frame throughout, so even the hold is never still.

Blur is never computed per frame. At boot each glyph is blurred at thirteen sigmas from 0 to 64 and packed into one R8 atlas, sharp levels at twice scene resolution and wide ones at half; a frame lerps between two levels in log sigma. The pointer lifts letters within about 200 px by 2.5 px and adds one pixel of blur, on a gaussian of distance with its own easing, which a cloud-blurred letter never notices.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/cloud-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/cloud-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Lay the line out on a fixed 1080 by 608 scene and give each glyph its rest box there; draw each glyph once, fitted to its box, with fill plus a 3 px stroke.
- Bake each glyph at a ladder of blur sigmas into one R8 atlas, so a frame only lerps between two baked levels in log sigma.
- Pass one: additively draw every glyph quad at its offset, scale and amplitude into a scene-sized R8 target, stored at half value so overlaps do not clip.
- Pass two, at device resolution: read the field with its screen-space gradient, take signed distance to the threshold, and dither white against the ground with Phi(-(d + bias) / sigma), only where the cut actually crosses within a few pixels.
- Drive every glyph from two knot tables, entry and exit, each read on the glyph's own clock offset by its x position, and add the two: offsets sum, blur takes the larger, scale and amplitude multiply.
- Seed the grain hash with the whole frame index so it re-rolls at 30 fps while positions glide on a continuous clock.
- Ease the pointer's presence and position with an exponential approach in real time, so the follow is the same at 60 and 120 Hz.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy delete the programs, buffer, textures and framebuffer and lose the context.
- Under reduced motion, draw frame 85 once: the held line, grain and all, and ignore the pointer.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `GROUND` | #d0edfa | The sky colour. Keep GROUND_RGB in step, since the shader reads that. |
| `GLYPHS` | Drift into focus | The fourteen letters and their rest boxes on the scene. A new line needs new boxes, measured from the face. |
| `PLAY_RATE` | 1.25 | How fast the 150-frame timeline plays. 1 is the authored 30 fps. |
| `DRIFT_PER_FRAME` | 1.28 | How far the line rises each frame, in scene pixels. |
| `ENTRY.thr, EXIT.thr` | 0.29, 0.27 | Where the summed field is cut. Lower makes fatter cloud. |
| `DITHER` | {sigma: 1.8, bias: 0.5, reach: 6} | How wide the grain band is and how far it looks for a real edge. |
| `WIND` | {radius: 200, blur: 1, lift: 2.5} | How far the pointer reaches and how much it lifts and softens the letters near it. |
| `FONT_VAR, FONT_WEIGHT` | --visual-sans, 600 | The CSS variable holding the font family, and its weight. Any grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
