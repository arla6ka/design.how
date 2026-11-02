---
name: hover-video
description: Builds a React hover-video button, a pill that on hover hides and plays a short transparent clip of its own label turning into puffy, glossy 3D letters, rewinding a reversed clip from the same point on leave, with a springy playback rate, a slight lean toward the pointer and a press pop. Use when someone asks for a video hover effect on a button, an inflating or 3D text button, a playful microinteraction, a generated-video button, or a call to action that animates on hover.
---

# Hover video button

Pill buttons that swap themselves for a short clip of their label puffing up into glossy letters. See it live at https://design.how/vault/hover-video.

## What to build

Three boxes in a row, each tinted a near-white of its own, each holding one pill button: "boop me" on a warm light plate, "do not press" in glossy blue, "touch grass" in smoked dark glass. Hover one and the pill disappears under a short clip, centred over it, in which the same words inflate into puffy balloon letters, wobble as see-through jelly, or swell into wet green gloss. Leave and the letters deflate back into the pill.

The 3D part is only a video, about 140px wide, with an alpha channel (VP9 with alpha in WebM, HEVC with alpha in MP4), so the letters float over the box with nothing around them, and any clip from any video model drops in. A second clip is the same footage reversed. On leave, the reverse starts at the mirror of where the forward clip had got to and runs 30 percent faster, so a quick in and out deflates from wherever it was instead of jumping to the end.

The forward clip's playback rate is shaped every frame: a decaying spring, 1 + 0.6 e^(-3.5p) sin(11p) over the clip's progress p, makes the entrance overshoot and settle, and a smoothstep over the last 40 percent slows it to 38 percent so it lands softly. The button leans a tenth of the pointer's offset from the box centre, at most 9px, and a press pops it with a small spring that stacks on quick repeats. On touch a tap plays it and a tap elsewhere puts it back.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/hover-video/`. It is React and TypeScript: `params.ts`, `hover-button.tsx`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Fonts come from `fonts.css`, which the card imports and which sets `--visual-grotesk` to a system stack. Put the project's own face first in that stack (the VARIABLE table says what kind). Any face of that kind works, because the layout is measured from the live font. In a pages-router Next app, import `fonts.css` from `pages/_app` instead.
6. Copy `assets/media/` to the app's static folder as `public/hover-video/`. Every file there is a placeholder, a neutral gradient or a short abstract clip; `assets/media/README.md` lists what each one stands for. Replace them with the project's own images or clips at the same paths. The template loads nothing from any other host.
7. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
8. Run `node scripts/check.mjs components/hover-video` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Render the pill, and over it an absolutely centred pair of muted, playsInline videos: the forward clip and its reverse.
- On enter, hide the pill, set the forward clip to 0 and play it; on leave, start the reverse at duration minus the forward time at 1.3 times the speed.
- While the forward clip plays, set playbackRate each frame to speed times the entrance spring times the tail slowdown, never below 0.25.
- Warm both clips once with a muted play and pause, so the first hover starts at once.
- Ease the lean and the press pop on one spring loop that stops when everything is at rest.
- Stop every clip when the card leaves the screen, the tab hides or the card unmounts.
- Under reduced motion, show the plain pills and never load a clip.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `BUTTONS` | three buttons | Each button's label, clip paths, pill style, clip width, speed, nudge and box tint. |
| `PROMPTS` | three clip prompts | The prompts the clips were generated from; write your own for your own labels. |
| `DESIGN_WIDTH` | 600 | The card width the buttons are sized at; a wider card scales them up. |
| `--visual-grotesk` in fonts.css | system-ui, sans-serif | The typeface for this role, a characterful grotesque. Put the project's face first. |
