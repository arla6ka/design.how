---
name: cursors
description: Builds a DOM multiplayer scene in which labelled collaborator cursors, each a coloured pointer arrow with a name tag and a soft colour blush, drift around a frosted-glass word on slow ellipses and scatter away from the real pointer. Use when someone asks for multiplayer cursors, live collaboration presence, fake teammates on a hero, a shared canvas feel, or a frosted glass text effect.
---

# Cursors

Three labelled collaborator cursors orbit a frosted-glass word and scatter from your pointer. See it live at https://design.how/vault/cursors.

## What to build

A near-white card with one word, "Multiplayer", set large in a plain serif as frosted glass, and three collaborator cursors flying around it: an indigo, a red and a green pointer arrow, each with a rounded name tag that hangs off its tip and a 300px blurred blush of its colour that tints the word as it passes, blended with soft-light so the ink is coloured without washing out.

Each cursor rides its own ellipse around a centre spread across the card, alternating high and low, with radii of about a sixth of the width and a fifth of the height, phase-shifted by a third of a turn and running at 0.5, 0.68 and 0.86 times a shared clock, with the vertical term at 1.15 times the horizontal so the loops never close into circles. Each eases 12 percent of the way to its target per frame. Within 220px of the real pointer the target is pushed up to 120px straight away from it, so moving over the card scatters them and leaving lets them drift home.

The glass is stacked copies of the word: a sharp copy masked to fade out toward the bottom, a 2px blurred copy masked the opposite way, two faint offset and blurred twins for refraction depth, a 9px backlit halo, a specular sheen on the top third, and a rounded chip of white gradient, inset bevels and a soft drop shadow over it all. The word is tilted one degree, with a radial glow of the ground behind it.

The cursors are built as plain DOM by a framework-free class, positioned in design pixels at a 600px card and scaled up with a wider one; the word sizes with the card width.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/cursors/`. It is React and TypeScript: `params.ts`, `engine.ts`, `frosted-word.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/cursors` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Create each cursor as an SVG arrow plus a name span, and a separate 300px radial blush in its colour with mix-blend-mode soft-light, all absolutely placed in an untransformed layer.
- Give cursor i an ellipse: centre x at 0.32 + 0.36 (i + 0.5) / n of the width, centre y alternating 0.34 and 0.66 of the height, and speed 0.5 + 0.18 i.
- Each frame, advance the clock by 0.006, take the point on the ellipse with the vertical term at 1.15 times the angle, and push it away from the pointer by (1 - d / 220) times 120px.
- Ease each cursor 12 percent toward its point and write translate and scale straight to its transform.
- Build the frosted word from stacked, masked and blurred copies under a gradient glass chip.
- Under reduced motion, draw every cursor at one fixed time of its orbit, without easing, and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `CURSORS` | Wexel, Orbo and Visitor in indigo, red and green | The collaborators: names and colours. |
| `WORD` | "Multiplayer" | The frosted word in the middle. |
| `GROUND` | #fcfcfc | The card colour, also the glow behind the word. |
| `INK` | #1b1b1b | The word's colour. |
| `WORD_FONT` | ui-serif, Georgia, serif | The word's family. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the name tags' family. |
| `DESIGN_WIDTH` | 600 | The card width the cursor sizes and orbits are tuned at. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
