// Verb type (https://design.how/vault/verb-type), params.ts.
// VARIABLE: PHASES, MOTTLE_DEPTH, SPLIT_PX, SPLIT_HUE, SMEAR_ALPHA, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const FRAME_MS = 40;
export const FRAMES = 162;
export const LOOP_MS = FRAMES * FRAME_MS;

export const SCENE_W = 1920;
export const SCENE_H = 1080;

export const FONT_VAR = "--visual-sans";
export const FONT_WEIGHT = 500;

export const EASE = [0.85, 0, 0.15, 1] as const;

export function ease(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = EASE;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const u = (lo + hi) / 2;
    const v = 1 - u;
    const x = 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u;
    if (x < t) lo = u;
    else hi = u;
  }
  const u = (lo + hi) / 2;
  const v = 1 - u;
  return 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u;
}

export function move(
  f: number,
  t0: number,
  dur: number,
  a: number,
  b: number,
  prev: number,
): number {
  if (f <= t0) return prev;
  return a + (b - a) * ease((f - t0) / dur);
}

export function sample(table: readonly number[], i: number): number {
  if (i <= 0) return table[0];
  const last = table.length - 1;
  if (i >= last) return table[last];
  const k = Math.floor(i);
  const u = i - k;
  return table[k] + (table[k + 1] - table[k]) * u;
}

export type PhaseName = "move" | "skew" | "rotate" | "break" | "condense";

export interface Phase {
  name: PhaseName;
  from: number;
  to: number;
  ground: string;
  ink: string;
}

