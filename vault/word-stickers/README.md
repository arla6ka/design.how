# Word stickers

Die-cut word stickers that pop in one by one, peel up when grabbed and fling with momentum.

Six die-cut word stickers in bright colour pairs scattered across a light page.

See it live at [design.how/vault/word-stickers](https://design.how/vault/word-stickers).

## How it works

The die-cut is drawn, not traced. Each word is stamped in the border colour many times around concentric rings out to the border width, about 16% of the type size, which dilates the silhouette into an even band; the word is then filled once on top in its own colour.

## Install

```bash
npx skills add https://design.how/vault/word-stickers
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-pixel`, a system stack in `fonts.css` (ui-monospace, monospace). Put your own face first.

## Knobs

- `STICKERS` (default six words, each with fill, outline and position). The words, their colour pairs and where each sits on the card.
- `GRAB_SCALE` (default 1.12). How much a grabbed sticker grows.
- `THROW_SCALE` (default 0.7). How much of the drag velocity a release keeps.
- `FRICTION` (default 0.92). Velocity kept per frame while a thrown sticker glides.
- `BOUNCE` (default 0.55). Speed kept when a sticker hits an edge.
- `PEEL_ELEVATION` (default 0.4). How high the curl lifts.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
