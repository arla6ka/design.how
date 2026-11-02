# Warp type

Six short sentences, half a second each, where the verb bends its own letters.

Six short sentences in pale mint on deep green, each one bent by its own verb.

See it live at [design.how/vault/warp-type](https://design.how/vault/warp-type).

## How it works

The sentence never changes once it is on screen. The verb changes what happens to it.

## Install

```bash
npx skills add https://design.how/vault/warp-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `DEFAULT_PHRASES` (default six "Design + verb + noun" lines). The sentences. Six scenes of one to three lines; the third scene takes three.
- `GROUND` (default #0b1a1f). The background colour.
- `INK` (default #d9f5ea). The type colour.
- `FONT_WEIGHT` (default 500). The weight the face is drawn at.
- `FONT_VAR` (default --visual-sans). The CSS variable holding the font family. Any grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
