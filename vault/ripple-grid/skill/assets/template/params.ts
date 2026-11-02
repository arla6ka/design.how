// Ripple grid (https://design.how/vault/ripple-grid), params.ts.
// VARIABLE: INK, PAPER, GRID_NX, GRID_NY, BLOOM_SEC, TWIRL_MAX, CURSOR_PUSH. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PITCH = 0.18;

export const VIEW_SCALE = 1.55;

export const SIGMA_K = 0.3;

export const THRESHOLD = 0.57;

export const GRID_NX = 5;
export const GRID_NY = 3;

export const RX_REST = 3.25;
export const RX_OPEN = 4.6;
export const RY_REST = 1.5;
export const RY_OPEN = 2.12;

export const SHELL_SOFT = 0.5;

export const RIPPLE_LEN = 0.233;
export const RIPPLE_MAX = 0.042;

export const RIPPLE_SPEED = 2.5;

export const RIPPLE_FLOOR = 0.12;

export const TWIRL_MAX = 0.88;

export const DRIFT_MAX = 0.06;

export const WOBBLE = 0.006;

export const BLOOM_SEC = 8;

export const MODE_OFFSETS = [0, 0.5, 0.25] as const;

export const MODE_PITCH = [1.0, 0.88, 1.14] as const;

export const BLOOM_SKEW = 0.65;

export const RATE_RIPPLE = 0.31;
export const RATE_TWIRL = 0.19;
export const RATE_DRIFT_X = 0.13;
export const RATE_DRIFT_Y = 0.107;
export const RATE_WOBBLE = 0.23;

export const CURSOR_PUSH = 0.045;

export const CURSOR_RADIUS = 0.34;

export const LENS_RADIUS = 0.36;
export const LENS_POWER = 1.7;

export const CURSOR_EASE = 0.19;

export const CURSOR_RIPPLE_BIAS = 0.2;

export const INK = "#1b1b1b";
export const PAPER = "#fcfcfc";

export const DPR_CAP = 1.5;

export function rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export interface Frame {
  ripple: number;
  twirl: number;
  driftX: number;
  driftY: number;
  wobble: number;
  rx: number;
  ry: number;
  ripplePhase: number;
}

export function frameAt(t: number): Frame {
  const u = Math.pow(((t % BLOOM_SEC) + BLOOM_SEC) % BLOOM_SEC / BLOOM_SEC, BLOOM_SKEW);
  const energy = 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
  const e = Math.pow(energy, 1.1);
  return {
    ripple:
      RIPPLE_MAX *
      (RIPPLE_FLOOR + (1 - RIPPLE_FLOOR) * e) *
      (0.65 + 0.35 * Math.sin(t * RATE_RIPPLE)),
    twirl: TWIRL_MAX * e * Math.sin(t * RATE_TWIRL),
    driftX: DRIFT_MAX * e * Math.sin(t * RATE_DRIFT_X),
    driftY: DRIFT_MAX * e * Math.sin(t * RATE_DRIFT_Y),
    wobble: WOBBLE * (0.35 + 0.65 * e * (0.6 + 0.4 * Math.sin(t * RATE_WOBBLE))),
    rx: RX_REST + (RX_OPEN - RX_REST) * energy,
    ry: RY_REST + (RY_OPEN - RY_REST) * energy,
    ripplePhase: t * RIPPLE_SPEED,
  };
}
