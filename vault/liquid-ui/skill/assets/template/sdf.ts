// Liquid UI (https://design.how/vault/liquid-ui), sdf.ts.
// FIXED. Change the VARIABLE values in params instead (CARD_SCENES, k, HOLD_MS, MORPH_MS, SKIN, GROUND, SMOOTH).
export function sdRoundBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  r: number,
): number {
  const rr = Math.min(r, Math.min(hw, hh));
  const qx = Math.abs(px - cx) - hw + rr;
  const qy = Math.abs(py - cy) - hh + rr;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  const outside = Math.hypot(ax, ay);
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - rr;
}

export function sdCapsule(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number,
): number {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const denom = bax * bax + bay * bay || 1e-6;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.hypot(dx, dy) - r;
}

export function smin(a: number, b: number, k: number): number {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

export interface RoundBox {
  kind: "box";
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  r: number;
}
export interface Bridge {
  kind: "bridge";
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
}
export type Shape = RoundBox | Bridge;

export function shapeSD(s: Shape, px: number, py: number): number {
  return s.kind === "box"
    ? sdRoundBox(px, py, s.cx, s.cy, s.hw, s.hh, s.r)
    : sdCapsule(px, py, s.ax, s.ay, s.bx, s.by, s.r);
}

export class Field {
  shapes: Shape[];
  k: number;

  constructor(shapes: Shape[] = [], k = 12) {
    this.shapes = shapes;
    this.k = k;
  }

  eval(x: number, y: number): number {
    const { shapes, k } = this;
    if (shapes.length === 0) return Infinity;
    let d = shapeSD(shapes[0], x, y);
    for (let i = 1; i < shapes.length; i++) {
      d = smin(d, shapeSD(shapes[i], x, y), k);
    }
    return d;
  }

  bounds(pad = 0): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const grow = pad + this.k;
    for (const s of this.shapes) {
      if (s.kind === "box") {
        minX = Math.min(minX, s.cx - s.hw - grow);
        minY = Math.min(minY, s.cy - s.hh - grow);
        maxX = Math.max(maxX, s.cx + s.hw + grow);
        maxY = Math.max(maxY, s.cy + s.hh + grow);
      } else {
        minX = Math.min(minX, Math.min(s.ax, s.bx) - s.r - grow);
        minY = Math.min(minY, Math.min(s.ay, s.by) - s.r - grow);
        maxX = Math.max(maxX, Math.max(s.ax, s.bx) + s.r + grow);
        maxY = Math.max(maxY, Math.max(s.ay, s.by) + s.r + grow);
      }
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
  }
}
