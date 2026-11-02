// Eclipse grid (https://design.how/vault/eclipse-grid), params.ts.
// VARIABLE: GROUND, INK, PHASE, SEPARATION, RING_SHARE, LIGHT. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const FRAME_MS = 40;
export const CYCLE_FRAMES = 56;
export const LOOP_MS = FRAME_MS * CYCLE_FRAMES;

export function frameStart(t: number): number {
  return Math.floor(t / FRAME_MS) * FRAME_MS;
}

export const SCENE_W = 800;
export const SCENE_H = 600;

export const GROUND = "#101012";
export const INK = "#ffb000";

export const COLS = 10;
export const ROWS = 8;
export const ORIGIN = { x: 62, y: 60.5 } as const;
export const PITCH = { x: 74.6, y: 68.1 } as const;

export function cellCentre(col: number, row: number): { x: number; y: number } {
  return { x: ORIGIN.x + PITCH.x * col, y: ORIGIN.y + PITCH.y * row };
}

export const DISC_R = 22;
export const RING_R = 21.5;
export const RING_STROKE = 2;

export const SEPARATION = 11;
export const RING_SHARE = 7 / 11;

export const CLOSED_FRAMES = 20;
export const RISE_FRAMES = 11;
export const OPEN_FRAMES = 14;
export const FALL_FRAMES = 11;

export const EASE: readonly [number, number, number, number] = [0.37, 0, 0.63, 1];

export function bezier(x: number, [x1, y1, x2, y2]: readonly [number, number, number, number]): number {
  const c = Math.min(1, Math.max(0, x));
  if (c <= 0) return 0;
  if (c >= 1) return 1;
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0;
  let hi = 1;
  let t = c;
  for (let i = 0; i < 24; i++) {
    const v = bx(t);
    if (Math.abs(v - c) < 1e-6) break;
    if (v < c) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return by(t);
}

export const PHASE: readonly (readonly number[])[] = [
  [35, 15, 21, 54, 18, 11, 48, 54, 30, 50],
  [ 3, 43, 11, 52, 23, 35, 19, 43, 28, 55],
  [40, 15, 54, 22, 49, 16, 47, 30, 54, 25],
  [53, 18, 28, 50,  5, 29, 50,  4, 26, 37],
  [12, 49, 55, 31, 52, 38, 18, 24,  0, 21],
  [37, 21, 45, 30,  1,  6, 46, 14, 55, 26],
  [18, 49, 32,  0, 27, 43, 18,  1, 25, 52],
  [31, 52,  6, 28, 39,  0, 21, 31, 53,  8],
];

export function openness(col: number, row: number, frame: number): number {
  const local = (((frame - PHASE[row][col]) % CYCLE_FRAMES) + CYCLE_FRAMES) % CYCLE_FRAMES;
  if (local < RISE_FRAMES) return bezier(local / RISE_FRAMES, EASE);
  if (local < RISE_FRAMES + OPEN_FRAMES) return 1;
  if (local < RISE_FRAMES + OPEN_FRAMES + FALL_FRAMES) return 1 - bezier((local - RISE_FRAMES - OPEN_FRAMES) / FALL_FRAMES, EASE);
  return 0;
}

export function cellPose(col: number, row: number, frame: number): { ring: { x: number; y: number }; disc: { x: number; y: number }; s: number } {
  const c = cellCentre(col, row);
  const s = openness(col, row, frame);
  const ringShift = SEPARATION * RING_SHARE * s;
  const discShift = SEPARATION * (1 - RING_SHARE) * s;
  return {
    ring: { x: c.x - ringShift, y: c.y - ringShift },
    disc: { x: c.x + discShift, y: c.y + discShift },
    s,
  };
}

export const LIGHT = { radius: 200, steer: 0.55, push: 0.5, presenceMs: 140, followMs: 90 } as const;

export function approach(dtMs: number, tauMs: number): number {
  return 1 - Math.exp(-dtMs / tauMs);
}

export interface Light {
  x: number;
  y: number;
  a: number;
}

export const DIAGONAL = { x: Math.SQRT1_2, y: Math.SQRT1_2 } as const;

export function lightPush(dist: number): number {
  return Math.exp(-(dist * dist) / (LIGHT.radius * LIGHT.radius));
}

export function cellPoseLit(col: number, row: number, frame: number, light: Light | null): { ring: { x: number; y: number }; disc: { x: number; y: number }; s: number; dir: { x: number; y: number } } {
  const c = cellCentre(col, row);
  let s = openness(col, row, frame);
  let dir = { x: DIAGONAL.x, y: DIAGONAL.y };
  if (light && light.a > 0) {
    const vx = c.x - light.x;
    const vy = c.y - light.y;
    const dist = Math.hypot(vx, vy);
    const k = light.a * LIGHT.steer;
    if (dist > 1e-6) {
      const bx = DIAGONAL.x * (1 - k) + (vx / dist) * k;
      const by = DIAGONAL.y * (1 - k) + (vy / dist) * k;
      const n = Math.hypot(bx, by) || 1;
      dir = { x: bx / n, y: by / n };
    }
    s = Math.max(s, light.a * LIGHT.push * lightPush(dist));
  }
  const total = SEPARATION * Math.SQRT2 * s;
  const ringShift = total * RING_SHARE;
  const discShift = total * (1 - RING_SHARE);
  return {
    ring: { x: c.x - dir.x * ringShift, y: c.y - dir.y * ringShift },
    disc: { x: c.x + dir.x * discShift, y: c.y + dir.y * discShift },
    s,
    dir,
  };
}

export const STILL_FRAME = 0;
