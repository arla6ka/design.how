---
name: badge-trail
description: Builds a DOM pointer trail that drops tiny uppercase monospace badges of design terms behind the cursor, each on a slowly walking hue, slamming in from behind the direction of travel, holding with a faint wobble and flicking out rotated, never overlapping, with a ghost cursor that draws the trail when nobody is pointing. Use when someone asks for a cursor trail, a mouse trail of tags or labels, a playful hover effect on a hero, or stickers that follow the pointer.
---

# Badge trail

Tiny coloured badges of design terms that slam in behind the pointer and flick away. See it live at https://design.how/vault/badge-trail.

## What to build

A plain white card. As the pointer moves, tiny badges drop behind it: an uppercase design term in black monospace at 11px on a vivid fill, 1px of vertical and 4px of horizontal padding, a 3px radius. Each lives 830ms. It slams in over 110ms from 5px back along the direction of travel, peaking at 3 percent over full size, holds for 480ms with a sub-pixel wobble and a 1 percent breath, then flicks out over 240ms, shrinking and turning 4 to 9 degrees. Its letters flicker through random characters for the first 130ms and lock left to right.

Badges never overlap. A candidate that would come within 3px of a live badge is skipped for that tick, and a badge drops only when 45ms and 14px have passed since the last, so a still pointer stacks nothing. Each new badge nudges neighbours within 64px up to 3px away; the push eases in and relaxes slowly, so the trail jostles instead of jumping. At most 22 are alive, older ones sit up to 6 percent smaller and 12 percent dimmer, and every fifteenth is an outline in its colour.

The colour walks. A hue advances 24 degrees per badge, so neighbours harmonise, and the pointer's speed sets saturation and lightness: a slow drag lays pale badges, a fast flick lays vivid ones. The words come from a shuffled bag of 24 terms, so none repeats until all have been used.

When nobody is pointing, a ghost cursor takes over 600ms after the pointer leaves, easing in over 420ms onto a broad loop with a faster, off-ratio doodle on each axis, so the card is alive before anyone reaches it. Every length is in design pixels at a 600px card and scales up with a wider one.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/badge-trail/`. It is React and TypeScript: `params.ts`, `badges.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-mono` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/badge-trail` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Keep the badges in a plain array in a requestAnimationFrame loop and hand a copy to the view each frame; draw each as an absolutely placed span.
- Each frame, follow the real pointer, or after GHOST_IDLE_MS the ghost loop blended in from where the pointer left.
- Drop a badge centred on the point only after DROP_MS and MIN_TRAVEL, clamped inside the card, and skip it if its box inflated by GAP hits a live one.
- Colour it from a hue walker, with saturation and lightness from the point's speed, and shove live neighbours by raising a target their offset chases.
- Drive opacity, scale, rotation and offset from the badge's age alone: slam, hold with a wobble, flick out.
- Measure the monospace advance from the live face once, so the overlap test fits any font.
- Under reduced motion, show four still badges centred and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | 24 design terms | The vocabulary on the badges, in badges.ts. |
| `COLORS` | 10 vivid fills | The fills for the reduced-motion still, in badges.ts. |
| `GROUND` | #ffffff | The card colour. |
| `FONT_PX` | 11 | The badge text size in design pixels. |
| `DROP_MS, MIN_TRAVEL` | 45, 14 | How often and how far apart badges drop. |
| `APPEAR_MS, HOLD_MS, FADE_MS` | 110, 480, 240 | The three phases of a badge's life. |
| `MAX_LIVE` | 22 | The most badges on the card at once. |
| `DESIGN_WIDTH` | 600 | The card width the lengths are tuned at; wider cards scale up. |
| `FONT_VAR` | --visual-mono | The CSS variable holding the monospace family. |
| `--visual-mono` in fonts.css | ui-monospace, monospace | The typeface for this role, a monospace face. Put the project's face first. |
