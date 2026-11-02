---
name: ai-lights
description: Builds a glowing UI component in React and CSS in which one body morphs between four agent-tool surfaces (a workflow chain, a progress row, a terminal and a prompt bar) and each change is announced by a pulse of rainbow light running round its rim, made from a conic gradient on registered custom properties seen through canvas-drawn, blurred stroke masks. Use when someone asks for an AI glow, a glowing border, an animated rim light, a thinking or working state for an agent UI, or a component that morphs between shapes.
---

# AI lights

One body that becomes four agent UI components in turn, each announced by a pulse of light around its rim. See it live at https://design.how/vault/ai-lights.

## What to build

A single white component sits in the middle of a pale tinted card. Every 2.6 seconds a pulse of light runs round its rim, a tight comet of five hues that fades up, swings back and blooms open as it dies, and then the component becomes something else: a three-step workflow chain with the middle step running, a one-line progress row with a spinner, an inverted terminal, a prompt bar with a send button. It is one element the whole time. Its width, height and corner radius animate to the measured size of the next component.

The glow is a conic gradient, seen through a mask. The gradient packs its five colours into about 84 degrees of the circle, so it reads as a travelling comet, not a spinning disc, and its start angle and stops animate through registered custom properties over 1.6 seconds. The masks are drawn on a canvas: the body's rounded rect, stroked with a conic of opacity that is clear across two thirds of the circle, then blurred. Five layers at rising stroke width and blur build the falloff, the first a crisp 1 px ring carved out of a fill, and every layer is drawn twice, the second mirrored, because the lit arc sits on one side.

The timeline is three beats that never overlap: the light runs once; 120 ms after it has gone the contents fade out over 160 ms; then the empty body morphs for 380 ms and the new contents rise in letter by letter. Morphing in the dark is what makes it cheap. A mask is a PNG for one box, so a glow chasing a moving edge would need it redrawn every frame; here the glow layers leave the render tree during the morph and the mask is rebuilt once, 90 ms after the box stops. Each pulse rolls a new palette: one random anchor hue walking an arc of 90 to 190 degrees, with fixed saturation and lightness, and the card's background takes three pale tints of the same arc.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/ai-lights/`. It is React and TypeScript: `params.ts`, `mask.ts`, `styles.ts`, `engine.ts`, `variants.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` and `--visual-mono` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/ai-lights` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure every variant off screen once, and animate one body's width, height and radius to the current variant's box.
- Draw each glow layer's mask on a canvas: a rounded rect stroked with an opacity conic, blurred, exported as a data URL, cached by geometry.
- Paint each layer with a conic gradient whose start angle and stops are registered custom properties, animated by one keyframe rule; draw it twice, mirrored.
- Replay the pulse by setting data-playing false and back to true two frames apart, after rolling a palette from one anchor hue along an arc.
- Hand over in three beats with no overlap, and take the glow layers out of the tree while the body morphs.
- Under reduced motion, show the first component with the rim held lit as a quarter of the way into a pulse.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `VARIANTS` | chain, progress, terminal, prompt | The components, each its contents, a corner radius and a padding. |
| `PULSE_MS` | 1600 | One pulse of light. Keep the CSS animation in step. |
| `MORPH_MS, FADE_OUT_MS, SETTLED_MS` | 380, 160, 260 | The handover's beats; the gap between pulses is derived from them. |
| `RIM_LAYERS` | a 1 px ring and four blurred strokes | The glow's falloff. |
| `RIM_STOPS` | lit from 347 round to 54 degrees | How much of the rim can light. |
| `ARC_MIN, ARC_MAX` | 90, 190 | How far round the wheel each pulse's palette walks. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
| `--visual-mono` in fonts.css | ui-monospace, monospace | The typeface for this role, a monospace face. Put the project's face first. |
