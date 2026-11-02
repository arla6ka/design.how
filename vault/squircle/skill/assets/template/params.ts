// Smooth corners (https://design.how/vault/squircle), params.ts.
// VARIABLE: radiusFor, SMOOTHING, EXPONENT, BUTTON_W, CONTROL_H, LABEL, GROUND, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const CONTROL_H = 36;

export function radiusFor(height: number): number {
  return Math.round(height * 0.42);
}

export const SMOOTHING = 1;
export const EXPONENT = 5;

export const BUTTON_W = 132;
export const LABEL = 'Get the app';
export const TEXT = 14;
export const TRACKING = -0.3;

export const GROUND = '#f6f7f9';
export const FONT_VAR = '--visual-sans';

export const DESIGN_WIDTH = 528;
