// Checker conveyor (https://design.how/vault/checker-conveyor), params.ts.
// VARIABLE: PALETTES, PALETTE_SECONDS, DWELL_SCALE, PULSE_RATE, FADE_SECONDS, RECT_COLS, RECT_ROW_START, RECT_ROW_END. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const ROWS = 9;

export const REF_COLS = 16;

export const RECT_ROW_START = 2;
export const RECT_ROW_END = 6;
export const RECT_COLS = 12;

export interface Scene {
  ground: readonly [string, string];
  rect: readonly [string, string];
}

export type Direction = "left" | "right" | "split";

export interface Palette {
  id: string;
  name: string;
  scenes: readonly [Scene, Scene, Scene];
  direction: Direction;
  reverseCascade?: boolean;
}

export const PALETTES: readonly Palette[] = [
  {
    id: "primary",
    name: "Primary",
    direction: "left",
    scenes: [
      { ground: ["#0066fd", "#63ecff"], rect: ["#0066fd", "#63ecff"] },
      { ground: ["#0066fd", "#63ecff"], rect: ["#ffbaf1", "#ff0100"] },
      { ground: ["#ffb800", "#000000"], rect: ["#ff57bb", "#f2edd9"] },
    ],
  },
  {
    id: "duplex",
    name: "Duplex",
    direction: "left",
    scenes: [
      { ground: ["#f4f1e8", "#ff48b0"], rect: ["#f4f1e8", "#ff48b0"] },
      { ground: ["#f4f1e8", "#ff48b0"], rect: ["#1a3fd4", "#0a1f7a"] },
      { ground: ["#1a3fd4", "#f4f1e8"], rect: ["#ff48b0", "#1a1a1a"] },
    ],
  },
  {
    id: "plaster",
    name: "Plaster",
    direction: "right",
    scenes: [
      { ground: ["#e5dcc8", "#c96a4b"], rect: ["#e5dcc8", "#c96a4b"] },
      { ground: ["#9aa87c", "#e5dcc8"], rect: ["#3d4a2f", "#e5dcc8"] },
      { ground: ["#2b2a26", "#d8c9a8"], rect: ["#c96a4b", "#f0e9d8"] },
    ],
  },
  {
    id: "monochrome",
    name: "Monochrome",
    direction: "split",
    scenes: [
      { ground: ["#111111", "#e8e8e8"], rect: ["#111111", "#e8e8e8"] },
      { ground: ["#111111", "#e8e8e8"], rect: ["#7a7a7a", "#e8e8e8"] },
      { ground: ["#e8e8e8", "#111111"], rect: ["#5a5a5a", "#c8c8c8"] },
    ],
  },
  {
    id: "acid",
    name: "Acid",
    direction: "left",
    reverseCascade: true,
    scenes: [
      { ground: ["#2d1b4e", "#c6f24e"], rect: ["#2d1b4e", "#c6f24e"] },
      { ground: ["#2d1b4e", "#c6f24e"], rect: ["#7b2ff7", "#e9ff70"] },
      { ground: ["#0d1b3d", "#3ddbff"], rect: ["#c6f24e", "#7b2ff7"] },
    ],
  },
  {
    id: "dusk",
    name: "Dusk",
    direction: "split",
    reverseCascade: true,
    scenes: [
      { ground: ["#131a42", "#5f74c9"], rect: ["#131a42", "#5f74c9"] },
      { ground: ["#131a42", "#5f74c9"], rect: ["#8e2f6d", "#ff85a8"] },
      { ground: ["#3a1f2e", "#ffab4a"], rect: ["#ffd98a", "#8c3a2f"] },
    ],
  },
] as const;

export const PALETTE_SECONDS = 2.2;

export const DWELL_SCALE = 0.42;

export const PULSE_RATE = 1.45;

export const FADE_SECONDS = 0.34;

export const PULSE_WINDOWS = [
  [(36.7 - 1) / 30, (65.6 - 1) / 30 + 51 / 30],
  [(158.28 - 1) / 30, (187.26 - 1) / 30 + 50 / 30],
  [(266.4 - 1) / 30, (294.96 - 1) / 30 + 42 / 30],
] as const;

export const PERIOD = 346 / 30;

export const PULSE_DUR = [51 / 30, 50 / 30, 42 / 30] as const;
export const ROW_START_FRAME = [
  [36.7, 40.3, 43.92, 47.46, 51.32, 54.9, 58.38, 62.0, 65.6],
  [158.28, 161.54, 165.4, 169.26, 172.52, 176.3, 179.54, 183.4, 187.26],
  [266.4, 269.92, 273.42, 276.96, 280.88, 284.42, 287.92, 291.42, 294.96],
] as const;

export const EASE_LUT = [
  0, 0.0024, 0.0056, 0.0098, 0.0153, 0.0226, 0.0322, 0.0448, 0.0667, 0.087,
  0.124, 0.165, 0.233, 0.73, 0.819, 0.867, 0.907, 0.93, 0.946, 0.963, 0.974,
  0.981, 0.989, 0.994, 0.998, 1,
] as const;

