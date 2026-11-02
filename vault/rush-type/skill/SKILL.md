---
name: rush-type
description: Builds a WebGL kinetic-type effect in which a white word rests small and readable on black, then swings toward the viewer on a perspective orbit, stretches to about twelve times its height and tears into vertical streaks of green and violet light, swapping to the next word at the peak of the blur. Use when someone asks for speed or motion-blur type, a warp-speed or hyperspace title, chromatic smear, per-channel shutter blur, a word swap hidden in a blur, or a loud kinetic headline in WebGL.
---

# Rush type

A word rests, then blasts toward you and tears into streaks of coloured light before the next one lands. See it live at https://design.how/vault/rush-type.

## What to build

Four short words, one per cycle of a little over 0.8 s, on near-black. Each word sits small, white and sharp at the centre for about 0.38 s, then blasts: it swings up and at the viewer, turning as it comes, until it fills and overruns the frame top to bottom and the speed tears it into vertical streaks, green escaping past both ends of every stroke and a blue-white core left in the middle. At the worst of the blur the next word takes over, and it falls back down the far side of the circuit to rest.

The colour is a byproduct of speed, and there is no colour constant anywhere. The three channels are the same white word accumulated over three different shutter lengths, in the ratio 0.62, 1.0 and 0.34 for red, green and blue. Each channel averages 28 texture fetches across the range of vertical scales the word passes through in a 40 ms shutter, so a longer shutter spreads the same ink further and comes out dimmer. When the word stops, the three shutters collapse onto the same pixels and it is plain white again, with no fade.

The motion is a quad on a vertical circle seen through a pinhole camera with a focal length of one canvas height. The far point is the resting word; the near point is the blast, where perspective does the growing. Yaw (about 31 degrees) and a smaller pitch both lag the path, so the word is caught mid-turn through the loudest frame instead of squaring up to the lens. Both words live in one texture as two halves, and each shutter sample picks its half by which side of the swap instant it falls, so the blur itself dissolves one word into the next.

A faint CRT layer, an aperture grille, scanlines and a slow hum bar, is scaled by the blast so the resting word is untouched. Scrolling the page speeds the clock up. Pointing at the card, or holding a finger on it, brakes the clock with a quartic weight on how close the word is to its peak, so it coasts up to the blast and parks there rather than freezing a readable frame.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/rush-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 820, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/rush-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Raster the outgoing and incoming word into two stacked halves of one texture, at a fixed cap height, measured from the live face.
- Draw one full-screen triangle; in the fragment shader, for each of R, G and B, average SAMPLES fetches across the vertical scales the word sweeps through during that channel's shutter.
- Give each channel its own shutter length from SHUTTER_K, and divide by the sample count so longer shutters come out wider and dimmer, never coloured at rest.
- Place the word with a pinhole projection on a vertical circular path, with yaw and pitch phase-lagged against the path and pinned to zero at rest.
- Pick the atlas half per sample by whether that sample's time falls before or after the swap, so the swap happens inside the blur.
- Multiply in a grille, scanlines and a hum bar scaled by blast progress, under a neutral soft pool of light.
- Advance an accumulated clock: faster while the page scrolls, braked by the hover hold weighted by the fourth power of blast progress.
- Cap the pixel ratio at 1.5, stop the loop on webglcontextlost, and on destroy delete the program, buffer and texture and lose the context.
- Under reduced motion, draw the resting word once: crisp, white and centred.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | ["gone", "before", "you", "look"] | The words, one per cycle. Keep the count even and the words short. |
| `SY_PEAK, SX_PEAK` | 7.0, 1.57 | How tall and wide the word stretches at the blast, before perspective. |
| `REST_S` | 0.38 | Seconds the word rests, readable. |
| `SHUTTER_K` | [0.62, 1.0, 0.34] | Per-channel shutter length. The further apart, the stronger the colour split. |
| `SAMPLES` | 28 | Fetches per channel. The visible banding is part of the look. |
| `ORBIT_YAW, ORBIT_PITCH` | 0.55, 0.26 | How far the word turns on its way through the blast, in radians. |
| `CRT_GAIN` | 1.0 | Strength of the grille, scanlines and hum during the blast. 0 turns them off. |
| `HOLD_STRENGTH` | 0.96 | How hard pointing at the card holds the word at its peak. |
| `FONT_VAR` | var(--visual-sans) | The font family. Any neo-grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
