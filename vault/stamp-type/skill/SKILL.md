---
name: stamp-type
description: Builds a kinetic-type poster on Canvas 2D, in which four lines of type on flat highlight bars hop in from the edges along fixed axis-aligned breakpoint tracks at a stepped 10Hz, park to be read and scatter off, every moving line stamping its silhouette where it just was as flat-colour residue that lives 0.8 seconds and vanishes at once, with overlapping passes whose trails flood the screen as the palette and words change. Use when someone asks for a kinetic poster, highlighted text that flies in, print-like motion trails, a bold typographic loop, or a quote animation.
---

# Stamp type

Four lines on highlight bars hop in, park and scatter, each leaving blocks of flat colour behind. See it live at https://design.how/vault/stamp-type.

## What to build

A looping kinetic-type poster on a 600 unit composition square, scaled to the card's height. Four lines of type in a grotesque at semibold, about 51 units of cap, each sit on a flat highlight bar, a rounded rectangle unioned with the text stroked fat in the bar colour, which is where the bumps under the descenders come from. A world is four flat colours and four lines: an electric blue field with spring green bars and black type first, then aubergine and coral, slate and butter, pine and mint, and a near-white field with ultramarine bars and white type. A line too long for its parked spot is condensed horizontally, never below 0.72, so all four lines stay one size.

The choreography is data: four fixed tracks of breakpoints, each a frame and the line's top-left, linearly interpolated, every hop moving along one axis only, never diagonal. The jagged pacing inside a hop is the easing; a smooth curve reads worse. Lines fly in over the first 28 frames, park for 48, 2.4 seconds at 20 frames a second, and scatter off by frame 93, moving on a two-frame cadence so consecutive frames often repeat, which gives the print-like snap.

One mechanism carries everything else. Whenever a line moves during a step, it stamps its whole silhouette, bar and type, where it just was, in the bar colour. A stamp sits unchanged for 16 frames, 0.8 seconds, then vanishes all at once, no fade, so it reads as printed residue rather than motion blur. The stamps are computed fresh each frame from the tracks, not accumulated, so a resize, a resume or a still always shows exactly the right residue.

The next world starts 12 frames before the last one ends. For that window two worlds are on stage, the old lines scattering in their bar colour and the new ones flying in with theirs, both leaving trails, and the field colour swaps five frames into the new pass, under the densest frame of it. The colour flood between worlds is the mechanism itself, with no transition code.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/stamp-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/stamp-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Scale the 600 unit composition square to the card's height and centre it.
- Measure each line's ink box from the live face and condense it horizontally to the room its track leaves at the parked position, down to CONDENSE_MIN.
- Draw each bar as a rounded rect around the ink box unioned with the text stroked BAR_STROKE wide in the bar colour, then the type on top.
- Place each line on its TRACKS breakpoints by linear interpolation of the frame, stepped on a STEP-frame cadence, with the park retimed to PARK_FRAMES.
- For each frame, stamp every line's silhouette at each step within the last STAMP_TTL frames in which it moved, and draw those stamps before the lines.
- Start each pass PASS_OVERLAP frames before the last one ends and swap the field colour FIELD_SWAP frames into it.
- Tick at TICK_MS and redraw only when the frame changes.
- Under reduced motion, draw the first world parked, halfway through its read.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORLDS` | five worlds, each a field, a bar, an ink and four lines | The palettes and the words. Keep the field and bar far apart in hue and value, and the ink near black or white. |
| `PARK_FRAMES` | 48 | How long the four lines sit still to be read. |
| `STAMP_TTL` | 16 | How long a trail stamp lives, in frames. |
| `PASS_OVERLAP` | 12 | How far the next pass overlaps the last; more gives a denser flood. |
| `CONDENSE_MIN` | 0.72 | The narrowest a long line may be condensed. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any semibold grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
