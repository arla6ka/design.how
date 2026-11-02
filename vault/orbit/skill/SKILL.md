---
name: orbit
description: Builds a Canvas 2D swarm of twenty-six labelled multiplayer cursors riding an invisible sphere seen face on, its depth shown only by scale, fade and focus, around a thin breathing ring, spinning on a phrased rate with inertia, leaning and parting toward the pointer, and draggable with a throw. Use when someone asks for multiplayer or collaborative cursors, a presence or live-users hero, cursors orbiting a globe, a 3D swarm of labels on canvas, or a draggable spinning sphere of names.
---

# Orbit

Twenty-six labelled cursors ride an invisible sphere around a thin breathing ring, and the sphere can be thrown. See it live at https://design.how/vault/orbit.

## What to build

A near-white card holds a thin violet ring at its centre and twenty-six cursors, each an arrow with a rounded name pill in one of eight hues. They ride a sphere that is never drawn. Every cursor only grows, shrinks and fades, but because they all do it on one hidden globe the eye builds the volume at once. The ring is not the sphere's outline: it breathes between 0.23 and 0.27 of the height twice per spin, inside a sphere of radius 0.36, and the cursors always draw over it.

The projection is orthographic, so depth never moves a cursor sideways. It shows only as scale, linear in depth from a pill 0.057 of the height at the front to 0.020 at the back, and as opacity, full through the front half and gone below -0.85, so the deepest few vanish. A slab of depth of field softens the back. Points start Fibonacci-spread over the sphere with a little seeded jitter, so coverage is even but nothing reads as a grid.

The spin is integrated, not a function of time. A 27-second phrase sets a target rate: a long drift at 0.03 turns a second, a build, one fast pass at 0.45, a settle and a held beat. A spring gives the sphere mass, so a fast pass carries a little past and settles back, and cursors lag in proportion to acceleration. The spin axis leans 0.5 radians and nods and rolls on two slow sines of 17 and 23 seconds that never line up.

The pointer is followed across the whole window, so the card sees it coming. Cursors close to it come into focus, lift a little and turn their arrows toward it, and a moving pointer pushes them aside on sprung offsets, harder the faster it moves, while the card draws its own cursor labelled You. A drag injects rate into the same integrator, a vertical drag tips the axis, and a release throws the sphere, with friction bleeding the throw back into the phrase.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/orbit/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/orbit` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Spread the cursors over a unit sphere with the golden angle and seeded jitter; rotate the points by the spin and the wobbling axis each frame.
- Project orthographically: x and y straight onto the card, depth only into pill size, opacity and blur.
- Integrate the spin angle from a rate. Ease the rate toward the phrase's target through a damped spring, and add any drag or throw to the same rate.
- Measure every label from the live face at mount and again when the face loads; size pills from the measured widths.
- Draw back to front: ring first, then every cursor sorted by depth, the drawn pointer last.
- Track the pointer on the window, ease every pointer-driven value against real time, and never preventDefault a vertical touch.
- Under reduced motion, draw t = 2.6 seconds once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `CAST` | twenty-six first names in eight hues | The names and their colours. |
| `RING_COLOR` | #6B3EB5 | The ring. |
| `BG` | #fdfdfd | The ground. |
| `PHRASE` | 27 | Seconds in one phrase of drift, build, fast pass and settle. |
| `RATE_DRIFT, RATE_WHIP` | 0.03, 0.45 | The calm and the fast spin rate, in turns per second. |
| `MAG_RADIUS, MAG_FORCE` | 0.19, 5.2 | How far and how hard a moving pointer pushes cursors aside. |
| `THROW_FRICTION` | 1.25 | How fast a throw bleeds back into the phrase. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the label font family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
