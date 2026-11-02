---
name: glitch-word
description: Builds a DOM glitch effect in which a word and its badge are stacked as identical copies, clipped into horizontal bands and shoved sideways in stepped Web Animations bursts, while letters flicker into lookalikes and the badge leans toward the pointer. Use when someone asks for a glitch text effect, a corrupted or broken-signal word, a tearing headline, a datamosh-style label, or a hover glitch on a button.
---

# Glitch word

A word in a bright badge that tears into shoved bands in short bursts. See it live at https://design.how/vault/glitch-word.

## What to build

A small rounded green badge holds the word "glitching" in white, sized at 5.7 percent of the card width (30px on a 528px card), centred on a pale grey card. Most of the time it sits still. Every 1.8 seconds a burst runs through about a third of the cycle: the badge and the word tear into thin horizontal bands that jump sideways, the whole unit shakes, its corners flex, and a few letters flicker into near-lookalikes before snapping back.

The tear is ten identical copies of the badge and the word stacked in one grid cell over the original. Each copy is clipped to a band by clip-path and shoved by a transform, so the coloured block and the glyphs move together. The copies carry no tint and no colour split: identical displaced copies read as a bad decode, coloured ones read as a rainbow. One band per burst, chosen at random, is shoved three times harder, and about every eight to thirteen bursts the entire unit drops out for one step.

The keyframes are regenerated every cycle, run with a steps() easing so the bands snap rather than slide, and chained off the first animation's finished promise so a throttled tab never queues catch-up bursts. The burst intensity follows an envelope with a fast attack at 30 percent of the span and a long release. Letters swap on 50ms ticks, every other tick restores the real word, and the swaps are gated by the same envelope. Each copy's badge drifts slowly through a narrow band of greens with its own delay, so a band cut through the block shows a seam.

Under a fine pointer the card switches to the active preset, a 340ms cycle that barely rests, and the badge moves 18 percent of the pointer's offset toward it, falling off with the squared distance and springing back on leave.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/glitch-word/`. It is React and TypeScript: `params.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-grotesk` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/glitch-word` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Stack the resting word, the live word and LAYERS copies in one grid cell, each copy holding the badge and the text, with an invisible copy of the resting word holding the width.
- Each cycle, build fresh keyframes per copy: opacity, a clip-path band between minHeight and maxHeight of the box, and a sideways shove up to maxOffset, scaled by the burst envelope.
- Play them with steps(velocity times duration, jump-start), animate the shake on the base and an eased corner-radius wobble on the base badge, and start the next cycle from the first animation's finished promise.
- Scramble letters to lookalikes on a timer gated by the same envelope, restoring the real word on every other tick.
- Register the badge colour with @property and drift it per badge with a negative delay per copy, paused with the rest when off screen.
- Under reduced motion, never start: the clean word in its badge is the still.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `WORD` | "glitching" | The word that tears. |
| `LAYERS` | 10 | How many copies are stacked. Keep it at least the largest sliceCount. |
| `IDLE` | 1800ms cycle, 7 slices, 20% shove | The resting burst preset. |
| `ACTIVE` | 340ms cycle, 10 slices, 38% shove | The preset under the pointer. |
| `WORD_SIZE` | 5.7 | The word size in cqw of the card. The badge is sized in em, so it follows. |
| `GREENS` | #1aa251 and three neighbours | The stops the badge colour drifts through. |
| `GROUND` | #f7f7f7 | The card colour. |
| `FONT_VAR` | --visual-grotesk | The CSS variable holding the word's family. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
