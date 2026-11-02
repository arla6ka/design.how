export const FRAME_MS = 100 / 3;
export const FRAMES = 150;
export const FIRST_HOLD_MS = 130;
export const PLAY_RATE = 1.25;
export const LOOP_MS = (FIRST_HOLD_MS + (FRAMES - 1) * FRAME_MS) / PLAY_RATE;

export function frameAt(t: number): number {
  const tt = t * PLAY_RATE;
  if (tt < FIRST_HOLD_MS) return 0;
  return Math.min(FRAMES - 1, 1 + (tt - FIRST_HOLD_MS) / FRAME_MS);
}

export const SCENE_W = 1080;
export const SCENE_H = 608;

export const GROUND = "#d0edfa";
export const GROUND_RGB: readonly [number, number, number] = [208 / 255, 237 / 255, 250 / 255];
export const INK = "#ffffff";

export const FONT_VAR = "--visual-sans";
export const FONT_WEIGHT = 600;
export const STROKE_THICKEN = 3;
export const CAP = 88;

export interface Glyph {
  ch: string;
  x0: number;
  y0: number;
  w: number;
  h: number;
}

export const GLYPHS: readonly Glyph[] = [
  { ch: "D", x0: 134, y0: 231, w: 79, h: 90 },
  { ch: "r", x0: 219, y0: 255, w: 42, h: 66 },
  { ch: "i", x0: 265, y0: 232, w: 20, h: 89 },
  { ch: "f", x0: 290, y0: 230, w: 39, h: 91 },
  { ch: "t", x0: 329, y0: 238, w: 41, h: 84 },
  { ch: "i", x0: 406, y0: 232, w: 20, h: 89 },
  { ch: "n", x0: 434, y0: 254, w: 61, h: 67 },
  { ch: "t", x0: 499, y0: 238, w: 41, h: 84 },
  { ch: "o", x0: 543, y0: 254, w: 69, h: 69 },
  { ch: "f", x0: 644, y0: 230, w: 39, h: 91 },
  { ch: "o", x0: 684, y0: 254, w: 69, h: 69 },
  { ch: "c", x0: 755, y0: 254, w: 64, h: 69 },
  { ch: "u", x0: 825, y0: 256, w: 61, h: 67 },
  { ch: "s", x0: 891, y0: 254, w: 60, h: 69 },
];

export const REF_FRAME = 85;
export const DRIFT_PER_FRAME = 1.28;
export function drift(frame: number): number {
  return -DRIFT_PER_FRAME * (frame - REF_FRAME);
}

export interface Law {
  v: number;
  t0: number;
  thr: number;
  knots: readonly number[];
  sig: readonly number[];
  dx: readonly number[];
  dy: readonly number[];
  sc: readonly number[];
  amp: readonly number[];
}

