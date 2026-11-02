// Pixel scan (https://design.how/vault/pixel-scan), params.ts.
// VARIABLE: WORD, ACCENT, ACCENT2, TEXT_COLOR, GROUND, ENTRANCE_SECONDS, MODE, SPOT_RADIUS, TRAIL_LIFE, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const WORD = 'scanline';
export const FONT_VAR = '--visual-display';
export const FONT_WEIGHT = 500;
export const FONT_SIZE = 0.12;

export const GROUND = '#fafdff';
export const TEXT_COLOR = '#191b24';
export const ACCENT: [number, number, number] = [0.4, 0.75, 1.0];
export const ACCENT2: [number, number, number] = [1.0, 0.45, 0.8];
export const BASE: [number, number, number] = [0.85, 0.8, 1.0];

export const ENTRANCE_SECONDS = 2.6;
export const BAND_WIDTH = 0.2;
export const MODE = 3;

export const SPOT_RADIUS = 0.28;
export const HOVER_EASE = 0.22;
export const LIVE_EASE = 0.35;
export const TRAIL = 24;
export const TRAIL_LIFE = 1.1;
export const TRAIL_STEP_PX = 3;

export const DPR_CAP = 1.5;
export const STILL_PROGRESS = 0.55;
