// Word carousel (https://design.how/vault/word-carousel), params.ts.
// VARIABLE: WORDS, INK, INK_FAR, BG, FONT_FAMILY, SCALE_SMALL, SCALE_TINY, TINY_ALPHA, BLUR_STAMPS_MIN, BLUR_STAMPS_MAX. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const WORDS = ["Type", "Grid", "Color", "Motion"];

export const INK = "#002fa7";
export const INK_FAR = "#7fb2ff";
export const BG = "#ffffff";

export const FONT = 107 / 450;
export const CAP = 77 / 450;

export const FONT_FAMILY = "sans-serif";

export const SLOT_L = 0.235;
export const SLOT_C = 0.49;
export const SLOT_R = 0.745;
export const SLOT_T = 0.46;

export const SCALE_BIG = 1;
export const SCALE_SMALL = 0.35;
export const SCALE_TINY = 0.145;

export const LOOP = 1.97;
export const STEPS = [0.36, 0.78, 1.23, 1.59];
export const WINDUP = 0.06;

export const POP_IN_DELAY = 0.09;

export const ARRIVE_E: [number, number][] = [
  [0, 0], [0.15, 0.005], [0.21, 0.02], [0.29, 0.14], [0.36, 0.33],
  [0.43, 0.52], [0.5, 0.67], [0.57, 0.77], [0.64, 0.88], [0.71, 0.925],
  [0.8, 0.94], [0.93, 0.98], [1, 1],
];
export const DEPART_E: [number, number][] = [
  [0, 0], [0.07, 0.15], [0.13, 0.6], [0.2, 0.72], [0.27, 0.92],
  [0.33, 0.965], [0.4, 0.985], [0.5, 0.993], [0.7, 0.998], [1, 1],
];

export const BLUR_HEAD = 0.5;
export const BLUR_TAIL = 0.07;
export const BLUR_MIN = 8 / 800;

export const BLUR_STAMPS_MIN = 4;
export const BLUR_STAMPS_MAX = 18;
export const BLUR_FULL = 0.16;

export const TRAIL_BIAS = 0.55;

export const BLUR_MIN_SCALE = 0.3;

export const TINY_ALPHA = 0.4;

export const OVERSHOOT = 0.004;
export const OVERSHOOT_FROM = 0.62;
