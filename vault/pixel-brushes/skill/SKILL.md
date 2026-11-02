---
name: pixel-brushes
description: Builds pixel brushes on Canvas 2D, where a brush is a small stamp of square cells dropped along a path and five numbers (spacing, jitter, scatter, follow and speed thinning) turn the same code into a crisp line, a combed ribbon or a loose spray, every cell snapped to whole device pixels. Use when someone asks for a pixel brush, a stamp brush engine, a drawing tool with hard pixel edges, a spray or scatter brush, or brush swatches that draw themselves in.
---

# Pixel brushes

A brush is one small shape stamped along a path, and five numbers turn it into a crisp line or a loose spray. See it live at https://design.how/vault/pixel-brushes.

## What to build

The card is a sheet of three swatches, side by side on one off-white paper. Each is the same spiral, two and a bit turns, stamped with a different brush in its own ink: a pink ribbon of three-cell bars that follows the curve, a blue spray of single squares, and a green drift of squares thrown a full stamp off the line. They draw themselves in 180 ms apart, 900 ms each with an ease-out, and then the loop stops on a still sheet.

A brush is a stamp, one or more square cells in a -1 to 1 box each with its own alpha, plus five numbers. The engine walks the path by arc length and drops a stamp every spacing times the stamp size. Jitter moves the stamp across the path, which makes the line wander without breaking. Scatter throws it in a random direction, which breaks the line into a spray. Follow rotates the stamp with the path, so a bar reads as a ribbon instead of a grid the line passes through. Speed thinning shrinks the stamp as the path speeds up, which tapers the stroke. A hue drift can walk the ink's hue along the stroke.

Hard edges are the point, so every cell is a fillRect snapped to whole device pixels: sizes rounded, origins floored, drawn with the transform reset. The randomness is a hash of the stamp's index, not Math.random, so a brush on a path always makes the same mark and a resize never reshuffles it. The spiral's radius grows with t to the 0.72, so its turns do not crowd the centre, and its speed rises outward, so the speed-sensitive brushes taper toward the tail.

The playground keeps every number on a slider, lets you draw on the sheet with the pointer, and its Remix invents a brush that is in no list (a ring, a comb, a cross, a spatter, a nib or a weave) with an ink and paper pushed apart until they read.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/pixel-brushes/`. It is React and TypeScript: `params.ts`, `engine.ts`, `playground.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/pixel-brushes` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Walk the path by arc length and drop a stamp every max(1, size * spacing) device pixels.
- Offset each stamp perpendicular to travel by jitter and radially by scatter, both from a hash of the stamp index.
- Rotate the stamp's cells by the path angle times follow, and scale it by 1 - speedSize * speed * 0.55.
- Draw each cell with fillRect at a rounded size and floored origin in device pixels, with the transform reset.
- For the card, draw three spirals with an ease-out progress staggered per swatch, and stop the loop once the last has landed.
- Under reduced motion, draw the finished sheet once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SHOWN` | rows, scatter-heavy, cluster | Which three brushes from BRUSHES the card shows. |
| `BRUSHES` | twelve brushes, line to spray | The set: each a stamp and its five numbers. |
| `INKS, PAPER_BG` | pink, blue, green on #fbf9f7 | One ink per swatch and the shared paper. |
| `DRAW_MS, STAGGER_MS` | 900, 180 | How long a swatch takes to draw, and the gap between starts. |
| `TWEAKS` | the spray at size 0.075, spacing 0.4 | Per-card overrides of a brush's numbers. |
