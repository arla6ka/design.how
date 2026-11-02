---
name: misprint-type
description: Builds a screen-print misregistration effect on Canvas 2D, in which a white fill print, a wider black outline print and a holographic foil print of the same word never line up, float as planes that tilt with the pointer and re-print to a new offset every few seconds, with squeegee streaks, pinholes and paper grain, and a press-and-hold that pulls the prints into register. Use when someone asks for a misprint or off-register look, screen-print type, a holographic foil text effect, or a tactile hero headline.
---

# Misprint type

HOLD ON, two prints that never register; press and hold to pull them together. See it live at https://design.how/vault/misprint-type.

## What to build

Two lines, HOLD and ON, in tall squeezed capitals on a hot orange sheet. The artwork is a 720px square shown at half size in the middle of a 720 by 360 scene, 2:1, with orange either side. The face is a grotesque at bold, scaled horizontally to about 0.4 of its width, so the stems come out much narrower than the bars and the letters read as stretched type.

The word is printed three times, and the prints never agree. The fill, warm white, is the narrower run. The outline is a wider run, 30px wider on HOLD and 10px on ON, centred on nearly the same axis, so it spills past the fill at both ends and lands differently on every letter. A rigid offset would read as a drop shadow. The outline is a 3px band hugging the wider letter's outer edge, built by stamping the filled word 16 times around a 3px circle and cutting the original back out, because strokeText under a squeeze draws thin verticals. Under both sits a third, foil print, a little wider still and shifted the other way, filled with a four-stop gradient of mint, lilac, ice and peach whose phase follows the tilt, over fine 45 degree diffraction lines.

The prints are planes a few millimetres apart. The pointer tilts the pair, sliding the outline up to 9px one way and the fill 3px the other, and the outline drops a soft shadow onto the white that follows the tilt. Left alone, the tilt drifts on two slow sines, and every 2.4 to 4.6 seconds, from a seeded sequence, a new sheet goes through: the grain jumps, the ink gets fresh streaks and pinholes, and the outline slides over 520ms on cubic-bezier(0.85, 0, 0.15, 1) to a new misregistration 4 to 12px away. Pressing and holding pulls the outline and the foil onto the fill in about 400ms, as a translate and a squeeze of each finished layer; letting go slips them back a little slower.

The white is screen-print ink, not a flat fill: vertical streaks of thinner coverage on a 36px cell and 46 pinholes, all cut out of the fill so the sheet shows through. A static grain of a few percent sits on the orange. The runs are measured from the live face off an offscreen raster, so the squeeze fits whichever face loads.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/misprint-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 2 / 1, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-grotesk` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/misprint-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure each word's ink box off an offscreen raster, then squeeze each run horizontally to its set span: fill, outline and foil.
- Fill the outline word into a layer, stamp it RING_STAMPS times around a circle of radius RING into a second layer, and cut the original out with destination-out to leave an even band.
- Draw the foil words as a mask, fill a gradient through it with source-in, and lay the diffraction lines on with source-atop.
- Composite per frame: the grained sheet, the foil, the fill with streaks and pinholes cut out, the outline's shadow, then each line's band.
- Slide the planes by the tilt (PARALLAX_OUTLINE, PARALLAX_FILL, PARALLAX_FOIL), easing toward the pointer, or toward the idle drift when nobody points.
- Re-print on the seeded sheet sequence: a new grain offset and ink per sheet, and the outline sliding to the next shift over SHIFT_MS.
- Register on press by moving each layer to the fill's centre and squeezing it to the fill's span.
- Under reduced motion, draw the resting misprint once: no tilt, no re-print, the first sheet.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `GROUND` | #ff4d1a | The sheet. |
| `FILL` | #fff6ec | The white ink. |
| `OUTLINE` | #111111 | The sharp outline pass. |
| `FOIL_STOPS` | ["#b8f3d8", "#d8c4ff", "#cfefff", "#ffd6b8"] | The foil's colours around its cycle. |
| `LINES` | HOLD and ON with their fill and outline spans | The words and where each print sits. The outline span wider than the fill span is the misprint. |
| `PULL_MIN` | 2.4 | The shortest time a sheet stays on the press, in seconds. |
| `PULL_MAX` | 4.6 | The longest time a sheet stays on the press, in seconds. |
| `PARALLAX_OUTLINE` | 9 | How far a full tilt slides the outline plane. |
| `FONT_VAR` | --visual-grotesk | The CSS variable holding the font family. Any bold grotesque works. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
