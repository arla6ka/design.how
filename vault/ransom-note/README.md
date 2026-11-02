# Ransom note

Short phrases spelled in mismatched paper scraps that rise in one by one, hold and lift away.

The words stay weird spelled in mismatched paper scraps, each letter on its own colour, tilted.

See it live at [design.how/vault/ransom-note](https://design.how/vault/ransom-note).

## How it works

Every scrap is drawn, not loaded. A seeded generator, hashed from the phrase, picks a paper and one of the inks that read on it, a face and weight from a short list of serifs, grotesques, monospaces and a pixel face, a case, an occasional italic or outlined letter, padding, and a cut: a rectangle whose four corners move in a little, sometimes with an extra notch on the top or bottom edge, applied as a clip-path polygon.

## Install

```bash
npx skills add https://design.how/vault/ransom-note
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-serif` and `--visual-display` and `--visual-grotesk` and `--visual-sans` and `--visual-wide` and `--visual-mono` and `--visual-pixel`, a system stack in `fonts.css` (Georgia, serif; Georgia, serif; system-ui, sans-serif; system-ui, sans-serif; system-ui, sans-serif; ui-monospace, monospace; ui-monospace, monospace). Put your own face first.

## Knobs

- `PHRASES` (default six short phrases). What the note says, in turn.
- `JITTER` (default rot 8, dy 0.06, scale 0.12, gap 0.05). How messy the line is.
- `PAPERS` (default ten papers with their inks). The sheets a scrap can be cut from.
- `FACES` (default eight families). The faces a letter can be set in, as CSS variables with fallbacks.
- `REVEAL_HOLD` (default 1800). How long a phrase holds.
- `GROUND` (default #fcfcfc). The card colour.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
