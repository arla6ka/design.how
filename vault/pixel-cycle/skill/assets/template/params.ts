// Pixel cycle (https://design.how/vault/pixel-cycle), params.ts.
// VARIABLE: sprites(), PIXEL_START, PIXEL_MIN, PIXEL_STEPS, HOLD, IN_DURATION, OUT_DURATION, SWAP_SCALE_MIN, SWAP_SKEW. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PIXEL_START = 120;
export const PIXEL_MIN = 2;
export const PIXEL_STEPS = 24;
export const INTERACTION_PIXEL_SIZE = 70;
export const SCALE = {min: {scale: 0.33, width: 300}, max: {scale: 1, width: 1400}};

export const HOLD = 1.1;
export const IN_DURATION = 0.5;
export const OUT_DURATION = 0.35;
export const SLIDE_DURATION = 0.5;
export const SWAP_SCALE_MIN = 0.15;
export const SWAP_SKEW = 0.18;
export const SLIDE_TRAVEL = 0.6;

export const BOX_HEIGHT = 0.96;
export const BOX_ASPECT = 0.8;
