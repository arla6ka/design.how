export interface StrokeKey {
  t: number;
  x: number;
  y: number;
  len: number;
  wid: number;
  ang: number;
  hue: number;
  fade?: number;
}

export interface StrokeGroup {
  count: number;
  gap: number;
  sat: number;
  lit: number;
  keys: StrokeKey[];
}

export const GROUPS: StrokeGroup[] = [
  {
    count: 6,
    gap: 6.5,
    sat: 0.78,
    lit: 0.72,
    keys: [
      { t: 40, x: 424, y: 174, len: 20, wid: 1.8, ang: -9, hue: 294 },
      { t: 42, x: 438, y: 172, len: 27, wid: 2.7, ang: -9, hue: 284 },
      { t: 44, x: 460, y: 166, len: 43, wid: 4.0, ang: -10, hue: 266 },
      { t: 46, x: 510, y: 148, len: 81, wid: 6.5, ang: -12, hue: 246 },
      { t: 47, x: 554, y: 147, len: 128, wid: 8.5, ang: -11, hue: 238 },
      { t: 48, x: 626, y: 124, len: 190, wid: 11, ang: -12, hue: 230 },
      { t: 49, x: 726, y: 100, len: 220, wid: 13, ang: -12, hue: 226 },
    ],
  },
  {
    count: 6,
    gap: 7,
    sat: 0.55,
    lit: 0.7,
    keys: [
      { t: 40, x: 326, y: 219, len: 33, wid: 2.4, ang: -12, hue: 14 },
      { t: 42, x: 318, y: 223, len: 32, wid: 3.0, ang: -12, hue: 18 },
      { t: 44, x: 296, y: 227, len: 57, wid: 5.0, ang: -12, hue: 22 },
      { t: 46, x: 277, y: 235, len: 86, wid: 9.0, ang: -13, hue: 26 },
      { t: 48, x: 236, y: 277, len: 169, wid: 16, ang: -23, hue: 27 },
      { t: 50, x: 186, y: 299, len: 190, wid: 20, ang: -27, hue: 31 },
      { t: 51, x: 140, y: 312, len: 210, wid: 22, ang: -24, hue: 33, fade: 0.4 },
    ],
  },
  {
    count: 2,
    gap: 8,
    sat: 0.42,
    lit: 0.66,
    keys: [
      { t: 40, x: 400, y: 188, len: 27, wid: 1.5, ang: 0, hue: 320 },
      { t: 44, x: 420, y: 218, len: 19, wid: 2.5, ang: -2, hue: 318 },
      { t: 47, x: 415, y: 225, len: 30, wid: 4.8, ang: 1, hue: 313 },
      { t: 49, x: 423, y: 257, len: 80, wid: 9, ang: 7, hue: 313 },
      { t: 51, x: 402, y: 300, len: 78, wid: 16, ang: -6, hue: 318 },
      { t: 52, x: 412, y: 290, len: 60, wid: 19, ang: -6, hue: 308, fade: 0 },
    ],
  },
  {
    count: 7,
    gap: 6.5,
    sat: 0.55,
    lit: 0.68,
    keys: [
      { t: 46, x: 485, y: 181, len: 50, wid: 3.5, ang: -6, hue: 262 },
      { t: 47, x: 472, y: 201, len: 74, wid: 5.0, ang: -3, hue: 273 },
      { t: 48, x: 477, y: 211, len: 68, wid: 6.0, ang: -5, hue: 268 },
      { t: 49, x: 478, y: 231, len: 90, wid: 9.0, ang: -2, hue: 272 },
      { t: 50, x: 536, y: 280, len: 148, wid: 18, ang: 14, hue: 262 },
      { t: 51, x: 626, y: 368, len: 146, wid: 24, ang: 18, hue: 261 },
    ],
  },
  {
    count: 4,
    gap: 9,
    sat: 0.58,
    lit: 0.7,
    keys: [
      { t: 47, x: 180, y: 260, len: 90, wid: 6, ang: -16, hue: 45 },
      { t: 49, x: 133, y: 277, len: 186, wid: 9, ang: -17, hue: 54 },
      { t: 50, x: 88, y: 303, len: 247, wid: 14, ang: -21, hue: 55 },
      { t: 51, x: 40, y: 290, len: 220, wid: 16, ang: -14, hue: 58, fade: 0.4 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.62,
    lit: 0.7,
    keys: [
      { t: 51, x: 250, y: 290, len: 200, wid: 26, ang: -17, hue: 22 },
      { t: 52, x: 204, y: 304, len: 294, wid: 37, ang: -17, hue: 23 },
      { t: 53, x: 135, y: 331, len: 339, wid: 58, ang: -18, hue: 29 },
      { t: 53.8, x: -80, y: 400, len: 340, wid: 60, ang: -18, hue: 32 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.58,
    lit: 0.7,
    keys: [
      { t: 52, x: 57, y: 214, len: 169, wid: 20, ang: -3, hue: 65 },
      { t: 53, x: 0, y: 180, len: 296, wid: 28, ang: -2, hue: 68 },
      { t: 53.6, x: -200, y: 165, len: 296, wid: 28, ang: -2, hue: 70 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.5,
    lit: 0.68,
    keys: [
      { t: 51, x: 150, y: 140, len: 120, wid: 12, ang: 6, hue: 80 },
      { t: 52, x: 117, y: 106, len: 260, wid: 20, ang: 8, hue: 80 },
      { t: 54, x: 95, y: 53, len: 223, wid: 45, ang: 6, hue: 81 },
      { t: 54.7, x: 80, y: -120, len: 200, wid: 50, ang: 6, hue: 82 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.45,
    lit: 0.66,
    keys: [
      { t: 52, x: 438, y: 81, len: 43, wid: 16, ang: 4, hue: 200 },
      { t: 53, x: 459, y: 118, len: 28, wid: 18, ang: -6, hue: 219 },
      { t: 54, x: 520, y: 100, len: 30, wid: 18, ang: -6, hue: 224, fade: 0 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.85,
    lit: 0.7,
    keys: [
      { t: 53, x: 480, y: 170, len: 180, wid: 40, ang: 2, hue: 228 },
      { t: 54, x: 576, y: 160, len: 277, wid: 58, ang: 1, hue: 224 },
      { t: 54.7, x: 880, y: 150, len: 280, wid: 60, ang: 1, hue: 222 },
    ],
  },
  {
    count: 1,
    gap: 0,
    sat: 0.5,
    lit: 0.67,
    keys: [
      { t: 53, x: 442, y: 248, len: 155, wid: 30, ang: -4, hue: 279 },
      { t: 54, x: 580, y: 430, len: 170, wid: 34, ang: 12, hue: 275 },
      { t: 54.6, x: 700, y: 540, len: 170, wid: 34, ang: 14, hue: 273 },
    ],
  },
];

export function groupAt(
  g: StrokeGroup,
  t: number,
): (Omit<StrokeKey, "t" | "fade"> & { alpha: number }) | null {
  const ks = g.keys;
  if (t < ks[0].t || t > ks[ks.length - 1].t) return null;
  let i = 0;
  while (i < ks.length - 1 && ks[i + 1].t <= t) i++;
  const a = ks[i];
  const b = ks[Math.min(i + 1, ks.length - 1)];
  const u = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  const L = (p: number, q: number) => p + (q - p) * u;
  return {
    x: L(a.x, b.x),
    y: L(a.y, b.y),
    len: L(a.len, b.len),
    wid: L(a.wid, b.wid),
    ang: L(a.ang, b.ang),
    hue: L(a.hue, b.hue),
    alpha: L(a.fade ?? 1, b.fade ?? 1),
  };
}
