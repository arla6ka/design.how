# Sunset slam

A word squashes, slams forward into an extruded retro logo trailing a fan of dawn colour, cools to a sticker and unwinds.

The word sunset as a white sticker with an extruded fan of navy, violet and rose beneath it, on a dark sky.

See it live at [design.how/vault/sunset-slam](https://design.how/vault/sunset-slam).

## How it works

The motion is a measurement. The word box's width, its vertical centre and the fan's depth are per-frame tables over 89 frames at 25 fps, in pixels of a 1500 by 1000 reference, mapped onto the card with the peak frame's middle pinned to the card's middle.

## Install

```bash
npx skills add https://design.how/vault/sunset-slam
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `RAMP` (default thirteen stops, navy to pale gold). The dawn gradient the window slides over.
- `BG_TOP, BG_BOTTOM` (default #080b16, #171a33). The sky.
- `RECTS` (default the word sunset on the slab grid). The letterforms. Any word drawn on the same grid inherits the measured anatomy.
- `BLOOM_LAYERS, BLOOM_ALPHA` (default four layers, 0.26). The glow behind the word.
- `HOVER_WARM, HOVER_BLOOM` (default 0.075, 1.35). How far a hover warms the window and lifts the bloom.
- `OUTRO` (default 11). Frames the unwind takes before the loop closes.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
