// Spike type (https://design.how/vault/spike-type), params.ts.
// VARIABLE: WORD, PALETTE, MAX_LEN, EVERY, BREATH_AMT, BREATH_RATE, REPEL, HUE_TO, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const WORD = "melon";

export const FONT_VAR = "--visual-sans";

export const PALETTE = {
  ground: "#e4e4e8",
  mark: "#ffffff",
  line: "#ffc21e",
} as const;

export const EVERY = 3;
export const MAX_LEN = 0.26;
export const ROOT = 0.006;
export const ROUGH = 0.007;
export const STEP = 0.006;
export const LINE_W = 0.0032;
export const RUN = 9;

export const BREATH_RATE = 0.55;
export const BREATH_AMT = 0.1;
export const SWAY_AMT = 0.06;

export const REPEL = 0.34;
export const REACH_RATIO = 0.3;

export const SPRING = 0.055;
export const DAMP = 0.86;

export const MAGNET = 0.012;
export const MAGNET_REACH = 0.34;
export const MAGNET_SPRING = 0.05;
export const MAGNET_DAMP = 0.87;

export const GROW_AMT = 0.9;

export const HUE_FROM = 43.7;
export const SAT_FROM = 100;
export const LIT_FROM = 55.9;
export const HUE_TO = 104;
export const SAT_TO = 64;
export const LIT_TO = 38;
export const HUE_STEPS = 24;
export const HUE_REACH = 0.22;

export const HUE_RAMP: string[] = Array.from({ length: HUE_STEPS }, (_, i) => {
  const u = i / (HUE_STEPS - 1);
  const e = u * u * (3 - 2 * u);
  const hue = HUE_FROM + (HUE_TO - HUE_FROM) * e;
  const sat = SAT_FROM + (SAT_TO - SAT_FROM) * e;
  const lit = LIT_FROM + (LIT_TO - LIT_FROM) * e;
  return `hsl(${hue.toFixed(1)} ${sat.toFixed(1)}% ${lit.toFixed(1)}%)`;
});
