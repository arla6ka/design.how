// Liquid metal (https://design.how/vault/liquid-metal), params.ts.
// VARIABLE: WORD, RAMPS, DEFAULT_RAMP, FONT_CSS, FONT_WEIGHT. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export type MetalRamp = {
  name: string;
  stops: [number, number, number][];
  spark: [number, number, number];
};

export const RAMPS: MetalRamp[] = [
  {
    name: "Silver Teal",
    stops: [
      [0.62, 0.78, 0.85],
      [0.98, 1.0, 1.0],
      [0.03, 0.06, 0.08],
      [0.1, 0.34, 0.4],
      [0.5, 0.72, 0.78],
    ],
    spark: [0.85, 0.97, 1.0],
  },
  {
    name: "Gold",
    stops: [
      [0.95, 0.82, 0.4],
      [1.0, 0.98, 0.85],
      [0.14, 0.08, 0.0],
      [0.6, 0.4, 0.05],
      [0.9, 0.72, 0.3],
    ],
    spark: [1.0, 0.95, 0.7],
  },
  {
    name: "Iridescent",
    stops: [
      [0.55, 0.5, 0.95],
      [0.95, 0.85, 1.0],
      [0.04, 0.02, 0.1],
      [0.9, 0.3, 0.6],
      [0.3, 0.8, 0.85],
    ],
    spark: [1.0, 0.9, 1.0],
  },
  {
    name: "Rose Gold",
    stops: [
      [0.95, 0.72, 0.68],
      [1.0, 0.92, 0.9],
      [0.12, 0.04, 0.05],
      [0.72, 0.34, 0.32],
      [0.9, 0.6, 0.56],
    ],
    spark: [1.0, 0.9, 0.88],
  },
  {
    name: "Gunmetal",
    stops: [
      [0.52, 0.56, 0.62],
      [0.9, 0.93, 0.98],
      [0.02, 0.03, 0.04],
      [0.16, 0.2, 0.26],
      [0.42, 0.47, 0.53],
    ],
    spark: [0.85, 0.9, 1.0],
  },
  {
    name: "Toxic",
    stops: [
      [0.55, 0.9, 0.3],
      [0.95, 1.0, 0.85],
      [0.02, 0.08, 0.02],
      [0.2, 0.5, 0.08],
      [0.45, 0.82, 0.35],
    ],
    spark: [0.9, 1.0, 0.75],
  },
  {
    name: "Molten",
    stops: [
      [1.0, 0.55, 0.2],
      [1.0, 0.92, 0.6],
      [0.12, 0.01, 0.0],
      [0.55, 0.1, 0.04],
      [0.9, 0.42, 0.16],
    ],
    spark: [1.0, 0.85, 0.5],
  },
  {
    name: "Sapphire",
    stops: [
      [0.35, 0.55, 0.98],
      [0.85, 0.95, 1.0],
      [0.01, 0.02, 0.08],
      [0.08, 0.16, 0.55],
      [0.28, 0.45, 0.9],
    ],
    spark: [0.82, 0.92, 1.0],
  },
];

export const DEFAULT_RAMP = 0;
export const WORD = "metal";
export const FONT_CSS = "var(--visual-sans)";
export const FONT_WEIGHT = 600;
