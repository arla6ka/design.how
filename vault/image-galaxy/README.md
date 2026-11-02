# Image galaxy

Small photographs drifting through a perspective field, growing as they fall and wrapping forever.

Small square photographs of landscapes and animals scattered over a near-white card.

See it live at [design.how/vault/image-galaxy](https://design.how/vault/image-galaxy).

## How it works

Each photo is one element under a single CSS perspective, given a depth from nine steps between -200px and 200px and a speed from five multipliers between 0.55 and 1.6, cycled so neighbours differ. Images behind the plane carry a wash of the ground colour at up to 40 percent, so depth reads as haze as well as size.

## Install

```bash
npx skills add https://design.how/vault/image-galaxy
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript. `source/` is the same visual with every file it has on the site.

The skill ships placeholder images, neutral gradients, in `skill/assets/media/`. Copy them to `public/image-galaxy/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `IMAGES` (default 17 photographs). The image set, as bucket paths.
- `COUNT_DESKTOP, COUNT_MOBILE` (default 12, 6). How many images fly.
- `IMAGE_SIZE, IMAGE_SIZE_MOBILE` (default 112, 64). An image's side in design pixels, on a wide window and on a phone.
- `DESIGN_WIDTH` (default 528). The card width the sizes and the 800px perspective are tuned at; a wider card scales the field up.
- `CONFIG` (default speed 1.1, ease 0.16, scale 0.5 to 1.4). The drift speed, the smoothing, the scroll feed and the scale range.
- `Z_POOL` (default -200 to 200 in 50px steps). The depths images are spread over.
- `SPEED_POOL` (default 0.55, 0.75, 1, 1.3, 1.6). The parallax multipliers.
- `GROUND` (default #fcfcfc). The card colour and the depth wash.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
