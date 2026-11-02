# Badge trail

Tiny coloured badges of design terms that slam in behind the pointer and flick away.

Four small coloured badges reading kerning, baseline, bezier and gamut in the middle of a white card.

See it live at [design.how/vault/badge-trail](https://design.how/vault/badge-trail).

## How it works

Badges never overlap. A candidate that would come within 3px of a live badge is skipped for that tick, and a badge drops only when 45ms and 14px have passed since the last, so a still pointer stacks nothing.

## Install

```bash
npx skills add https://design.how/vault/badge-trail
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-mono`, a system stack in `fonts.css` (ui-monospace, monospace). Put your own face first.

## Knobs

- `WORDS` (default 24 design terms). The vocabulary on the badges, in badges.ts.
- `COLORS` (default 10 vivid fills). The fills for the reduced-motion still, in badges.ts.
- `GROUND` (default #ffffff). The card colour.
- `FONT_PX` (default 11). The badge text size in design pixels.
- `DROP_MS, MIN_TRAVEL` (default 45, 14). How often and how far apart badges drop.
- `APPEAR_MS, HOLD_MS, FADE_MS` (default 110, 480, 240). The three phases of a badge's life.
- `MAX_LIVE` (default 22). The most badges on the card at once.
- `DESIGN_WIDTH` (default 600). The card width the lengths are tuned at; wider cards scale up.
- `FONT_VAR` (default --visual-mono). The CSS variable holding the monospace family.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
