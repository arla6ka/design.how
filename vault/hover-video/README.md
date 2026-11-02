# Hover video button

Pill buttons that swap themselves for a short clip of their label puffing up into glossy letters.

Three pill buttons reading boop me, do not press and touch grass in three pale boxes.

See it live at [design.how/vault/hover-video](https://design.how/vault/hover-video).

## How it works

The 3D part is only a video, about 140px wide, with an alpha channel (VP9 with alpha in WebM, HEVC with alpha in MP4), so the letters float over the box with nothing around them, and any clip from any video model drops in. A second clip is the same footage reversed.

## Install

```bash
npx skills add https://design.how/vault/hover-video
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

It sets its type in `--visual-grotesk`, a system stack in `fonts.css` (system-ui, sans-serif). Put your own face first.

The skill ships placeholder clips, short abstract loops, in `skill/assets/media/`. Copy them to `public/hover-video/` and replace each with your own at the same path. The originals aren't in this repo, and the template never loads anything from another host.

## Knobs

- `BUTTONS` (default three buttons). Each button's label, clip paths, pill style, clip width, speed, nudge and box tint.
- `PROMPTS` (default three clip prompts). The prompts the clips were generated from; write your own for your own labels.
- `DESIGN_WIDTH` (default 600). The card width the buttons are sized at; a wider card scales them up.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Draws in the DOM with no canvas, so there is no backing store to cap.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners.
