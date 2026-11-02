---
name: spike-type
description: Builds a Canvas 2D knockout word whose traced outline is roughened and grown into hundreds of hand-drawn spikes, each a sliver walked out along a wandering spine and back, filled with the letters and wrapped by one outline of varying weight, breathing slowly and bending, stretching and warming in colour under the pointer. Use when someone asks for spiky, hairy or thorny type, a hand-drawn or ragged lettering effect, an illustrated wordmark, generative strokes around text, or an interactive outline effect on a word.
---

# Spike type

A word knocked out of a pale ground, its edge chewed ragged and bristling with hundreds of hand-drawn spikes. See it live at https://design.how/vault/spike-type.

## What to build

One word sits in the middle of a pale grey card, set heavy, white inside and outlined in ripe yellow, with its boundary chewed ragged and hundreds of fine spikes growing out of it. The spikes are the same white as the letters, because they are not separate objects: the word and its spikes are one shape, and one outline wraps the lot. It is nearly still. The density of the drawing is the subject.

The letterform is rasterised from the live face and traced into closed contours, and only then roughened, so the spikes grow from the chewed edge and inherit its irregularity. A spike is a stroke that goes out and comes back, not a triangle. Each one walks a wandering spine outward, and its two walls are offset from that spine by a half-width that tapers to nothing at the tip, so a bending spike becomes a hooked, lopsided sliver. Every spike is ray-tested against the letter raster at build time, clamped before it runs into another letter, and keeps the room it had left in front of it.

Everything expensive happens once per size. Each frame only scales and rotates already-built local paths, one per spike, so a thousand spikes stay affordable. The spikes breathe on a slow per-spike phase, 0.55 radians a second, swelling their length by up to 10% and swaying a little.

Under a fine pointer, spikes within 0.3 of the height bend away on a spring whose stiffness depends on their length, so long ones swing slowly and stubble pops and stops. A spike with room in front of it also grows into that room, and each letter leans a little toward the pointer on its own spring. The outline near the pointer warms from yellow toward leaf green through a 24-step ramp. The draw is one nonzero fill of every subpath for the mark, then the outline in short runs of nine points with their own widths, then the ground behind everything with destination-over.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/spike-type/`. It is React and TypeScript: `params.ts`, `outline.ts`, `spikes.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/spike-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Rasterise the word in the live face at WEIGHT 700, sized to leave room for the spikes, and trace it into closed contours.
- Roughen each contour after the trace, group contours into letters by horizontal overlap, and grow a spike every EVERY points.
- Build each spike as a closed sliver in local space around a wandering spine, ray-tested against the raster so it stops short of other letters.
- Each frame, scale and rotate each spike's local path by its breath, sway and sprung pointer bend; never regrow it.
- Fill every subpath once for the mark, stroke the outline in RUN-point segments with precomputed widths, then fill the ground behind with destination-over.
- Under reduced motion, draw one frame at rest with no pointer.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | melon | The word. Short words with round letters give the spikes the most edge. |
| `PALETTE` | ground #e4e4e8, mark #ffffff, line #ffc21e | The ground, the letters and spikes, and the outline. |
| `MAX_LEN` | 0.26 | The longest spike, as a fraction of the card's height. |
| `EVERY` | 3 | Edge points between spike roots. Lower is denser. |
| `BREATH_AMT, BREATH_RATE` | 0.1, 0.55 | How much and how fast the spikes breathe. |
| `REPEL` | 0.34 | How far the pointer bends spikes, in radians. |
| `HUE_TO` | 104 | The hue the outline warms to under the pointer. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
