---
name: typer
description: Builds a character-by-character text reveal in DOM and CSS in which a wave runs across a line and each letter flickers through randomized states, a filled pill, an inverse block, an accent, an outlined pill, before settling into plain text, with neighbouring letters in the same state merging into one rounded bar, themed by four CSS variables. Use when someone asks for a text reveal, a scramble or decode headline, typing text, a glitchy type-in, or animated pills behind letters.
---

# Typer

A line that types itself in, each letter flickering through pills and highlights before it lands. See it live at https://design.how/vault/typer.

## What to build

One line of semibold text sits in the middle of a coloured card. It types itself in: a wave runs across the line, and as it passes each letter, the letter rolls through three random states, a solid pill, an inverse block, a coloured accent, an accent pill or an outlined pill, before it lands on the plain letter. Every 1.8 seconds the card switches to another of thirteen looks, each its own palette, state pool and timing, and types the line in again.

The engine wraps each character in a span and runs a frame loop at the look's rate, 20 frames a second by default, for about a second plus one percent per letter. Progress is normalised across the line, and each character gets its own control point on a bezier, so the wave of state changes ripples instead of marching. Once the wave has passed a character it spends the first half of the remaining frames rolling through its states and the rest settled, and its progress is quantised so a glyph holds each state for a beat instead of flickering every frame.

All of the look is CSS. A state is a class, and the classes paint the pill, the inverse, the accent and the outline from four custom properties: the ink, the knockout inside a filled pill, the accent surface and the text on an accent. The merging is pure selectors: a filled character followed by another loses its right-hand radius, one preceded by another loses both, and the last of a run gets its right corners back, so a run reads as one rounded bar. The outlined pill drops the inner borders the same way.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/typer/`. It is React and TypeScript: `params.ts`, `presets.ts`, `typer.ts`, `styles.ts`, `lines.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 520, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-sans` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
7. Run `node scripts/check.mjs components/typer` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Split the line into words and characters, one span each, inside a [data-typer] element, and start it at opacity 0.
- Run a setInterval at fps for fps times (1 + 0.01 times the letter count) frames, and per frame give each character a class from its progress against its own bezier control point.
- For a character the wave has passed, pick cycles random states from the pool, quantised so each holds for a beat, then settle to plain text.
- Paint each state in CSS from --typer-fg, --typer-bg, --typer-accent and --typer-accent-ink, and merge runs with :has(+ .state) and .state + .state radius rules.
- Cascade several lines with a per-line delay of STAGGER seconds.
- Under reduced motion, build the line visible and never start the loop.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `LINES` | ["design engineered by hand :)"] | The text, one entry per line. |
| `PRESETS` | 13 looks | Each look's four colours, state pool, frame rate and number of states, in presets.ts. |
| `REPLAY_MS` | 1800 | How long each look holds before the next types in. |
| `STAGGER` | 0.15 | Seconds between lines starting. |
| `SIZE_CQW, SIZE_MIN` | 5.8, 16 | The type size as a share of the card width, and its floor in px. |
| `FONT_VAR` | --visual-sans | The CSS variable holding the family. |
| `--visual-sans` in fonts.css | system-ui, sans-serif | The typeface for this role, a plain grotesque. Put the project's face first. |
