// Swing type (https://design.how/vault/swing-type), params.ts.
// VARIABLE: WORDS, INK, BG, PERIOD, DETENT, CAP_FRAC, WORD_SECONDS, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PERIOD = 2.0;

export const PITCH_DEG = 78;

export const swingDeg = (letters: number) => ((letters - 1) / 2) * PITCH_DEG;

export const CAP_FRAC = 0.46;

export const K_OVER_CAP = 115 / 263;

export const DETENT = 0.7;

export const CULL_DEG = 90;

export const VSCALE = [1.0, 0.995, 0.985, 0.955, 0.923, 0.86, 0.83];

export const VSCALE_BY_HEIGHT = 0.5;

export const LEAN = [0.0, 0.06, 0.115, 0.14, 0.15, 0.12, 0.06];

export const PIVOT_CAP = 0.37;

export const WORDS = ["Pivot", "Swing", "Turns", "Angle"];
export const WORD = WORDS[0];

export const WORD_SECONDS = 3;

export const FLIP_SECONDS = 0.42;

export const FLIP_STAGGER = 0.09;

export const INK = ["#F0413B", "#E88500", "#0FA3A3", "#2F6BE0", "#7A3BD6"];

export const BG = "#FFFFFF";

export const FONT_VAR = "--visual-sans";
export const FONT_WEIGHT = 600;

export const FONT_WEIGHT_EDGE = 800;
