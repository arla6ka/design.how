# Loud burst

A sentence types itself in, one word heats up and bursts into coloured darts, and the line is thrown off the sides.

The sentence make it bold then ship in deep blue on white paper, with bold already flying apart into red and orange darts.

See it live at [design.how/vault/loud-burst](https://design.how/vault/loud-burst).

## How it works

The loop is 51 ticks at 34 a second, 1.5 seconds, and the engine redraws only when the tick changes. Words arrive every 2 ticks: the first lands alone at twice its size, the rest at 1.35 times from one em to the right, each shrinking as a follower that keeps 62 percent of its excess a tick and thumping with a one-tick squash as it lands.

## Install

```bash
npx skills add https://design.how/vault/loud-burst
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `SENTENCES` (default four sentences, each with a burst word index and a four-ink scheme). The lines and their colours. Keep the burst word away from the first and last place.
- `PAPER` (default #fdfdfd). The paper.
- `INK` (default #1b1b1b). The base ink the body words lean from.
- `BODY_TINT` (default 0.45). How far the body words lean from INK toward the scheme's body ink.
- `FPS` (default 34). Ticks a second; the tables are indexed by tick.
- `FLECK_COUNT` (default 14). Round ink dabs sprayed from the core of the burst.
- `FONT_CSS` (default var(--visual-sans)). The font family. Any grotesque at semibold works; the burst is scanned from it.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
