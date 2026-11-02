// Kinetic typography (https://design.how/vault/kinetic-typography), params.ts.
// VARIABLE: text, paper, ink, accent, tiles, offset, speed, spread, chroma, shade, grain, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export interface KineticParams {
  text: string;
  paper: string;
  ink: string;
  accent: string;
  tiles: number;
  offset: number;
  speed: number;
  spread: number;
  chroma: number;
  shade: number;
  grain: number;
}

export const DEFAULT_PARAMS: KineticParams = {
  text: 'a',
  paper: '#fcfcfc',
  ink: '#1b1b1b',
  accent: '#3b82f6',
  tiles: 34,
  offset: 26,
  speed: 0.02,
  spread: 0.025,
  chroma: 0.35,
  shade: 0.35,
  grain: 0.7,
};

export const FONT_VAR = '--visual-serif';
export const FONT_WEIGHT = 700;

export const STILL_FRAME = 90;

export const ASPECT = 16 / 9;
