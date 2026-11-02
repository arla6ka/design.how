---
name: loud-burst
description: Builds an exploding-word type loop on Canvas 2D, in which a short sentence types itself onto paper word by word with an oversized landing, a squash and a blurred last word, then one word heats to a scheme ink, trembles and bursts, its glyphs scanned into horizontal ink runs that each morph into a tapered dart flying along measured keyframe paths while crossfading between real print inks, with a shockwave, flecks, a camera kick and the side words thrown out, a new sentence and palette every loop. Use when someone asks for an exploding word, text that bursts into confetti or strokes, a punchy kinetic sentence, or a typographic explosion.
---

# Loud burst

A sentence types itself in, one word heats up and bursts into coloured darts, and the line is thrown off the sides. See it live at https://design.how/vault/loud-burst.

## What to build

Four short sentences take turns, one per loop, each on its own four-ink print scheme: make it bold then ship, good design shouts then leaves, break the grid then go, sketch it loud then erase. The type is a grotesque at semibold, 12.2 percent of the card's height, a little below centre, on near-white paper, with the supporting words in one body ink leaned toward near-black and the middle word saved for the burst ink. Everything is mapped from a 700 by 392 reference frame by the card's height, centred, so the wide card gives the strokes room to fly.

The loop is 51 ticks at 34 a second, 1.5 seconds, and the engine redraws only when the tick changes. Words arrive every 2 ticks: the first lands alone at twice its size, the rest at 1.35 times from one em to the right, each shrinking as a follower that keeps 62 percent of its excess a tick and thumping with a one-tick squash as it lands. Most words arrive with a little blur that clears in three ticks; the last word arrives truly out of focus and resolves over six. When the second word lands, the line glides to its final place on a measured table with a 9 percent overshoot.

From tick 18 the burst word heats to its ink, from tick 24 it trembles with a jitter that ramps to full at the burst, and in the last three ticks it inhales, lifting and swelling a little. At tick 38 the word becomes the burst: each letter is cut into eight horizontal bands, each band's ink runs become segments, and each segment morphs over about three ticks from a slab of the letter into a tapered dart on one of the measured keyframe paths, staggered so the word sheds stroke by stroke. A dart is a filled shape that swells in the belly and runs to points, and its colour crossfades between the two scheme inks nearest its measured hue journey, never an HSL ramp.

Around it, the frame kicks and pulses for two ticks, a thin shockwave ring expands, 14 round flecks spray from the core, darts drag faint trails, and the side words zoom about the burst, are thrown outward, go ballistic and fade with speed streaks behind them. A few oversized sweeps cross the empty paper, two blank ticks pass, and the next sentence enters. All jitter comes from a seeded stream per sentence, so every appearance of a line is identical.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/loud-burst/`. It is React and TypeScript: `params.ts`, `strokes.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/loud-burst` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Pre-render each word of the sentence as a sprite in the body ink at twice resolution, from the live face.
- Tick the timeline at FPS and redraw only when the tick changes; at the wrap, apply the next sentence and roll its seeded stream.
- Land each word every ARRIVAL_STEP ticks oversized (ARRIVE_SCALE_FIRST, then ARRIVE_SCALE_REST), decaying by SCALE_RETAIN with a one-tick thump, blurred by BLUR_MOST or BLUR_LAST; glide the line on RECENTER.
- Heat the burst word from TINT_TICK, tremble it from SHAKE_TICK with a quadratic envelope, and inhale it before BURST_TICK.
- At BURST_TICK, scan each glyph into SEG_BANDS bands of ink runs and morph each run into a dart on a GROUPS keyframe path, colour crossfading between the nearest two scheme inks.
- Add the camera kick, the shockwave ring, the flecks and the trails; zoom, throw and fade the side words with streaks.
- Under reduced motion, draw tick 41 once: mid-burst, the sentence still readable at the edges.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `SENTENCES` | four sentences, each with a burst word index and a four-ink scheme | The lines and their colours. Keep the burst word away from the first and last place. |
| `PAPER` | #fdfdfd | The paper. |
| `INK` | #1b1b1b | The base ink the body words lean from. |
| `BODY_TINT` | 0.45 | How far the body words lean from INK toward the scheme's body ink. |
| `FPS` | 34 | Ticks a second; the tables are indexed by tick. |
| `FLECK_COUNT` | 14 | Round ink dabs sprayed from the core of the burst. |
| `FONT_CSS` | var(--visual-sans) | The font family. Any grotesque at semibold works; the burst is scanned from it. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
