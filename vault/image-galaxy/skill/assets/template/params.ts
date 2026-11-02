// Image galaxy (https://design.how/vault/image-galaxy), params.ts.
// VARIABLE: IMAGES, COUNT_DESKTOP, COUNT_MOBILE, IMAGE_SIZE, IMAGE_SIZE_MOBILE, DESIGN_WIDTH, CONFIG, Z_POOL, SPEED_POOL, GROUND. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const IMAGES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(n => `/vault/grid/grid-${n}.webp`);

export const COUNT_MOBILE = 6;
export const COUNT_DESKTOP = 12;

export const GROUND = '#fcfcfc';

export const IMAGE_SIZE = 112;
export const IMAGE_SIZE_MOBILE = 64;

export const DESIGN_WIDTH = 528;
export const PERSPECTIVE = 800;

export const CONFIG = {
  speed: 1.1,
  ease: 0.16,
  scaleEase: 0.25,
  scrollMultiplier: 0.9,
  scaleMin: 0.5,
  scaleMax: 1.4,
};

export const Z_POOL = [-200, -150, -100, -50, 0, 50, 100, 150, 200];
export const SPEED_POOL = [0.55, 0.75, 1, 1.3, 1.6];
