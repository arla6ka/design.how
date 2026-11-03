---
name: roll-type
description: Builds kinetic typography on Canvas 2D in which short phrases take turns word by word, each word rolling up off an unseen drum and folding flat while the next phrase rolls in from below, overshoots and settles, the moving words bending through a glass rod with a soft colour fringe, and the ground cutting hard to each phrase's colour. Use when someone asks for rolling text, a word-by-word headline loop, a drum or slot text transition, glass or refraction on moving type, or a hero line that cycles through phrases.
---

# Roll type

Three short phrases taking turns, every word rolling up out of sight through glass as the next phrase rolls in under it. See it live at https://design.how/vault/roll-type.

## What to build

Three phrases of one or two lines take turns on a 1080 by 608 scene, 16:9, scaled to the box as one unit. Each is set centred in a grotesque at medium weight, sized so a capital is 102 scene pixels tall, on baselines 292 and 421. Each phrase brings its own ground, ink and two fringe hues.

Words move one at a time, 100ms apart in reading order. A leaving word goes on its first frame: its ink centre rises to y 94 over 280ms and it folds flat over the last 120ms, its top leaning toward the centre line as if it turned away on a drum. 460ms after a phrase starts leaving, the next one's words rise from a flat line at y 493, unfold downward from their tops, overshoot their place by about 4% and settle over 480ms. At 600ms the ground cuts to the new phrase's colour, and any word still leaving goes with the old ground. Phrases leave every 2080ms, so three loop in 6.24 seconds.

Every word is drawn from a sprite of itself, at rest and in motion alike, so nothing changes the moment it starts to move. The glass grows with the word's speed, measured on its ink centre over three frames and eased, full at 26 scene pixels a frame. The sprite is cut into 28 strips that read from nearer the middle and widen there, as through a glass rod lying along the word, and two hues split up to 3.5 pixels apart along the motion under it.

The motion is three small tables authored at 25fps, one entry per 40ms key, read at a fractional key every frame so it plays smooth at the screen's rate. Each word gets one affine matrix: a scale, a lean and a move. The tables describe a roll, not the letters, so any words work.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/roll-type/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 16 / 9, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/roll-type` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the font so a capital is 102 scene pixels tall, then lay each line out centred from the live face's widths.
- Give each word a delay of 100ms times its index in reading order, for leaving and arriving alike.
- Leaving: read d, h and w from the exit table at (t - start) / 40, move the ink centre toward y 94 by d, scale by w and h about it, and lean the top toward the centre line by 1.8 times the fold.
- Arriving: read e, h and w from the enter table, move the ink top from y 493 to its place by e, and scale and lean the foot about the top, 0.9 times the fold.
- Start the next phrase arriving 460ms after the last one starts leaving, cut the ground to its colour at 600ms, and drop any word still leaving at the cut.
- Draw every word from a sprite of itself. Measure its speed on the ink centre over three frames and ease it; by that amount, cut the sprite into strips that magnify the middle and split two hues along the motion under it.
- Under reduced motion, draw the first phrase at rest once.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `DEFAULT_PHRASES` | three phrases on ultramarine, vermilion and black | The phrases, one or two lines of words each, with a ground, an ink and two fringe hues per phrase. |
| `STAGGER_MS` | 100 | The delay between one word and the next. |
| `PHRASE_MS` | 2080 | Time from one phrase leaving to the next. |
| `GLASS_SPEED` | 26 | The speed, in scene pixels a frame, at which the glass is at full strength. |
| `LENS` | 0.22 | How much the glass rod magnifies a moving word's middle. 0 turns the bend off. |
| `FRINGE` | 3.5 | How far the two hues split along the motion at full speed. 0 turns the fringe off. |
| `FONT_WEIGHT` | 500 | The weight the face is drawn at. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the font family. Any grotesque works. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
