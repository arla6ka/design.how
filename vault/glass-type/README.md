# Glass type

Black serif type moving through one glass lens with a ripple in it, in three scenes that take turns.

Black serif type on white, bowed and smeared toward the rim of an invisible glass lens.

See it live at [design.how/vault/glass-type](https://design.how/vault/glass-type).

## How it works

The type never animates. Each word is rasterised once to a texture at twice the canvas resolution, and only a content offset moves through one radial lens law: magnification 1 + str * rn^pow + rip * sin(2 pi r / wave - phase), with the ripple faded in toward the rim.

## Install

```bash
npx skills add https://design.how/vault/glass-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

It sets its type in `--visual-display`, a system stack in `fonts.css` (Georgia, serif). Put your own face first.

## Knobs

- `A_TEXT` (default (clear) your view). The line that rises through the first scene.
- `B_WORDS` (default ["Slow Light", "Refraction"]). The two words the glass ball swaps between.
- `C_WORDS` (default ["Light", "is", "soft"]). The three words that convey through the wave.
- `LENS` (default {a, b, c}: radius, str, pow, rip, wave, rim0). The lens per scene: how hard it magnifies, how strong and tight the ripple is, and where the ripple starts.
- `DISPERSE` (default 0.016). How far the colour channels split at the rim. Much more turns into a novelty fringe.
- `SCENE_SECONDS` (default 5). How long each scene plays before handing over at its next loop end.
- `POINTER_PULL` (default 0.72). How far the lens centre follows the mouse. 0 turns it off.
- `INK, PAPER` (default #0a0a0a, #ffffff). The type and ground colours.
- `FONT_VAR, FONT_WEIGHT` (default --visual-display, 500). The CSS variable holding the font family, and its weight. A high-contrast serif gives the lens hairlines to break.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
