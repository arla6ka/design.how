export const ART_W = 720;
export const ART_H = 720;
export const SCENE_W = 720;
export const SCENE_H = 360;
export const ART = { scale: 0.5, x: 180, y: 0 } as const;

export function toScene(x: number, y: number): { x: number; y: number } {
  return { x: ART.x + x * ART.scale, y: ART.y + y * ART.scale };
}

export const GROUND = "#ff4d1a";
export const FILL = "#fff6ec";
export const OUTLINE = "#111111";

export const FONT_VAR = "--visual-grotesk";
export const FILL_WEIGHT = 700;
export const OUTLINE_WEIGHT = 700;

export const CAP = 301;

export interface Line {
  text: string;
  baseline: number;
  fillCx: number;
  fillW: number;
  outlineCx: number;
  outlineW: number;
}

export const LINES: readonly Line[] = [
  { text: "HOLD", baseline: 350, fillCx: 363, fillW: 584, outlineCx: 358, outlineW: 614 },
  { text: "ON", baseline: 670, fillCx: 366.5, fillW: 245, outlineCx: 361.5, outlineW: 255 },
];

export const RING = 3;

export const FOIL_EXTRA = 14;
export const FOIL_SHIFT = -6;
export const PARALLAX_FOIL = -6;
export const FOIL_STOPS = ["#b8f3d8", "#d8c4ff", "#cfefff", "#ffd6b8"] as const;
export const FOIL_LINE_PITCH = 4;
export const FOIL_LINE_ANGLE = 45;
export const FOIL_LINE_ALPHA = 0.18;
export const FOIL_LINE_SLIDE = 40;
export const FOIL_PHASE_PER_TILT = 0.45;
export const FOIL_DRIFT_HZ = 0.035;

export function foilSpanAt(line: Line, r: number): { cx: number; w: number } {
  const cx0 = line.outlineCx + FOIL_SHIFT;
  const w0 = line.outlineW + FOIL_EXTRA;
  return { cx: cx0 + (line.fillCx - cx0) * r, w: w0 + (line.fillW - w0) * r };
}

export function foilPhase(tilt: { x: number; y: number }, t: number): number {
  const p = FOIL_PHASE_PER_TILT * (tilt.x * 0.7 + tilt.y * 0.3) + FOIL_DRIFT_HZ * t;
  return ((p % 1) + 1) % 1;
}

export const PARALLAX_OUTLINE = 9;
export const PARALLAX_FILL = -3;
export const SHADOW_PER_TILT = 5;
export const SHADOW_DROP = 2;
export const SHADOW_BLUR = 6;
export const SHADOW_ALPHA = 0.32;

export const TILT_FOLLOW = 0.1;
export const DRIFT = { ax: 0.85, ay: 0.7, px: 6.1, py: 8.3 } as const;

export const PULL_MIN = 2.4;
export const PULL_MAX = 4.6;
export const SHIFT_MS = 520;
export const SHIFT_X = 12;
export const SHIFT_Y = 5;
export const SHIFT_SEED = 0x7a3f19;

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

export function shiftAt(n: number): { x: number; y: number } {
  if (n <= 0) return { x: 0, y: 0 };
  let s = (SHIFT_SEED + n * 7919) >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const sign = rnd() < 0.5 ? -1 : 1;
  const x = sign * (4 + rnd() * (SHIFT_X - 4));
  const y = (rnd() * 2 - 1) * SHIFT_Y;
  return { x, y };
}

export function pullLength(n: number): number {
  let s = (SHIFT_SEED ^ (n * 2654435761)) >>> 0;
  s = (s * 1664525 + 1013904223) >>> 0;
  return PULL_MIN + (s / 0x100000000) * (PULL_MAX - PULL_MIN);
}

export function sheetAt(t: number): { n: number; start: number; length: number } {
  let n = 0;
  let start = 0;
  let length = pullLength(0);
  while (t >= start + length) {
    start += length;
    n++;
    length = pullLength(n);
  }
  return { n, start, length };
}

export function reprintAt(t: number, base = 0): { x: number; y: number } {
  if (t <= 0 && base === 0) return { x: 0, y: 0 };
  const { n, start, length } = sheetAt(Math.max(0, t));
  const within = Math.max(0, t) - start;
  const from = shiftAt(n + base);
  const to = shiftAt(n + base + 1);
  const slideStart = length - SHIFT_MS / 1000;
  if (within < slideStart) return from;
  const u = ease((within - slideStart) / (SHIFT_MS / 1000));
  return { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
}

export const REGISTER_IN = 0.14;
export const REGISTER_OUT = 0.08;

export function outlineSpanAt(line: Line, r: number): { cx: number; w: number } {
  return {
    cx: line.outlineCx + (line.fillCx - line.outlineCx) * r,
    w: line.outlineW + (line.fillW - line.outlineW) * r,
  };
}

export function tiltFromPointer(u: number, v: number): { x: number; y: number } {
  const r = Math.hypot(u, v);
  if (r <= 1) return { x: u, y: v };
  return { x: u / r, y: v / r };
}

export function driftAt(t: number): { x: number; y: number } {
  return tiltFromPointer(
    DRIFT.ax * Math.sin((2 * Math.PI * t) / DRIFT.px),
    DRIFT.ay * Math.sin((2 * Math.PI * t) / DRIFT.py + 1),
  );
}

export function planeOffsets(tilt: { x: number; y: number }) {
  return {
    outline: { x: tilt.x * PARALLAX_OUTLINE, y: tilt.y * PARALLAX_OUTLINE },
    fill: { x: tilt.x * PARALLAX_FILL, y: tilt.y * PARALLAX_FILL },
    shadow: { x: tilt.x * SHADOW_PER_TILT, y: tilt.y * SHADOW_PER_TILT + SHADOW_DROP },
  };
}

export const GRAIN_ALPHA = 0.03;
export const GRAIN_TILE = 256;
export const GRAIN_SEED = 0x1d5b2c;

export function sheetOffset(n: number): { x: number; y: number } {
  if (n <= 0) return { x: 0, y: 0 };
  let s = (GRAIN_SEED + n * 40503) >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return { x: Math.floor(rnd() * GRAIN_TILE), y: Math.floor(rnd() * GRAIN_TILE) };
}

export const STREAK_CELL = 36;
export const STREAK_DEPTH = 0.14;
export const PINHOLES = 46;
export const PINHOLE_R = { min: 0.8, max: 2.2 } as const;
export const INK_SEED = 0x3c6ef3;

export function streaksFor(n: number): number[] {
  let s = (INK_SEED + n * 7877) >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const cells = Math.ceil(ART_W / STREAK_CELL) + 2;
  const raw = Array.from({ length: cells }, () => rnd());
  return raw.map((v, i) => {
    const l = raw[Math.max(0, i - 1)];
    const r = raw[Math.min(cells - 1, i + 1)];
    return ((l + 2 * v + r) / 4) * STREAK_DEPTH;
  });
}

export function pinholesFor(n: number): { x: number; y: number; r: number }[] {
  let s = (INK_SEED ^ (n * 1234567)) >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return Array.from({ length: PINHOLES }, () => ({
    x: rnd() * ART_W,
    y: rnd() * ART_H,
    r: PINHOLE_R.min + rnd() * (PINHOLE_R.max - PINHOLE_R.min),
  }));
}

export const RING_STAMPS = 16;
