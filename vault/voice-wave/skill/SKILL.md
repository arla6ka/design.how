---
name: voice-wave
description: Builds a WebGL2 voice-visualiser effect in which one glowing ribbon is drawn four times in four colours, slightly out of phase, so it reads neutral where it is flat and fans into violet, magenta and coral where it bends, driven by a simulated voice or, after an explicit click, by the microphone through a WebAudio analyser. Use when someone asks for a voice or speech waveform, an assistant listening animation, an audio-reactive ribbon, a microphone visualiser, a glowing sine wave, or dispersion and chromatic splitting in WebGL.
---

# Voice wave

A ribbon of light that moves like a voice and splits into colour where it bends, and can listen to yours. See it live at https://design.how/vault/voice-wave.

## What to build

One wave across the middle of the card, tapering to nothing at both ends, with a softer mirrored copy of itself as a reflection. While it rests it breathes as an almost flat line; through a phrase it swells, ripples and fans apart into colour at every bend, then settles back. On a light page it composites as ink on paper, each part of the ribbon taking away the light its colour does not favour; on a dark page it is added as light.

The idea is one curve drawn four times. Each copy is the same wave, a fundamental plus an incommensurate second harmonic so no two peaks match, offset in phase by a spread between minus and plus s. Where the wave is flat the four copies overlap and, because the shader divides by the summed palette, cancel to neutral; where it bends, the phase offset pulls them apart and the edge splits into the four stops. Each copy is a Lorentzian line, k / (sqrt(d^2 + soft^2) + thickness), so it has a bright core and a long tail that reads as emitted light, with a band filled between it and the main curve so the ribbon has volume.

Three bands drive it. Low sets how far the wave swings, high sets how far the colours separate, mid thickens the line. By default the bands come from a scripted voice: six phrases of uneven length and force with real pauses between them, each with a quick attack and a long release. Pressing the button asks for the microphone, and only then; a WebAudio analyser groups FFT bins by frequency (60 to 320, 320 to 1600 and 1600 to 6000 Hz), followed with a fast attack and slow release. The colour split follows the swing about 120 ms late, so the fringe blooms just after the bend. Nothing is recorded: the audio never leaves the analyser, and stopping or leaving gives the device back.

## Workflow

1. Copy `assets/template/` into the project, for example to `components/voice-wave/`. It is React and TypeScript: `shaders.ts`, `audio.ts`, `engine.ts`, `card.tsx`, plus `runtime/`, the small helpers they import.
2. Read the FIXED steps below before touching the code. They are what makes the effect; keep them.
3. Change only the VARIABLE values in the params file, or pass them as props where the card takes them.
4. Mount the card in a box with a fixed aspect ratio of 1344 / 620, so the page never shifts when it paints.
5. Read `references/perf.md` before changing the engine or mounting several visuals on one page.
6. Run `node scripts/check.mjs components/voice-wave` on the copied folder, fix every line it prints, and rerun until it prints ok.

## FIXED

- Draw one full-screen triangle from gl_VertexID; do everything in one WebGL2 fragment shader.
- Evaluate the centre line as a fundamental plus an incommensurate harmonic under a cosine end taper, then draw it four times at phase offsets spread across [-s, s].
- Shade each copy as a Lorentzian line with a filled band back to the main curve, weight it by its palette stop, and divide the sum by the summed palette so overlap goes neutral.
- Add a mirrored, softened copy as a reflection, fade toward the card edges, and composite subtractively on light or additively on dark.
- Feed low, mid and high from a scripted phrase envelope by default; on an explicit click, from an AnalyserNode with bins grouped by frequency, each band followed with fast attack and slow release.
- Lag the colour spread behind the swing with a symmetric follower, about 120 ms.
- Read the page background token and data-theme, and re-read them when the theme changes.
- Cap the pixel ratio at 2, stop the loop on webglcontextlost, and on destroy stop the microphone tracks, close the audio context, delete the program and lose the context.
- Under reduced motion, draw one shaped frame with the colour already split, and offer no microphone.

## VARIABLE

| Name | Default | What it changes |
|-|-|-|
| `PALETTE` | blue-violet, purple, magenta, warm coral | The four dispersion stops. Keep them spread apart, or the split averages to grey. |
| `PHRASES` | six {speak, pause, force} | The simulated voice: how long each phrase runs, the pause after it and how hard it swings. |
| `ZOOM` | 0.62 | How much of the card the wave fills. Lower is bigger. |
