# Ghosty reveal

Photographs that bleed in and out of view through a soft, cloudy mask, like forming out of fog.

Photographs scattered over a white card, some fully shown and some half dissolved into white.

See it live at [design.how/vault/ghosty-reveal](https://design.how/vault/ghosty-reveal).

## How it works

The whole trick is one mask. A feathered ramp, transparent for its first quarter and opaque past two thirds, is laid over the box at 500 percent of its height, so only a sliver of the soft edge ever crosses it.

## Install

```bash
npx skills add https://design.how/vault/ghosty-reveal
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/ghosty-reveal/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `IMAGES` (default 17 photographs). The image set, as bucket paths.
- `SLOTS` (default 7 staggered spots). Where the images sit, in percent of the card.
- `MASK_SCALE` (default 500). The mask's size as a percent of the box. Bigger is a softer, slower bleed.
- `DURATION` (default 1500). One reveal in or out, in ms.
- `HOLD` (default 1500). How long an image stays fully shown, in ms.
- `EASING` (default cubic-bezier(0.16, 1, 0.3, 1)). The reveal curve.
- `DIRECTION` (default up). Which way the soft edge travels: up, down, left or right.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
