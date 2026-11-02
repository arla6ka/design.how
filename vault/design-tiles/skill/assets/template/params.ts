// Design tiles (https://design.how/vault/design-tiles), params.ts.
// VARIABLE: WORDS, SWATCHES, INITIAL, SHUFFLE_MIN, SHUFFLE_MAX, FLY_STAGGER, FLY_MS, WORD_HEIGHT, FONT_STACK. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const WORDS = ["type", "finds", "its", "own", "shape"];

export type Swatch = { bg: string; fg: string };

export const SWATCHES: Swatch[] = [
  { bg: "#0a0a0a", fg: "#ffffff" },
  { bg: "#ff2e20", fg: "#0a0a0a" },
  { bg: "#f0c2f7", fg: "#0a0a0a" },
  { bg: "#22e58b", fg: "#0a0a0a" },
  { bg: "#7c4dff", fg: "#ffffff" },
  { bg: "#ffe14d", fg: "#0a0a0a" },
  { bg: "#18b6ff", fg: "#0a0a0a" },
  { bg: "#ff7a1a", fg: "#0a0a0a" },
  { bg: "#ff4fa3", fg: "#0a0a0a" },
];

export function randomSwatch(exclude?: Swatch): Swatch {
  if (SWATCHES.length < 2 || !exclude) {
    return SWATCHES[(Math.random() * SWATCHES.length) | 0];
  }
  let s = exclude;
  while (s === exclude) s = SWATCHES[(Math.random() * SWATCHES.length) | 0];
  return s;
}

export function randomSwatchAvoiding(used: Swatch[]): Swatch {
  const free = SWATCHES.filter((s) => !used.includes(s));
  const pool = free.length > 0 ? free : SWATCHES;
  return pool[(Math.random() * pool.length) | 0];
}

export const INITIAL: Swatch[] = [
  SWATCHES[0],
  SWATCHES[1],
  SWATCHES[2],
  SWATCHES[3],
  SWATCHES[4],
];

export const FONT_STACK = 'var(--visual-display), var(--visual-sans), system-ui, sans-serif';
export const FONT_WEIGHT = '500';
export const WORD_HEIGHT = '9cqw';

export const FLY_STAGGER = 130;
export const FLY_MS = 760;
export const SHUFFLE_MIN = 1300;
export const SHUFFLE_MAX = 3200;
export const COLOR_MS = 520;