export const ENTRY: Law = {
  v: 24,
  t0: 2,
  thr: 0.29,
  knots: [-16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80],
  sig: [54, 52, 40.667, 45.167, 35.5, 29.333, 23.333, 14, 11.667, 8, 6, 4, 2, 2, 1.1, 0.5, 2.5],
  dx: [-103, -94, -111.333, -147.667, -95, -56.333, -16.667, -2, 2.333, 1, 1, 1.5, 0, 0, 0, 0, 0],
  dy: [237, 194, 139.667, 146, 134, 101, 79, 48, 33, 20.667, 13, 6.5, 0, 0, 0, 0, 0],
  sc: [1, 1, 0.97, 0.95, 1.13, 1.2, 1.25, 1.22, 1.18, 1.1, 1.05, 1.05, 1, 1, 1, 1, 1],
  amp: [0.8, 0.8, 0.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export const EXIT: Law = {
  v: 36.25,
  t0: 96.5,
  thr: 0.27,
  knots: [-16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80],
  sig: [1, 1, 0.833, 2.167, 2, 5.5, 5.667, 11, 14.667, 31.5, 38, 12.5, 49.5, 59, 52.8, 54, 54],
  dx: [0, 0, 0, 0, 0, 2.333, 3.667, 9, 20.667, 56.667, 90, 125, 152, 110, 87, 122.222, 140],
  dy: [0, 0, 0, 0, 0, -3.667, -8, -16, -28.333, -49.333, -61, -72.5, -93, -117, -166, -193.333, -220],
  sc: [1, 1, 1, 1, 1, 1.02, 1, 1.15, 1.2, 1.22, 1.05, 0.95, 1.3, 0.7, 1, 1, 1],
  amp: [1, 1, 1, 1, 1, 1, 1, 0.85, 1, 1.07, 1.15, 1.03, 0.53, 0.15, 0, 0, 0],
};

export const THR_SWITCH = { from: 95, to: 105 } as const;

export function interp(knots: readonly number[], vals: readonly number[], x: number): number {
  const n = knots.length;
  if (x <= knots[0]) return vals[0];
  if (x >= knots[n - 1]) return vals[n - 1];
  let i = 1;
  while (knots[i] < x) i++;
  const h = knots[i] - knots[i - 1];
  const t = (x - knots[i - 1]) / h;
  const d = (vals[i] - vals[i - 1]) / h;
  const dPrev = i > 1 ? (vals[i - 1] - vals[i - 2]) / (knots[i - 1] - knots[i - 2]) : d;
  const dNext = i + 1 < n ? (vals[i + 1] - vals[i]) / (knots[i + 1] - knots[i]) : d;
  const tangent = (a: number, b: number) => (a * b <= 0 ? 0 : (2 * a * b) / (a + b));
  const m0 = tangent(dPrev, d) * h;
  const m1 = tangent(d, dNext) * h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * vals[i - 1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * vals[i] + (t3 - t2) * m1;
}

export function tauOf(law: Law, glyph: Glyph, frame: number): number {
  return frame - law.t0 - (glyph.x0 + glyph.w / 2) / law.v;
}

export const SHARPEN = { from: 12, to: 32 } as const;
export function sharpenTau(te: number): number {
  if (te <= SHARPEN.from || te >= SHARPEN.to) return te;
  const u = (te - SHARPEN.from) / (SHARPEN.to - SHARPEN.from);
  return SHARPEN.from + (SHARPEN.to - SHARPEN.from) * u * u * (3 - 2 * u);
}

export const WIND = { radius: 200, blur: 1, lift: 2.5, presenceMs: 160, followMs: 110 } as const;

export interface Wind {
  x: number;
  y: number;
  a: number;
}

export function approach(dtMs: number, tauMs: number): number {
  return 1 - Math.exp(-dtMs / tauMs);
}

export interface GlyphState {
  dx: number;
  dy: number;
  sig: number;
  sc: number;
  amp: number;
}

export function glyphState(glyph: Glyph, frame: number, wind: Wind | null = null): GlyphState {
  const te = tauOf(ENTRY, glyph, frame);
  const tx = tauOf(EXIT, glyph, frame);
  const e = {
    sig: interp(ENTRY.knots, ENTRY.sig, sharpenTau(te)),
    dx: interp(ENTRY.knots, ENTRY.dx, te),
    dy: interp(ENTRY.knots, ENTRY.dy, te),
    sc: interp(ENTRY.knots, ENTRY.sc, te),
    amp: interp(ENTRY.knots, ENTRY.amp, te),
  };
  const x = {
    sig: interp(EXIT.knots, EXIT.sig, tx),
    dx: interp(EXIT.knots, EXIT.dx, tx),
    dy: interp(EXIT.knots, EXIT.dy, tx),
    sc: interp(EXIT.knots, EXIT.sc, tx),
    amp: interp(EXIT.knots, EXIT.amp, tx),
  };
  const out = {
    dx: e.dx + x.dx,
    dy: e.dy + x.dy + drift(frame),
    sig: Math.max(e.sig, x.sig),
    sc: e.sc * x.sc,
    amp: e.amp * x.amp * tailFade(frame),
  };
  if (wind && wind.a > 0) {
    const cx = glyph.x0 + glyph.w / 2 + out.dx;
    const cy = glyph.y0 + glyph.h / 2 + out.dy;
    const d2 = (cx - wind.x) ** 2 + (cy - wind.y) ** 2;
    const w = wind.a * Math.exp(-d2 / (WIND.radius * WIND.radius));
    out.sig += WIND.blur * w;
    out.dy -= WIND.lift * w;
  }
  return out;
}

export const TAIL_FADE = { from: 147, to: 150 } as const;
export function tailFade(frame: number): number {
  const u = Math.min(1, Math.max(0, (frame - TAIL_FADE.from) / (TAIL_FADE.to - TAIL_FADE.from)));
  return 1 - u;
}

export function thresholdAt(frame: number): number {
  const u = Math.min(1, Math.max(0, (frame - THR_SWITCH.from) / (THR_SWITCH.to - THR_SWITCH.from)));
  return ENTRY.thr + (EXIT.thr - ENTRY.thr) * u;
}

export const DITHER = { sigma: 1.8, bias: 0.5, reach: 6 } as const;

export const LEVELS: readonly number[] = [0, 2, 4, 6, 8, 12, 16, 24, 32, 40, 48, 56, 64];
export const LEVEL_RES: readonly number[] = [2, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
export function levelPad(i: number): number {
  return LEVELS[i] === 0 ? 2 : Math.ceil(3 * LEVELS[i]);
}
export function levelMix(sig: number): { a: number; b: number; t: number } {
  if (sig <= LEVELS[1]) {
    return { a: 0, b: 1, t: Math.min(1, Math.max(0, sig / LEVELS[1])) };
  }
  for (let i = 1; i < LEVELS.length - 1; i++) {
    if (sig <= LEVELS[i + 1]) {
      const t = (Math.log(sig) - Math.log(LEVELS[i])) / (Math.log(LEVELS[i + 1]) - Math.log(LEVELS[i]));
      return { a: i, b: i + 1, t };
    }
  }
  return { a: LEVELS.length - 1, b: LEVELS.length - 1, t: 0 };
}

export const STILL_FRAME = REF_FRAME;
