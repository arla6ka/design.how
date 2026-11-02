---
name: holo
description: Builds a holographic card in CSS 3D in which an identity card tilts toward the pointer, a stack of rainbow foil layers above the print slides by parallax and arrives a beat after the card, a glare and sheen follow the light, and the picture tile is a hard duotone that flips its polarity past a certain tilt, in ten foil materials. Use when someone asks for a holo or holographic card, a foil effect, a tilting 3D card, a trading-card shine, an ID or membership card, or iridescent CSS.
---

# Holo

An identity card that tilts in 3D while a holographic foil slides over it and the picture flips its colours. See it live at https://design.how/vault/holo.

## What to build

A landscape identity card, 1.55 to 1 like a credit card, sits in the middle of a soft grey ground and reads "Wanderer, member since May 2023", with a small picture tile in its corner. It tilts toward the pointer in real 3D, up to 14 degrees, under an 1100px perspective. A holographic foil above the printed surface slides as it moves, its bands catching the light, a glare and a sheen ride across, and a faint heart pattern comes up on the side you turned while the other side presses into the print. With no pointer it wanders on its own, slowly, on two rates that never line up.

The lag is the effect. Two followers chase their targets at different weights: the card at 0.16 of the gap per frame and the foil at 0.09, so the surface catches up to the card a few frames late instead of moving with it, which is most of what separates this from a gradient following a cursor. The pointer takes the card with an eased pick-up from wherever it had drifted, gives it back with an eased release into the drift, and a flick on leave throws it a little past rest by the speed it left at.

All of it is CSS. The card is a stack of layers, a fixed print, two pattern passes, three foil slots, a velocity smear, a flare, grain, glare and sheen, the content, and the tile with its own nine layers. The loop writes a few dozen custom properties per frame, the rotation, each layer's offset, opacity and blend, the glare's position, and the stylesheet reads them; nothing in CSS animates. A material is the paint of the three foil slots, how far the sheet slides per unit of tilt and how hard it comes up off face-on; ten materials range from a sparkle field to a conic swirl to brushed metal.

The tile is a different material on purpose: a hard two-colour duotone with a highlight but no rainbow. Past a certain tilt the two colours trade places, swept across by a travelling mask over a negative copy, because a filter cannot invert part of an element. The picture is drawn as SVG, so nothing loads.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/holo/`. It is React and TypeScript: `params.ts`, `tile-image.ts`, `engine.ts`, `tilt.ts`, `styles.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/holo` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Build the card as absolutely stacked layers inside an element with transform-style preserve-3d and rotateX and rotateY from custom properties, under a parent perspective of 1100px.
- Follow the target with two exponential followers, 0.16 for the card and 0.09 for the foil, and drive the foil from the foil follower so it arrives late.
- Untouched, set the target from sin and cos of a slow clock at two incommensurate rates; ease the target from the pointer back into that drift over about a second, and in from the drift to the pointer the same way.
- On leave, fire a decaying kick along the release velocity and add it on top of the target.
- Each frame, write the tilt, each foil layer's offset from the sheet times the material's parallax, the bloom off face-on, the glare position and the tile's flip as custom properties.
- Flip the tile's duotone past a tilt by sweeping a mask across a negative copy of the picture.
- Under reduced motion, lay the card flat with its foil at rest and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `CARD_NAME, CARD_LINE` | "Wanderer", "member since May 2023" | What the card says. |
| `FOILS` | ten materials, Holo first | The foil materials, in engine.ts: each one's layers, parallax, bloom and glare. |
| `MAX_TILT` | 14 | The most the card turns, in degrees. |
| `TILE_IMAGE` | a sun over two ridges and a lake | The picture on the tile, in tile-image.ts. |
| `GROUND` | a soft grey fall-off | The card's surroundings. |
| `DESIGN_WIDTH` | 528 | The card width the corners and type are tuned at; a wider card scales up. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
