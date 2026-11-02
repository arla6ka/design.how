// Spike type (https://design.how/vault/spike-type), spikes.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, PALETTE, MAX_LEN, EVERY, BREATH_AMT, BREATH_RATE, REPEL, HUE_TO, FONT_VAR).
import type { Edge, Field } from "./outline";

export interface Spike {
  path: number[];
  x: number;
  y: number;
  nx: number;
  ny: number;
  reach: number;
  slack: number;
}

export interface SpikeOpts {
  maxLen: number;
  root: number;
  steps: number;
  field: Field;
}

function headroom(x: number, y: number, dx: number, dy: number, max: number, f: Field): number {
  const step = Math.max(1, f.scale);
  const skip = step * 3;
  for (let d = skip; d < max; d += step) {
    if (f.hit(x + dx * d, y + dy * d)) return d;
  }
  return max;
}

function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function grow(edge: Edge, every: number, o: SpikeOpts, seed: number): Spike[] {
  const n = edge.pts.length / 2;
  const out: Spike[] = [];

  for (let i = 0; i < n; i += every) {
    const s = seed + i * 0.371;

    const u = rnd(s);
    const reach = Math.pow(u, 2.6);
    const len = o.maxLen * (0.06 + 0.94 * reach);

    if (rnd(s + 91.3) < 0.14) continue;

    const px = edge.pts[i * 2];
    const py = edge.pts[i * 2 + 1];
    let nx = edge.nrm[i * 2];
    let ny = edge.nrm[i * 2 + 1];

    const lean = (rnd(s + 17.7) - 0.5) * 0.9;
    const cs = Math.cos(lean);
    const sn = Math.sin(lean);
    const rx = nx * cs - ny * sn;
    const ry = nx * sn + ny * cs;
    nx = rx;
    ny = ry;

    const room = headroom(px, py, nx, ny, o.maxLen, o.field);
    const capped = Math.min(len, room * 0.62);
    if (capped < o.root * 2.5) continue;

    out.push({
      path: spine(capped, o, s),
      x: px,
      y: py,
      nx,
      ny,
      reach: capped / o.maxLen,
      slack: Math.min(o.maxLen * 0.55, room * 0.62 - capped) / capped,
    });
  }

  return out;
}

function spine(len: number, o: SpikeOpts, seed: number): number[] {
  const steps = o.steps;
  const sx: number[] = new Array(steps + 1);
  const sy: number[] = new Array(steps + 1);
  const hw: number[] = new Array(steps + 1);

  const bury = o.root * 2.2;
  let dx = 1;
  let dy = 0;
  let cx = -bury;
  let cy = 0;

  const wander = (rnd(seed + 3.3) - 0.5) * 0.55;

  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    sx[k] = cx;
    sy[k] = cy;

    hw[k] = o.root * Math.pow(1 - t, 1.8);

    if (k === steps) break;

    const turn =
      (rnd(seed + k * 7.13) - 0.5) * 0.22 + wander * (1 / steps);
    const c = Math.cos(turn);
    const s2 = Math.sin(turn);
    const ndx = dx * c - dy * s2;
    const ndy = dx * s2 + dy * c;
    dx = ndx;
    dy = ndy;

    const seg = (len + bury) / steps;
    cx += dx * seg;
    cy += dy * seg;
  }

  const path: number[] = [];
  for (let k = 0; k <= steps; k++) {
    const p = Math.max(0, k - 1);
    const q = Math.min(steps, k + 1);
    const tx = sx[q] - sx[p];
    const ty = sy[q] - sy[p];
    const tl = Math.hypot(tx, ty) || 1;
    path.push(sx[k] + (ty / tl) * hw[k], sy[k] - (tx / tl) * hw[k]);
  }
  for (let k = steps; k >= 0; k--) {
    const p = Math.max(0, k - 1);
    const q = Math.min(steps, k + 1);
    const tx = sx[q] - sx[p];
    const ty = sy[q] - sy[p];
    const tl = Math.hypot(tx, ty) || 1;
    path.push(sx[k] - (ty / tl) * hw[k], sy[k] + (tx / tl) * hw[k]);
  }
  return path;
}
