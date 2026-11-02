// Phase table (https://design.how/vault/phase-table), params.ts.
// VARIABLE: COLS, ROWS, PERIOD_MS, DETENT, CELL_LAG, METALS, POINTER_TURN. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const TAU = Math.PI * 2;

export const COLS = 6;
export const ROWS = 4;

export const AMP_RATIO = 35.6 / 96;

export const STROKE_RATIO = 2.15 / 96;

export const MIN_STROKE = 1;

export const PERIOD_MS = 2880;

export const DETENT = 0.55;

export const CELL_LAG = 0.22;

export const LIGHT_LEAD = 0.045;

export const PTS_PER_FREQ = 90;

export const INK = "#1b1b1b";
export const BG = "#fcfcfc";

export interface Metal {
  key: string;
  label: string;
  stops: readonly [string, string, string, string, string];
  spark: string;
  bg: string;
}

export const METALS: readonly Metal[] = [
  {
    key: "steel",
    label: "Steel",
    stops: ["#9fb4c4", "#ffffff", "#0a0e14", "#2c4152", "#8298ab"],
    spark: "#dcf0ff",
    bg: "#0b0d11",
  },
  {
    key: "gold",
    label: "Gold",
    stops: ["#f2d174", "#fffaea", "#231604", "#8a5f12", "#e6c165"],
    spark: "#fff2c4",
    bg: "#100c05",
  },
  {
    key: "copper",
    label: "Copper",
    stops: ["#f0a882", "#fff0e6", "#1e0d07", "#8c4526", "#dd8f68"],
    spark: "#ffd9c2",
    bg: "#0f0906",
  },
  {
    key: "oil",
    label: "Oil",
    stops: ["#8f7bf5", "#f2e6ff", "#080410", "#d94b93", "#4fc9d6"],
    spark: "#ffe8ff",
    bg: "#08060e",
  },
];

export const LIGHT_TURN = 0.15;

export const HORIZON = 0.42;

export const SPARK_GAIN = 0.55;

export const DEPTH = 0.34;

export const SHADE_BUCKETS = 32;

export const POINTER_TURN = 0.22;
export const POINTER_EASE = 0.16;

export const DPR_CAP = 2;
