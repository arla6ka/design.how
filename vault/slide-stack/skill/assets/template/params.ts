// Slide stack (https://design.how/vault/slide-stack), params.ts.
// VARIABLE: STAGGER, TRAVERSE, DWELL, GROUND, BLOCK, ACCENT, HUE_MID, HUE_HOT, LABEL_TO_RIGHT, LABEL_TO_LEFT, MAG_PULL, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const BLOCK_W = 214 / 720;

export const BLOCK_SPAN = 0.29;

export const BLOCK_H = 121 / 720;

export const PITCH = 132.5 / 720;

export const TOP = 34 / 720;

export const INSET = 46 / 720;

export const MARGIN = 0.035;

export const ROWS = 5;

export const TRAVERSE = 0.306;
export const DWELL = 0.316;

export const CYCLE = (TRAVERSE + DWELL) * 2;

export const STAGGER = -0.083;

export const GROUND = "#dedede";
export const BLOCK = "#191919";
export const ACCENT = "#f0461e";

export const BLUR_TAPS = 5;
export const BLUR_REACH = 0.85;
export const BLUR_MIN_SPEED = 0.06;

export const HUE_COLD = "#f0461e";
export const HUE_MID = "#ff2d6f";
export const HUE_HOT = "#ffd84a";

export const HUE_BASE = 0.12;
export const HUE_HOVER = 1;

export const HUE_TRAVEL = 0.75;

export const HUE_PUSH = 1.28;

export const HUE_REACH = 0.26;

export const HUE_EASE = 0.055;

export const WAKE_LAG = 11;
export const WAKE_ALPHA = 0.16;
export const WAKE_WIDTH = 1.25;
export const WAKE_TINT = "#8f1f0a";

export const MAG_REACH = 0.45;
export const MAG_PULL = 0.028;
export const MAG_EASE = 0.075;

export const PARALLAX_SCALE = 0.055;
export const PARALLAX_SHIFT = 0.012;

export const SPLIT_MAX = 0.9;
export const SPLIT_WARM = "#ff8a5a";
export const SPLIT_COOL = "#5ad4ff";

export const GRAIN_ALPHA = 0.055;
export const GRAIN_TILE = 128;

export const FONT = 26 / 720;
export const FONT_VAR = "--visual-sans";
export const LABEL_PAD_X = 18 / 720;
export const LABEL_PAD_Y = 16 / 720;

export const LABEL_TO_RIGHT = "RIGHT";
export const LABEL_TO_LEFT = "LEFT";
