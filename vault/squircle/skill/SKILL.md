---
name: squircle
description: Builds a squircle in React and SVG, a rectangle whose corners are a superellipse instead of a circular arc, so curvature ramps in continuously and the corner flows into the edge without the kink a border-radius leaves, applied as a clip-path to a glossy, many-layered button surface. Use when someone asks for squircle corners, smooth or continuous corners, superellipse shapes, icon-style rounded rectangles, or a premium glossy button.
---

# Smooth corners

A glossy button whose corners are a superellipse that flows into the edge with no kink. See it live at https://design.how/vault/squircle.

## What to build

One small glossy button, 132 by 36, reading "Get the app" in a debossed near-black, centred on a pale grey plate. Its corners are the point. A border-radius is one circular arc per corner, and the arc meets the straight edge at a hard tangent, so curvature jumps from zero to its maximum in one step. Here each corner is a quarter of the superellipse |x|^n + |y|^n = 1 at n = 5, where curvature ramps in, so the corner eases into the edge.

The shape is an SVG path, built per size. At the default exponent each corner is a three-cubic fit of the superellipse on a unit box, scaled by the radius and rotated into place; any other exponent samples the curve in 32 segments. The radius is 0.42 of the element's height, so every control size gets the same corner, and smoothing scales how far the corner reaches along each edge, from 40 to 100 percent of the radius.

The path is applied as clip-path: path() to every layer of the surface, about eighteen near-transparent greyscale layers: a porcelain gradient, a corner vignette, a centre glow, fine grain, brushed streaks, a diagonal sweep, sheens top, middle and bottom, a glass rim, a grounding shadow, a fresnel edge and corner glints. The border is a gradient stroke on the same path, drawn at twice its width and clipped to the shape so only its inner half shows and the hairline stays even round the corner.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/squircle/`. It is React and TypeScript: `params.ts`, `superellipse.ts`, `squircle.tsx`, `glossy.tsx`, `styles.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 336, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/squircle` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Measure the element, then build its path: straight edges between four corners, each three cubics from the unit-corner fit scaled by the effective radius and rotated 90 degrees per corner.
- Take the effective radius as min(radius, half the short side) times (0.4 + 0.6 smoothing); sample the arc in 32 lines when the exponent is not 5.
- Clip every gloss layer to the path with clip-path: path(), and paint the body as a clipped gradient div.
- Stroke the same path at twice the border width, clipped to itself, so only the inner half shows.
- Set the label as gradient-clipped text over a 2px blurred dark copy, with stacked drop shadows for the deboss.
- Under reduced motion, keep the button still when pressed.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `radiusFor` | 0.42 of the height | The corner radius for a control height. |
| `SMOOTHING` | 1 | How far the corner reaches along each edge. |
| `EXPONENT` | 5 | The superellipse exponent: 2 is a circle, higher is boxier. |
| `BUTTON_W, CONTROL_H` | 132, 36 | The button's size in design pixels. |
| `LABEL` | "Get the app" | The button text. |
| `GROUND` | #f6f7f9 | The plate colour. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the label's family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
