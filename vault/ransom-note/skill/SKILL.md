---
name: ransom-note
description: Builds a ransom-note text effect in DOM and CSS in which every letter is its own cut paper scrap, a different paper colour, ink, face, weight and case with an irregular clip-path outline, given a seeded tilt, bounce and size so a line reads as hand assembled, rising in letter by letter and lifting away between phrases. Use when someone asks for ransom note text, cut-out magazine letters, a collage headline, a zine or punk type treatment, or mismatched letters.
---

# Ransom note

Short phrases spelled in mismatched paper scraps that rise in one by one, hold and lift away. See it live at https://design.how/vault/ransom-note.

## What to build

A near-white card holds one short phrase, "stay weird", then "make stuff", "be kind" and three more, each spelled in paper scraps: every letter on its own sheet, black on cream, yellow on black, white on red, set in a different face and weight, mostly in capitals, each tilted up to 8 degrees, nudged off the baseline and sized up or down by up to 12 percent. The scraps rise into place left to right, 26ms apart, unblurring as they land; the phrase holds for 1.8 seconds, then lifts and blurs away all at once as the next rises under it.

Every scrap is drawn, not loaded. A seeded generator, hashed from the phrase, picks a paper and one of the inks that read on it, a face and weight from a short list of serifs, grotesques, monospaces and a pixel face, a case, an occasional italic or outlined letter, padding, and a cut: a rectangle whose four corners move in a little, sometimes with an extra notch on the top or bottom edge, applied as a clip-path polygon. The same phrase always composes the same way, and a re-roll is a new seed.

The letter height is 7.2 percent of the card's width, and a phrase that runs wider than 86 percent of the card is shrunk once to fit. A double drop shadow lifts each scrap off the page. Resting the pointer on the card freezes the phrase, shown in full.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/ransom-note/`. It is React and TypeScript: `params.ts`, `compose.ts`, `line.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-serif` and `--visual-display` and `--visual-grotesk` and `--visual-sans` and `--visual-wide` and `--visual-mono` and `--visual-pixel` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/ransom-note` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Compose the phrase with a seeded mulberry32: per character, a paper, an ink, a face, a weight, a case, padding, a polygon cut, and a tilt, bounce, scale and gap from JITTER.
- Render each character as a span with the paper as background, the cut as clip-path, the letter in its face and ink, wrapped in a span that carries the tilt and the reveal.
- Reveal with transform, opacity and blur transitions over 460ms on an expo-out, staggered 26ms per scrap; hide the outgoing line in 240ms, all scraps together.
- Cycle phrases on timers: reveal, hold REVEAL_HOLD, swap to the next with the old line kept mounted while it leaves.
- Pause the cycle off screen, on a hidden tab and while the pointer rests on the card.
- Under reduced motion, show the first phrase in place and never start the cycle.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PHRASES` | six short phrases | What the note says, in turn. |
| `JITTER` | rot 8, dy 0.06, scale 0.12, gap 0.05 | How messy the line is. |
| `PAPERS` | ten papers with their inks | The sheets a scrap can be cut from. |
| `FACES` | eight families | The faces a letter can be set in, as CSS variables with fallbacks. |
| `REVEAL_HOLD` | 1800 | How long a phrase holds. |
| `GROUND` | #fcfcfc | The card colour. |
| `--visual-serif` in fonts.css | Georgia, serif | The typeface for this role, a heavy display serif. Put the project's face first. |
| `--visual-display` in fonts.css | Georgia, serif | The typeface for this role, a display face. Put the project's face first. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
| `--visual-wide` in fonts.css | system-ui, sans-serif | The typeface for this role, a wide or extended sans. Put the project's face first. |
| `--visual-mono` in fonts.css | ui-monospace, monospace | The typeface for this role, a monospace face. Put the project's face first. |
| `--visual-pixel` in fonts.css | ui-monospace, monospace | The typeface for this role, a pixel or bitmap face. Put the project's face first. |
