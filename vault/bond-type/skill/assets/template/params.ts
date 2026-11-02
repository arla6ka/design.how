// Bond type (https://design.how/vault/bond-type), params.ts.
// VARIABLE: LINES, GREEN, WHITE, FPS, SCATTERS_MIN, SCATTERS_MAX, BOND_WEIGHT_CELLS, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const TICKS = 61;

export const FPS = 32;

export const EASE_MOVE = [
  0, 0.014, 0.044, 0.193, 0.317, 0.545, 0.621, 0.735, 0.777, 0.838, 0.868,
  0.908, 0.924, 0.95, 0.962, 0.979, 0.985, 0.994, 0.996, 1,
];

export const EASE_RETURN = [
  0.0, 0.0115, 0.023, 0.0475, 0.072, 0.1835, 0.295, 0.3645,
  0.434, 0.534, 0.634, 0.667, 0.7, 0.7495, 0.799, 0.8175,
  0.836, 0.862, 0.888, 0.8995, 0.911, 0.9275, 0.944, 0.949,
  0.954, 0.9685, 0.983, 0.985, 0.987, 0.9915, 0.996, 0.998,
  1.0,
];

export const MOVE2_AT = 20;
export const MOVE3_AT = 40;

export const GREEN = "#f5333f";
export const WHITE = "#fdfefd";

export const CAP_H = 56 / 304;

export const FONT_VAR = "--visual-pixel";
export const FONT_WEIGHT = 400;
export const BASELINE_1 = 140 / 304;
export const LINE_PITCH = 67.5 / 304;

export const JITTER_CELLS = 1;

export const JITTER_S = 5.2;

export const JITTER_GATE = 0.975;

export const JITTER_EASE_TICKS = 6;

export const BOND_CELL_SCALE = 0.5;

export const CAP_PIXELS = 9;

export const BOND_AIR_CELLS = 2;

export const BOND_MIN_CELLS = 1;

export const BOND_WEIGHT_CELLS = 2;

export const BOND_BOW_CELLS = 1;

export const BOND_BOW_S = 7;

export const BOND_ON_TICK = 3;

export const BOND_OFF_BEFORE_HOME = 2;

export const LINES = ["Atoms", "Bonds"] as const;

export interface Pose {
  gaps: number[][];
  shift: number[];
  dy: number[][];
}

export const POSES: Pose[] = [
  {
    gaps: [[56.3, 58.5, 64.6, 71.0].map((v) => v / 304), [75.3, 74.7, 77.6, 90.2].map((v) => v / 304)],
    shift: [4.5 / 304, -10.2 / 304],
    dy: [[-30.0, -13.0, -6.0, -13.0, -30.0].map((v) => v / 304), [8.0, 19.0, 30.0, 41.0, 52.0].map((v) => v / 304)],
  },
  {
    gaps: [[67.8, 65.9, 65.1, 77.9].map((v) => v / 304), [74.2, 72.5, 94.6, 81.7].map((v) => v / 304)],
    shift: [-3.8 / 304, 12.7 / 304],
    dy: [[-6.0, -30.0, -54.0, -30.0, -6.0].map((v) => v / 304), [48.4, 42.1, 11.6, 17.9, 48.4].map((v) => v / 304)],
  },
  {
    gaps: [[60.6, 60.8, 68.9, 68.0].map((v) => v / 304), [94.9, 92.1, 80.5, 76.9].map((v) => v / 304)],
    shift: [-13.1 / 304, 6.6 / 304],
    dy: [[-54.0, -42.0, -30.0, -18.0, -6.0].map((v) => v / 304), [8, 8, 8, 52, 52].map((v) => v / 304)],
  },
  {
    gaps: [[75.1, 70.3, 60.8, 73.5].map((v) => v / 304), [89.5, 76.7, 87.4, 77.3].map((v) => v / 304)],
    shift: [-4.6 / 304, -2.9 / 304],
    dy: [[-27.0, -6.2, -33.0, -53.8, -27.0].map((v) => v / 304), [30.0, 45.6, 52.0, 45.6, 30.0].map((v) => v / 304)],
  },
  {
    gaps: [[70.2, 74.4, 77.1, 77.5].map((v) => v / 304), [95.8, 91.0, 79.4, 76.2].map((v) => v / 304)],
    shift: [4.9 / 304, -11.4 / 304],
    dy: [[-54, -54, -54, -6, -6].map((v) => v / 304), [52.0, 30.0, 8.0, 30.0, 52.0].map((v) => v / 304)],
  },
  {
    gaps: [[60.2, 76.3, 69.2, 71.3].map((v) => v / 304), [74.3, 81.6, 93.8, 87.6].map((v) => v / 304)],
    shift: [-1.3 / 304, 8.4 / 304],
    dy: [[-30.0, -13.0, -6.0, -13.0, -30.0].map((v) => v / 304), [8.0, 19.0, 30.0, 41.0, 52.0].map((v) => v / 304)],
  },
];

export const SCATTERS_MIN = 2;
export const SCATTERS_MAX = 4;

export const MOVE_TICKS = 20;
export const RETURN_TICKS = 17;

export const HOLD_TICKS = 8;

export const ARRIVE_SPREAD = 0.08;
