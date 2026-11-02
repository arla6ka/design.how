---
name: swing-type
description: Builds a swinging word on Canvas 2D, in which a row of huge coloured letters on a fixed angular pitch swings back and forth like a pendulum, each letter turning on its own vertical axis in proportion to its distance from centre, so it squashes to a sliver at the sides, opens to full face in the middle and only two or three letters read at once, with detents that click letter to letter and letters that flip over to spell the next word. Use when someone asks for rotating 3D letters without WebGL, a carousel of letters, a pendulum or swinging type effect, or a word that reveals itself a few letters at a time.
---

# Swing type

Huge letters swinging past a fixed window, turning edge-on so the word never assembles. See it live at https://design.how/vault/swing-type.

## What to build

Five huge letters, one flat colour each from a set of five that walk the hue circle at equal chroma and lightness, swing back and forth across a white field. Each letter turns on its own vertical axis as it travels: it squashes to a sliver at the sides and opens to full face in the middle, and past 90 degrees it is gone. The letters sit 78 degrees apart, so a 180 degree window holds 2.3 of them, only two or three ever read at once, and the word never assembles. That withholding is the piece.

The one law is that rotation is proportional to screen x, about 0.44 cap heights per radian, not a cylinder. Each letter is drawn as a parallelogram, an affine transform of a pre-rendered glyph bitmap, so one drawImage reproduces it with no slicing and no WebGL. The swing is a two second pendulum whose amplitude is derived as half the word's angular width, so each extreme lands an end letter dead centre. A detent warps the phase so the row crawls at every multiple of the pitch and clicks from letter to letter instead of whipping past the middle.

The squash is not a cosine alone. Height falls off a measured table every 15 degrees, a little more for tall letters, and the stems lean toward the centre by a second table that peaks near 55 degrees, applied as an in-plane rotation, which is what stops it reading as flat 2D squashing. Letters scale about a point 0.37 caps above the baseline. A heavier cut of the face cross-fades in as a letter turns, so the stem thins more slowly as it squashes.

Every three seconds the word changes, Pivot, Swing, Turns, Angle, all five letters so the geometry never moves. A changing slot takes an extra half turn of its own over 420ms, staggered 90ms left to right, swapping its glyph at the midpoint where it is edge-on and invisible, so the row rewrites itself rather than cutting.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/swing-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/swing-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the type from the measured cap of the live face (CAP_FRAC of the card height) and rasterise every letter once in two weights into its own bitmap.
- Place letters on a fixed PITCH_DEG angular pitch and swing the whole row with swingDeg(letters) times sin(2 pi t / PERIOD), warped by DETENT at each multiple of the pitch.
- Map each letter's angle to screen x linearly (K_OVER_CAP times the cap per radian) and cull it past CULL_DEG.
- Draw each letter with one drawImage under an affine transform: a horizontal scale by the cosine of its angle, a height from VSCALE, and an in-plane lean from LEAN, about PIVOT_CAP.
- Cross-fade the FONT_WEIGHT_EDGE bitmap in as the letter turns.
- Cue the next word every WORD_SECONDS; flip each slot an extra half turn over FLIP_SECONDS, staggered by FLIP_STAGGER, and swap its glyph at the edge-on midpoint.
- Under reduced motion, draw the frame with the first letter of the first word square-on in the middle.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | ["Pivot", "Swing", "Turns", "Angle"] | The words, cycled. Every word must have the same number of letters. |
| `INK` | ["#F0413B", "#E88500", "#0FA3A3", "#2F6BE0", "#7A3BD6"] | One colour per letter slot, left to right. |
| `BG` | #FFFFFF | The field. |
| `PERIOD` | 2.0 | One full swing, in seconds. |
| `DETENT` | 0.7 | How hard the row clicks from letter to letter. Keep it below 1. |
| `CAP_FRAC` | 0.46 | Cap height as a fraction of the card height. |
| `WORD_SECONDS` | 3 | How long each word holds before the next. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. A plain grotesque with a heavier cut works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
