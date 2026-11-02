---
name: word-carousel
description: Builds a Canvas 2D word carousel in which four words cycle through a small left slot, a big centre slot, a small right slot and a tiny slot hidden behind the big word, slamming one slot left about every half second on measured fat-tailed eases, with velocity-proportional motion blur and a colour that deepens with size. Use when someone asks for a rotating word, a text carousel or ticker, a kinetic headline that cycles nouns, a word slider with motion blur, or animated typography on canvas.
---

# Word carousel

Four words on a three-slot conveyor that slams one slot left every half second, with a fourth hidden tiny behind the big one. See it live at https://design.how/vault/word-carousel.

## What to build

Four words, Type, Grid, Color and Motion, sit on white in a regular-weight grotesque. Three are visible at once, a small word at 0.235 of the width, a big word at 0.49 and a small word at 0.745, and the fourth is parked at 0.145 scale directly behind the big word at 0.46, drawn underneath it at 40% alpha so it shows only through the letter gaps. Scales are 1, 0.35 and 0.145 of a font sized 107/450 of the card's height.

Every word hangs from one optical middle. Its baseline sits half a cap height below the card's centre at its own scale, so three sizes read as one quiet line. Colour follows size, mixing from a pale blue at the small slots to a deep ultramarine at the centre on the square of the scale, so the big word is unmistakably the deep tone and the gradient lives at the edges.

The loop is 1.97 seconds of four uneven steps, starting at 0.36, 0.78, 1.23 and 1.59 seconds, so one dwell holds visibly longer across the seam. Each word moves from one role to the next. The word leaving the left slot vanishes in one frame at the cut and reappears as the hidden tiny 0.09 seconds later. The departing words and the arriving word use two different measured eases, played through a monotone spline, and both tails are still creeping when the next step winds up, so the strip never fully stops. The arriving word overshoots the centre by 0.004 of the width and returns.

Motion blur is stamped, not filtered. Pose is a pure function of time, so the engine takes each word's pose now and 33 milliseconds ago and stamps it 4 to 18 times along that distance, more when it travels further, with alpha weighted toward the trailing edge as speed rises. A word below 0.3 scale, or one moving under 8/800 of the width per shutter, draws once and sharp.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/word-carousel/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/word-carousel` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Size the font as FONT times the canvas height and set every word's baseline at half the height plus half its scaled cap height.
- Give each word a role from (word - step) mod 4, and move it toward the next role's slot and scale through the arrive or depart ease.
- Find the step in flight from STEPS minus WINDUP, so consecutive steps chain with their tails still moving.
- Pop the left word out at the cut and back in as the hidden tiny after POP_IN_DELAY; draw the tiny first and the big word last.
- Mix the colour from INK_FAR to INK on the square of the normalised scale.
- Stamp moving words along the distance between their pose now and 33ms ago, the stamp count rising with travel.
- Under reduced motion, draw t = 0.15 once: the row settled.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORDS` | Type, Grid, Color, Motion | The four words. Exactly four, one per role. |
| `INK, INK_FAR` | #002fa7, #7fb2ff | The centre tone and the tone at the small slots. |
| `BG` | #ffffff | The ground. |
| `FONT_FAMILY` | sans-serif | The family the words are drawn in. Any plain grotesque works. |
| `SCALE_SMALL, SCALE_TINY` | 0.35, 0.145 | The side words and the hidden word, as fractions of the big word. |
| `TINY_ALPHA` | 0.4 | How much the hidden word shows through the big one. |
| `BLUR_STAMPS_MIN, BLUR_STAMPS_MAX` | 4, 18 | The range of stamps per moving word. |
