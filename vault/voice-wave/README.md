# Voice wave

A ribbon of light that moves like a voice and splits into colour where it bends, and can listen to yours.

A soft ribbon of light across the card, neutral where it runs flat and fanning into violet, magenta and coral at its bends.

See it live at [design.how/vault/voice-wave](https://design.how/vault/voice-wave).

## How it works

The idea is one curve drawn four times. Each copy is the same wave, a fundamental plus an incommensurate second harmonic so no two peaks match, offset in phase by a spread between minus and plus s.

## Install

```bash
npx skills add https://design.how/vault/voice-wave
```

That installs the skill in `skill/`: the brief, the FIXED steps, the VARIABLE knobs, a template in `assets/template/` and `scripts/check.mjs`, which checks the copy in your project against the performance contract. The template is React and TypeScript.

## Knobs

- `PALETTE` (default blue-violet, purple, magenta, warm coral). The four dispersion stops. Keep them spread apart, or the split averages to grey.
- `PHRASES` (default six {speak, pause, force}). The simulated voice: how long each phrase runs, the pause after it and how hard it swings.
- `ZOOM` (default 0.62). How much of the card the wave fills. Lower is bigger.

## Performance

- Pauses off screen and on a hidden tab.
- Honours reduced motion: it shows one still frame and never starts the loop.
- Caps the canvas pixel ratio at 2 or lower.
- Cleans up on unmount: stops the loop, cancels the frame and removes its listeners, deletes its GL resources and loses its context. It handles a lost context by stopping.