export const PHASES: readonly Phase[] = [
  { name: "move", from: 0, to: 37, ground: "#2447f9", ink: "#f6f3ec" },
  { name: "skew", from: 38, to: 64, ground: "#f6f3ec", ink: "#e34a2b" },
  { name: "rotate", from: 65, to: 101, ground: "#0f4d3a", ink: "#f0e6c8" },
  { name: "break", from: 102, to: 117, ground: "#f5d90a", ink: "#111111" },
  { name: "condense", from: 118, to: 161, ground: "#2b0a3d", ink: "#ff7a59" },
];

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function shiftHue(hex: string, deg: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  h = (((h + deg / 360) % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(f(h + 1 / 3))}${to(f(h))}${to(f(h - 1 / 3))}`;
}

export function phaseAt(frame: number): Phase {
  const f = ((Math.floor(frame) % FRAMES) + FRAMES) % FRAMES;
  for (const p of PHASES) if (f <= p.to) return p;
  return PHASES[PHASES.length - 1];
}

export const MOVE_CAP = 372;

export const MOVE_ROWS = { top: 228, mid: 540, bottom: 844 } as const;

export const MOVE_SLIDE = 10;
export const MOVE_HOP = 5;
export const MOVE_HOP_PX = 80;

export interface MoveLetter {
  ch: string;
  x0: number;
  x: number;
  startRow: "top" | "bottom";
  lag: number;
}

export const MOVE_LETTERS: readonly MoveLetter[] = [
  { ch: "M", x0: 1322, x: 410, startRow: "top", lag: 0 },
  { ch: "O", x0: 257.5, x: 841.5, startRow: "bottom", lag: 3 },
  { ch: "V", x0: 630, x: 1214, startRow: "bottom", lag: 0 },
  { ch: "E", x0: 1718, x: 1586, startRow: "top", lag: 1 },
];

export const MOVE_SCHEDULE = {
  swapRows: -2,
  slideX: 8,
  toMiddle: 18,
  hopUp: 28,
  hopDown: 33,
} as const;

export function movePose(f: number): { x: number; y: number }[] {
  return MOVE_LETTERS.map((L) => {
    const g = f - L.lag;
    const rowA = L.startRow === "top" ? MOVE_ROWS.top : MOVE_ROWS.bottom;
    const rowB = L.startRow === "top" ? MOVE_ROWS.bottom : MOVE_ROWS.top;
    const S = MOVE_SCHEDULE;
    let y: number = rowA;
    let x: number = L.x0;
    y = move(g, S.swapRows, MOVE_SLIDE, rowA, rowB, y);
    x = move(g, S.slideX, MOVE_SLIDE, L.x0, L.x, x);
    y = move(g, S.toMiddle, MOVE_SLIDE, rowB, MOVE_ROWS.mid, y);
    y = move(g, S.hopUp, MOVE_HOP, MOVE_ROWS.mid, MOVE_ROWS.mid - MOVE_HOP_PX, y);
    y = move(g, S.hopDown, MOVE_HOP, MOVE_ROWS.mid - MOVE_HOP_PX, MOVE_ROWS.mid, y);
    return { x, y };
  });
}

export const SKEW_CAP = 368;
export const SKEW_Y = 540;

export const SKEW_MOVE = 6.2;
export const SKEW_STAGGER = 1.27;

export interface SkewLetter {
  ch: string;
  x: number;
  keys: readonly (readonly [number, number])[];
  dx: readonly number[];
}

export const SKEW_LETTERS: readonly SkewLetter[] = [
  {
    ch: "S",
    x: 410,
    keys: [
      [33.0, 25],
      [39.3, 0],
      [55.5, 25],
      [61.75, 0],
    ],
    dx: [20, 21, 21, 20, 15, 4, 2, 2, 2, 2, 2, 0, 0, -1, -4, -13, -15, -16, -16, -16, -16, -12, -10, -9, -9, -9, -10],
  },
  {
    ch: "K",
    x: 728,
    keys: [
      [34.3, 25],
      [40.6, 0],
      [49.25, -15],
      [55.5, 0],
    ],
    dx: [14, 16, 17, 17, 16, 12, 1, -2, -2, -3, -3, 0, 0, 1, 4, 16, 18, 18, 18, 19, 21, 30, 33, 34, 34, 33, 31],
  },
  {
    ch: "E",
    x: 1036.5,
    keys: [
      [35.5, 25],
      [42.0, 0],
      [55.5, -15],
      [61.75, 0],
    ],
    dx: [22, 18, 18, 19, 19, 18, 15, 5, 0, -1, -1, -1, 0, 3, 16, 58, 67, 69, 69, 70, 71, 78, 79, 80, 80, 78, 74],
  },
  {
    ch: "W",
    x: 1424.5,
    keys: [
      [36.8, 25],
      [43.1, 0],
      [49.25, 20],
      [55.5, 0],
    ],
    dx: [36, 34, 23, 19, 18, 18, 18, 16, 9, 0, -1, 0, 0, 3, 13, 49, 57, 60, 60, 60, 59, 60, 61, 62, 62, 61, 59],
  },
];

export function skewPose(f: number): { deg: number; dx: number }[] {
  return SKEW_LETTERS.map((L) => {
    let deg = 0;
    let from = 0;
    for (const [t0, target] of L.keys) {
      deg = move(f, t0, SKEW_MOVE, from, target, deg);
      from = target;
    }
    return { deg, dx: sample(L.dx, f - PHASES[1].from) };
  });
}

export const ROTATE_CAP = 182;

export const ROTATE_PIVOT = { x: 960, y: 540 } as const;

export interface RotateLetter {
  ch: string;
  ox: number;
  oy: number;
  theta: readonly number[];
}

export const ROTATE_LETTERS: readonly RotateLetter[] = [
  {
    ch: "R",
    ox: -420.2,
    oy: -1.6,
    theta: [0, 1, 3, 8, 14.5, 16.5, 18, 18.5, 19, 18.5, 18, 17.5, 17, 16.5, 15, 12.5, 8.5, 2, -12, -27.5, -34.5, -39, -42, -43.5, -44.5, -45.5, -46, -46, -46, -45.5, -45, -44, -42, -39.5, -34, -23.5, -13],
  },
  {
    ch: "O",
    ox: -233,
    oy: 0,
    theta: [15.9, 17.9, 19, 19.5, 19.8, 19.9, 19.2, 17.1, 13, 6.6, -2.9, -17.7, -39.5, -74.8, -140.3, -244.6, -310.3, -345.7, -367.6, -382, -391.8, -398.2, -402.2, -404.4, -405, -405, -404.8, -404.3, -403.6, -402.6, -401.1, -398.8, -395, -388.1, -377.1, -370.2, -366.4],
  },
  {
    ch: "T",
    ox: -62,
    oy: -31.5,
    theta: [0, 0.5, 1.5, 4, 13.5, 18.5, 19.5, 20, 20, 18.8, 17.6, 16.4, 15.2, 14, 10.5, 4.5, -8.5, -24.5, -32.5, -37.5, -40, -42, -43.5, -44.5, -44.5, -44.5, -45, -44.5, -44, -43.5, -42, -40, -37.5, -32.5, -23, -13, -7.5],
  },
  {
    ch: "A",
    ox: 90.1,
    oy: 7.4,
    theta: [0, 0, 1, 4, 13.5, 18.5, 19.5, 20, 20, 18.8, 17.6, 16.4, 15.2, 14, 10.5, 4, -8.5, -24.5, -33, -37.5, -40.5, -42.5, -43.5, -44.5, -44.5, -45, -45, -44.5, -44, -43.5, -42, -40.5, -37.5, -33, -23.5, -13, -7.5],
  },
  {
    ch: "T",
    ox: 242,
    oy: -31.5,
    theta: [16, 18, 19, 19.6, 19.9, 19.9, 19.3, 17.1, 13.1, 6.6, -3.1, -17.6, -40, -75, -140.7, -244.8, -310.3, -345.6, -367.5, -382, -391.8, -398.3, -402.3, -404.5, -405, -405.1, -404.8, -404.4, -403.7, -402.7, -401.1, -398.8, -395.1, -388.1, -377.1, -370.1, -366.4],
  },
  {
    ch: "E",
    ox: 399.8,
    oy: -5.5,
    theta: [0, 1, 3, 9, 14.5, 17, 18.5, 19, 19, 18.6, 18.2, 17.8, 17.4, 17, 15.5, 13, 9, 2, -11.5, -27, -34.5, -39, -41.5, -43.5, -44.5, -45.5, -45.5, -46.5, -46, -45, -44.5, -43.5, -42, -39, -34, -23, -12.5],
  },
];

export function rotatePose(f: number): number[] {
  const i = f - PHASES[2].from;
  return ROTATE_LETTERS.map((L) => sample(L.theta, i));
}

export const BREAK_CAP = 252;

export interface BreakLetter {
  ch: string;
  w: number;
  x0: readonly number[];
  y0: readonly number[];
}

export const BREAK_LETTERS: readonly BreakLetter[] = [
  {
    ch: "B",
    w: 188,
    x0: [390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390],
    y0: [398, 374, 359, 349, 343, 339, 336, 334, 334, 334, 334, 334, 334, 334, 334, 334],
  },
  {
    ch: "R",
    w: 188,
    x0: [610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610, 610],
    y0: [398, 374, 359, 349, 343, 339, 336, 334, 334, 334, 334, 334, 334, 334, 334, 334],
  },
  {
    ch: "E",
    w: 188,
    x0: [838, 838, 839, 839, 839, 840, 840, 840, 841, 841, 841, 841, 842, 842, 842, 842],
    y0: [416, 404, 401, 406, 419, 440, 467, 502, 543, 589, 642, 700, 763, 800, 788, 785],
  },
  {
    ch: "A",
    w: 245,
    x0: [1047, 1047, 1048, 1048, 1048, 1048, 1048, 1049, 1049, 1049, 1049, 1050, 1050, 1050, 1050, 1050],
    y0: [417, 407, 405, 411, 426, 450, 481, 522, 571, 628, 694, 768, 794, 779, 772, 773],
  },
  {
    ch: "K",
    w: 209,
    x0: [1321, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1330, 1331, 1332, 1333, 1333, 1333, 1333],
    y0: [411, 395, 386, 386, 395, 411, 434, 465, 502, 545, 595, 650, 710, 774, 797, 787],
  },
];

export const BREAK_FLOOR = 1050;

export function breakPose(f: number): { x: number; y: number }[] {
  const i = f - PHASES[3].from;
  return BREAK_LETTERS.map((L) => ({
    x: sample(L.x0, i) + L.w / 2,
    y: sample(L.y0, i) + BREAK_CAP / 2,
  }));
}

export const CONDENSE_CAP = 560;
export const CONDENSE_Y = 540;
export const CONDENSE_CX = 960;

export const CONDENSE_LETTERS: readonly { ch: string; x0: number; w: number }[] = [
  { ch: "C", x0: 48, w: 215 },
  { ch: "O", x0: 276, w: 233 },
  { ch: "N", x0: 541, w: 199 },
  { ch: "D", x0: 787, w: 202 },
  { ch: "E", x0: 1022, w: 183 },
  { ch: "N", x0: 1238, w: 199 },
  { ch: "S", x0: 1466, w: 192 },
  { ch: "E", x0: 1689, w: 183 },
];

export const CONDENSE_W118 = 1824;

export const CONDENSE_STEPS: readonly (readonly [number, number, number, number])[] = [
  [116.52, 7.45, 1832, 1496],
  [123.97, 11.32, 1496, 1158],
  [139.43, 22.57, 1158, 0],
];

export function condenseWidth(f: number): number {
  let w = CONDENSE_STEPS[0][2];
  for (const [t0, dur, a, b] of CONDENSE_STEPS) w = move(f, t0, dur, a, b, w);
  return w;
}

export const MOTTLE_DEPTH = 0.18;
export const MOTTLE_CELLS = 24;
export const MOTTLE_TILE = 320;

export const SPLIT_FRAMES = 2;
export const SPLIT_PX = 9;
export const SPLIT_ALPHA = 0.55;
export const SPLIT_HUE = 40;

export const SMEAR_SHUTTER = 0.8;
export const SMEAR_TAPS = 5;
export const SMEAR_MIN = 12;
export const SMEAR_FULL = 90;
export const SMEAR_ALPHA = 0.5;

export function smearWeight(speed: number): number {
  if (speed <= SMEAR_MIN) return 0;
  return Math.min(1, (speed - SMEAR_MIN) / (SMEAR_FULL - SMEAR_MIN));
}

export const STILL_FRAME = 91;
