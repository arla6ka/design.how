// Datamosh (https://design.how/vault/datamosh), params.ts.
// VARIABLE: PALETTE, COLS, POWER, TILES, CYCLE, STRETCH, SPRING_K, COL_PHASE. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PALETTE = [
  '#ffffff',
  '#3566ff',
  '#ffcf00',
  '#192aff',
  '#d62036',
  '#282142',
  '#ec4978',
  '#ff9900',
  '#14101f',
  '#00dd33',
  '#00ef82',
] as const;

export const WHITE = 0;
export const DARKS = [8, 5];
export const HUES = [1, 2, 3, 4, 6, 7, 9, 10];
export const WHITE_SHARE = 0.26;
export const DARK_SHARE = 0.16;

export const GROUND = '#14101f';

export const COLS = 11;
export const POWER = 1.65;

export const TILES = 15;

export const CYCLE = 0.2;

export const STAGGER = 0.006;

export const STRETCH = 8.5;

export const EARLY = 1.0;

export const SPRING_K = 1.6;

export const BLEED = 0.012;

export const COL_PHASE = -0.4;

export const STRIP_LENGTH = 61;
