// Ghosty reveal (https://design.how/vault/ghosty-reveal), params.ts.
// VARIABLE: IMAGES, SLOTS, MASK_SCALE, DURATION, HOLD, EASING, DIRECTION. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const IMAGES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(n => `/vault/grid/grid-${n}.webp`);

export const SLOTS = [
  {x: 4, y: 7, w: 22},
  {x: 33, y: 15, w: 14},
  {x: 57, y: 5, w: 18},
  {x: 82, y: 20, w: 13},
  {x: 9, y: 60, w: 16},
  {x: 38, y: 50, w: 24},
  {x: 71, y: 58, w: 19},
] as const;

export const MASK_SCALE = 500;
export const DURATION = 1500;
export const HOLD = 1500;
export const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const DIRECTION: 'up' | 'down' | 'left' | 'right' = 'up';

export const GROUND = '#ffffff';
