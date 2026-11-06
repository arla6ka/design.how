// Smear type (https://design.how/vault/smear-type), params.ts.
// VARIABLE: DEFAULT_LINES, DEFAULT_GROUND, DEFAULT_RIBBON, DEFAULT_RIM, DEFAULT_TYPE, DEFAULT_INK, KEY_MS, CAP, WIDEN, EMBOLDEN, BLUR, FONT_WEIGHT, FONT_VAR, LAYERS_URL, INK_URL. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual. layers.webp and ink.webp are the traced layers the effect plays: serve them at LAYERS_URL and INK_URL.
export const SCENE = 600;
export const KEY_MS = 50;
export const LOOP_KEYS = 48;

export const DEFAULT_LINES = ['DESIGN THAT', 'MOVES YOU'] as const;
export const CAP = 45;
export const LINE_TOP = [250, 300] as const;
export const WIDE = 410;
export const TRACK = -0.02;
export const FONT_WEIGHT = 500;
export const EMBOLDEN = 0.06;
export const SLIDE: readonly Readonly<Record<number, number>>[] = [{19: -20, 20: -6, 21: -2}, {26: -40, 27: -14, 28: -2}];
export const WIDEN = 1.1;
export const FONT_VAR = '--visual-sans';

export const LAYERS_URL = '/smear-type/layers.webp';
export const INK_URL = '/smear-type/ink.webp';
export const CELL = 5;
export const COLS = 8;
export const ROWS = 6;
export const LAYERS = 5;
export const INK_CELL = 3;
export const INK_COLS = 4;
export const INK_FRAMES = [15, 16, 17, 23, 24, 25, 26] as const;

export const PRESENCE = 22;
export const PRESENCE_GAIN = 4;
export const CLOUD = [26, 12] as const;
export const RIM_IN = [0.04, 0.16] as const;
export const RIM_OUT = [0.26, 0.5] as const;
export const LINE_BLUR = 10;
export const REVEAL_BLUR = 10;
export const REVEAL_CURVE = [0.15, 0.75] as const;
export const LINE_MARGIN = 14;
export const FEATHER = 12;
export const BLUR = [30, 8] as const;
export const SOFT = 1.1;
export const TAPS = 32;

export const DEFAULT_GROUND = '#1d1cf0';
export const DEFAULT_RIBBON = '#8d90ff';
export const DEFAULT_RIM = '#19c3ff';
export const DEFAULT_TYPE = '#080616';
export const DEFAULT_INK = '#000000';

export const STILL_KEY = 37;
