# Cloud type

A line of white type that blows in as cloud, sharpens letter by letter, then lifts away as cloud again.

The words Drift into focus in white on a pale sky blue field, each edge fuzzy with fine grain.

See it live at [design.how/vault/cloud-type](https://design.how/vault/cloud-type).

## How it works

The trick is that cloud and letter are the same picture. Each glyph is a coverage mask with its own blur.

## Install

```bash
npx skills add https://design.how/vault/cloud-type
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-sans`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

## Knobs

- `GROUND` (default #d0edfa). The sky colour. Keep GROUND_RGB in step, since the shader reads that.
- `GLYPHS` (default Drift into focus). The fourteen letters and their rest boxes on the scene. A new line needs new boxes, measured from the face.
- `PLAY_RATE` (default 1.25). How fast the 150-frame timeline plays. 1 is the authored 30 fps.
- `DRIFT_PER_FRAME` (default 1.28). How far the line rises each frame, in scene pixels.
- `ENTRY.thr, EXIT.thr` (default 0.29, 0.27). Where the summed field is cut. Lower makes fatter cloud.
- `DITHER` (default {sigma: 1.8, bias: 0.5, reach: 6}). How wide the grain band is and how far it looks for a real edge.
- `WIND` (default {radius: 200, blur: 1, lift: 2.5}). How far the pointer reaches and how much it lifts and softens the letters near it.
- `FONT_VAR, FONT_WEIGHT` (default --visual-sans, 600). The CSS variable holding the font family, and its weight. Any grotesque works.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
