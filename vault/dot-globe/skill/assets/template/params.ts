// Dot globe (https://design.how/vault/dot-globe), params.ts.
// VARIABLE: DUOS, GROUND, EXPS, WOBBLE, HOLD_S, SWAP_S, HANDOFF, TURN_EVERY_S, GAP, ROUND. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const GROUND = "#f4f4f4";

export interface Duo {
  off: string;
  offNear: string;
  on: string;
  hot: string;
}

export const DUOS: Duo[] = [
  { off: "#6e4b78", offNear: "#553260", on: "#b6f042", hot: "#d3f68e" },
  { off: "#4f8d96", offNear: "#33707a", on: "#f66751", hot: "#faaa9e" },
  { off: "#5f7ed6", offNear: "#3a5cc0", on: "#fadf2e", hot: "#fceb7e" },
];

export const SPAN = (68.2 * Math.PI) / 180;

export const COUNT = 3;

export const RADIUS = 0.3;
export const EXPS = [0.42, 0.66, 0.95];

export const SCALES = [1, 1, 1];
export const RECEDE = [0, 0, 0];

export const GAP = 0.26;
export const ROUND = 0.3;

export const WOBBLE = (14 * Math.PI) / 180;
export const WOBBLE_RATE = 0.7;

export const TILT_MAX = 0.42;
export const TILT_EASE = 0.06;

export const LEAN_MAX = (2.5 * Math.PI) / 180;

export const FIELD_RATIO = 0.3;
export const LIFT = 0.16;

export const OPEN = 0.035;

export const TURN_EVERY_S = 26;
export const TURN_S = 2.6;

export const HOLD_S = 4.2;
export const SWAP_S = 1.1;

export const HANDOFF = 0.35;

export const TRAIL = 0.22;
export const TRAIL_REACH = 0.55;
export const TRAIL_BANDS = 4;
