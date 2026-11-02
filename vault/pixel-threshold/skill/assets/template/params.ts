// Pixel threshold (https://design.how/vault/pixel-threshold), params.ts.
// VARIABLE: SEQUENCE, COLORWAYS, DEFAULTS.threshold, FINE, COARSE, HOLD_MS, COLLAPSE_MS, RESOLVE_MS, DEFAULTS.halo, DEFAULTS.keyline, DEFAULTS.keylineOffset, DEFAULTS.texture, FONT_CSS, FONT_WEIGHT. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export type Colorway = {
  name: string;
  ground: [number, number, number];
  ink: [number, number, number];
  paper: [number, number, number];
  fringe: [number, number, number];
};

export const COLORWAYS: Colorway[] = [
  {
    name: "Signal Red",
    ground: [0.922, 0.031, 0.035],
    ink: [0.02, 0.024, 0.02],
    paper: [1, 1, 1],
    fringe: [0.35, 1, 0.9],
  },
  {
    name: "Acid",
    ground: [0.804, 1, 0.05],
    ink: [0.04, 0.06, 0.02],
    paper: [1, 1, 0.96],
    fringe: [1, 0.2, 0.75],
  },
  {
    name: "Cyanide",
    ground: [0.04, 0.85, 0.92],
    ink: [0.01, 0.05, 0.08],
    paper: [0.96, 1, 1],
    fringe: [1, 0.35, 0.2],
  },
  {
    name: "Monochrome",
    ground: [0.9, 0.89, 0.87],
    ink: [0.04, 0.04, 0.05],
    paper: [1, 1, 1],
    fringe: [0.5, 0.55, 0.6],
  },
  {
    name: "Ultraviolet",
    ground: [0.36, 0.05, 0.85],
    ink: [0.03, 0.01, 0.08],
    paper: [0.95, 0.92, 1],
    fringe: [1, 0.85, 0.2],
  },
  {
    name: "Ember",
    ground: [1, 0.42, 0.02],
    ink: [0.08, 0.02, 0.0],
    paper: [1, 0.97, 0.9],
    fringe: [0.2, 0.7, 1],
  },
];

export interface ThresholdParams {
  word: string;
  threshold: number;
  cols: number;
  halo: number;
  keyline: number;
  keylineOffset: [number, number];
  italic: boolean;
  texture: number;
  magnet: boolean;
  magnetReach: number;
  parallax: number;
  pull: number;
  swim: number;
  separation: number;
  colorway: number;
}

export const DEFAULTS: ThresholdParams = {
  word: "pixel",
  threshold: 0.588,
  cols: 150,
  halo: 3,
  keyline: 3,
  keylineOffset: [1, 1],
  italic: true,
  texture: 0.25,
  magnet: true,
  magnetReach: 1,
  swim: 1,
  parallax: 0.009,
  pull: 0.016,
  separation: 1,
  colorway: 0,
};

export const TEXTURE_ANGLE = 80.5;

export const TEXTURE_PERIOD = 0.0065;

export const LEVELS_IN = [5 / 255, 230 / 255] as const;
export const VIBRANCE = 0.2;

export const FONT_CSS = "var(--visual-sans)";
export const FONT_WEIGHT = 600;
