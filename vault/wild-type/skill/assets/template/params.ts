// Wild type (https://design.how/vault/wild-type), params.ts.
// VARIABLE: WORDS, ACCENTS, BG, INK, OBLIQUE, REST_WIDTH_FRAC, GRAIN_ALPHA, FONT_CSS. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const FPS = 30;

export const BLANK_TICKS = 2;
export const TYPE_TICKS = 23;
export const WARP_TICKS = 37;

export const HOLD_TICKS = 27;

export const OUT_TICKS = 15;
export const OUT_SPEED = 1.6;

export const LOOP_TICKS = BLANK_TICKS + TYPE_TICKS + WARP_TICKS + HOLD_TICKS + OUT_TICKS;

export const REF_CUT_TICK = 6 + (3 - BLANK_TICKS);

export const REF_HALF_WIDTH = 167.5;

export const MESH_XS = [-1.2, -0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2];
export const MESH_YS = [-0.6, -0.2, 0.2, 0.6];

export const WORDS = ["design", "type", "grid", "color", "motion", "shape", "pixel", "layout"];

export const ACCENTS = [
  "#4f6bff",
  "#ff3d7f",
  "#2ee06a",
  "#ff8a1f",
  "#b46bff",
  "#28d8f0",
  "#ffd84a",
  "#ff4a3d",
];

export const FONT_CSS = "var(--visual-grotesk), sans-serif";
export const FONT_WEIGHT = 700;
export const OBLIQUE = 0.2;

export const TRACE_EM = 320;
export const TRACE_TOL = 0.45;
export const TRACE_MIN_AREA = 6;

export const CORNER_DEG = 48;

export const REST_WIDTH_FRAC = 0.34;

export const BG = "#000000";
export const INK = "#ffffff";

export const BG_GLOW = 0.16;

export const GRAIN_ALPHA = 0.06;
export const GRAIN_TILE = 160;

export const THIN = 0.08;
export const THIN_MAX = 0.14;

export const LAG_TICKS = 1.6;

export const AFTER_K = 0.9;
export const AFTER_MAX = 0.28;

export const PULL_SIGMA = 0.55;
export const PULL_GAIN = 0.42;
export const PULL_K = 0.16;
export const PULL_DAMP = 0.78;

export const MIRROR_ALTERNATE = true;
