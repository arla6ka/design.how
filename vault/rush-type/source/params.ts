export const WORDS = ["gone", "before", "you", "look"];

export const FONT_VAR = "var(--visual-sans)";

export const SY_PEAK = 7.0;
export const SX_PEAK = 1.57;

export const ARRIVE_S = 0.24;
export const REST_S = 0.38;
export const LEAVE_S = 0.14;
export const HANG_S = 0.09;
export const CYCLE_S = ARRIVE_S + REST_S + LEAVE_S + HANG_S;

export const SHUTTER_S = 0.04;

export const SMEAR_GAIN = 1.6;

export const SAMPLES = 28;

export const SHUTTER_K: [number, number, number] = [0.62, 1.0, 0.34];

export const REST_CAP_FRAC = 0.09;

export const DRIFT_DIR = [-1, 0.7, -0.45, 1];

export const FALL: number[] = [1.0, 0.557, 0.121, 0.049, 0.014, 0.0];

export const RISE: number[] = [0.0, 0.08, 0.8, 1.0];

export function sampleTable(table: number[], u: number): number {
  const n = table.length - 1;
  const x = Math.min(Math.max(u, 0), 1) * n;
  const i = Math.min(Math.floor(x), n - 1);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}

export const SHUTTER_SHAPE = 0.85;

export const ROLL_U = 0.38;

export const LAG_U = 0.55;

export const THIN = 0.55;

export const BLOOM_GAIN = 0.5;
export const BLOOM_SPREAD = 3.2;
export const BLOOM_BIAS = 3.5;

export const SPEED_GAIN = 0.95;

export const EXPOSURE = 1.75;

export const SCROLL_GAIN = 0.02;
export const SCROLL_MAX = 3.0;
export const SCROLL_DECAY = 4.0;

export const FOCAL = 1.0;

export const ORBIT_DEPTH = 0.42;

export const ORBIT_RISE = 0.16;

export const ORBIT_YAW = 0.55;
export const ORBIT_YAW_LAG = 0.6;

export const ORBIT_PITCH = 0.26;
export const ORBIT_PITCH_LAG = -0.9;

export function orbitTurn(psi: number, amp: number, lag: number): number {
  const pin = Math.sin(lag);
  return (amp * (Math.sin(psi - lag) - pin)) / (1 + Math.abs(pin));
}

export const ORBIT_HANG_ARC = 0.9;

export const PIVOT_FRAC = 0.07;

export const ORBIT_IN: number[] = [0.0, 0.5, 0.82, 0.95, 1.0, 1.0];

export const ORBIT_OUT: number[] = [0.0, 0.05, 0.14, 0.38, 1.0];

export const CRT_GAIN = 1.0;

export const CRT_PITCH = 5.0;
export const CRT_MASK = 0.16;

export const CRT_SCAN_PITCH = 3.0;
export const CRT_SCAN = 0.12;

export const CRT_BEAM = 0.7;

export const CRT_HUM = 0.035;
export const CRT_HUM_SPEED = 0.14;

export const GLOW_BASE = 0.03;
export const GLOW_SPEED = 0.028;
export const GLOW_SPREAD = 2.6;
export const GLOW_MIN = 0.34;
export const GLOW_MAX_Y = 1.2;

export const HOLD_STRENGTH = 0.96;

export const AUTO_HOLD = [0, 0, 0, 0.9];

export const AUTO_HOLD_AT = 0.55;
export const HOLD_EASE_IN = 0.05;
export const HOLD_EASE_OUT = 0.2;

export const SWAP_SPREAD = 0.35;

export const SWAP_FLASH = 0.5;
