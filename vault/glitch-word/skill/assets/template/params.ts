// Glitch word (https://design.how/vault/glitch-word), params.ts.
// VARIABLE: WORD, LAYERS, IDLE, ACTIVE, WORD_SIZE, GREENS, GROUND, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const WORD = 'glitching';

export const LAYERS = 10;

export const WORD_SIZE = 5.7;

export const GROUND = '#f7f7f7';

export const FONT_VAR = '--visual-grotesk';

export const GREENS = ['#1aa251', '#17a35c', '#1c9f4a', '#15a565'] as const;

export interface GlitchOptions {
  duration: number;
  sliceCount: number;
  velocity: number;
  minHeight: number;
  maxHeight: number;
  maxOffset: number;
  shakeAmplitude: number;
  spanStart: number;
  spanEnd: number;
  peakAt: number;
  rogueMultiplier: number;
  cornerJitter: number;
  driftPx: number;
  scrambleRate: number;
  scrambleInterval: number;
}

export const IDLE: GlitchOptions = {
  duration: 1800,
  sliceCount: 7,
  velocity: 15,
  minHeight: 0.02,
  maxHeight: 0.18,
  maxOffset: 20,
  shakeAmplitude: 0.13,
  spanStart: 0.5,
  spanEnd: 0.84,
  scrambleRate: 0.06,
  scrambleInterval: 50,
  peakAt: 0.3,
  rogueMultiplier: 3,
  cornerJitter: 4,
  driftPx: 0.5,
};
export const ACTIVE: GlitchOptions = {
  duration: 340,
  sliceCount: 10,
  velocity: 18,
  minHeight: 0.02,
  maxHeight: 0.2,
  maxOffset: 38,
  shakeAmplitude: 0.26,
  spanStart: 0.22,
  spanEnd: 0.9,
  scrambleRate: 0.14,
  scrambleInterval: 45,
  peakAt: 0.3,
  rogueMultiplier: 3.5,
  cornerJitter: 6,
  driftPx: 0.5,
};
