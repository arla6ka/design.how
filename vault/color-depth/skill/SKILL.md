---
name: color-depth
description: Builds skeuomorphic CSS buttons whose depth comes only from stacked layers on one pill, a gradient body, inset shadows for the bevel and the inner glow, a brighter layer that fades in on hover and a soft bar of light along the top, in ten recipes from glossy and glowing to brushed metal, foil, inset, glass and satin. Use when someone asks for a glossy button, a 3D or tactile button, skeuomorphic UI, a glowing call to action, a glass or metal button, or button depth in CSS.
---

# Colour depth

Buttons that look like real objects, glossy or lit from inside, from gradients and inset shadows alone. See it live at https://design.how/vault/color-depth.

## What to build

Two pills reading "Get Started" sit side by side on a pale plate, 44px tall with a 15px medium label. The first is glossy orange: a vertical gradient from amber to burnt orange, a pale inner rim, a darker inset pooling at the bottom, a soft coloured drop shadow and, along the top, a 28px bar of white fading downward, blurred one pixel, that rises and brightens on hover. The second is violet and lit from within: a dark-to-bright purple body ringed by inset glows, and on hover a second, brighter body fades in over it.

Every recipe is the same element and one class. The depth is layered paint, not geometry: the body is a gradient, the bevel and the glow are stacks of inset box-shadows, ::before holds the hover state as a full second skin that only changes opacity, and ::after holds the highlight. Nothing is measured or drawn per frame, so a recipe drops onto any button.

Ten recipes share the pill: glossy, glow, brushed metal with a pointer-following highlight, holographic foil that drifts, layered, inset, glass that refracts its backdrop through an SVG displacement filter, a neon-like tube, duotone and satin. The metal and foil recipes read the pointer into custom properties on the next frame after a move.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/color-depth/`. It is React and TypeScript: `params.ts`, `recipes.ts`, `styles.ts`, `glass-filter.tsx`, `depth-button.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 336, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/color-depth` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Make one pill: inline-flex, 44px tall, 22px side padding, fully rounded, isolation isolate and overflow hidden, with ::before and ::after as full-size layers under the label.
- Give the recipe class a gradient body and a stack of inset box-shadows for the rim, the bottom shade and the inner glow, plus one soft outer shadow.
- Put the hover state in ::before as a second, brighter body at opacity 0 and fade it to 1 on hover.
- For the glossy highlight, put a blurred white-to-clear bar in ::after across the top and lift and brighten it on hover.
- For the glass recipe, set backdrop-filter to an SVG filter that displaces the backdrop per colour channel from a fixed gradient map.
- For metal and foil, write the pointer's position into custom properties on the next animation frame and centre them on leave.
- Under reduced motion, stop the foil drift and keep the pointer light centred.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SHOWCASE` | glossy and glow | The recipes the card shows. |
| `RECIPES` | ten recipes | Each recipe's name, class, note and best backdrop, in recipes.ts. |
| `LABEL` | "Get Started" | The pill text, in recipes.ts. |
| `GROUND` | #f8f9fb | The plate colour. |
| `DESIGN_WIDTH` | 528 | The card width the pills are sized at. |
