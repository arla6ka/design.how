import { Field } from "./sdf";

const fmt = (v: number) => v.toFixed(2);

export interface MarchOptions {
  cell?: number;
  smooth?: number;
}

type Pt = { x: number; y: number };

const EDGES: number[][][] = [
  [],
  [[3, 2]],
  [[2, 1]],
  [[3, 1]],
  [[0, 1]],
  [[3, 2], [0, 1]],
  [[0, 2]],
  [[3, 0]],
  [[3, 0]],
  [[0, 2]],
  [[3, 0], [2, 1]],
  [[0, 1]],
  [[3, 1]],
  [[2, 1]],
  [[3, 2]],
  [],
];

function lerpEdge(x0: number, y0: number, v0: number, x1: number, y1: number, v1: number): Pt {
  const denom = v0 - v1;
  const t = Math.abs(denom) < 1e-6 ? 0.5 : v0 / denom;
  const tc = Math.max(0, Math.min(1, t));
  return { x: x0 + (x1 - x0) * tc, y: y0 + (y1 - y0) * tc };
}

export function contour(field: Field, opts: MarchOptions = {}): Pt[][] {
  const cell = Math.max(2, opts.cell ?? 6);
  const b = field.bounds();
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  if (w <= 0 || h <= 0) return [];

  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  if (cols * rows > 400_000) return [];

  const val = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const y = b.minY + j * cell;
    for (let i = 0; i < cols; i++) {
      val[j * cols + i] = field.eval(b.minX + i * cell, y);
    }
  }
  const at = (i: number, j: number) => val[j * cols + i];

  const segs: [Pt, Pt][] = [];

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const x0 = b.minX + i * cell;
      const y0 = b.minY + j * cell;
      const x1 = x0 + cell;
      const y1 = y0 + cell;
      const vTL = at(i, j);
      const vTR = at(i + 1, j);
      const vBR = at(i + 1, j + 1);
      const vBL = at(i, j + 1);
      let mask = 0;
      if (vTL < 0) mask |= 8;
      if (vTR < 0) mask |= 4;
      if (vBR < 0) mask |= 2;
      if (vBL < 0) mask |= 1;
      if (mask === 0 || mask === 15) continue;

      const edgePt = (edge: number): Pt => {
        switch (edge) {
          case 0: return lerpEdge(x0, y0, vTL, x1, y0, vTR);
          case 1: return lerpEdge(x1, y0, vTR, x1, y1, vBR);
          case 2: return lerpEdge(x0, y1, vBL, x1, y1, vBR);
          default: return lerpEdge(x0, y0, vTL, x0, y1, vBL);
        }
      };

      let cases = EDGES[mask];
      if (mask === 5 || mask === 10) {
        const center = field.eval((x0 + x1) / 2, (y0 + y1) / 2);
        if (mask === 5) cases = center < 0 ? [[3, 0], [2, 1]] : [[3, 2], [0, 1]];
        else cases = center < 0 ? [[3, 2], [0, 1]] : [[3, 0], [2, 1]];
      }
      for (const [ea, eb] of cases) segs.push([edgePt(ea), edgePt(eb)]);
    }
  }

  return stitch(segs, cell);
}

function stitch(segs: [Pt, Pt][], cell: number): Pt[][] {
  const eps = cell * 0.5;
  const key = (p: Pt) => `${Math.round(p.x / eps)},${Math.round(p.y / eps)}`;
  const map = new Map<string, { seg: number; end: 0 | 1 }[]>();
  segs.forEach((s, idx) => {
    for (const end of [0, 1] as const) {
      const k = key(s[end]);
      const arr = map.get(k);
      if (arr) arr.push({ seg: idx, end });
      else map.set(k, [{ seg: idx, end }]);
    }
  });

  const used = new Array(segs.length).fill(false);
  const loops: Pt[][] = [];

  for (let start = 0; start < segs.length; start++) {
    if (used[start]) continue;
    const loop: Pt[] = [];
    let cur = start;
    let end: 0 | 1 = 0;
    let guard = 0;
    while (!used[cur] && guard++ < segs.length + 2) {
      used[cur] = true;
      const a = segs[cur][end];
      const bEnd = (end === 0 ? 1 : 0) as 0 | 1;
      const bPt = segs[cur][bEnd];
      loop.push(a);
      const cands = map.get(key(bPt)) ?? [];
      let next = -1;
      let nextEnd: 0 | 1 = 0;
      for (const c of cands) {
        if (!used[c.seg]) {
          next = c.seg;
          nextEnd = c.end;
          break;
        }
      }
      if (next === -1) break;
      cur = next;
      end = nextEnd;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function chaikin(pts: Pt[], passes: number): Pt[] {
  let out = pts;
  for (let p = 0; p < passes; p++) {
    const next: Pt[] = [];
    const n = out.length;
    for (let i = 0; i < n; i++) {
      const a = out[i];
      const b = out[(i + 1) % n];
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    out = next;
  }
  return out;
}

export function fieldToPath(
  field: Field,
  opts: MarchOptions = {},
): { d: string; minX: number; minY: number; width: number; height: number } {
  const b = field.bounds();
  const loops = contour(field, opts);
  const smooth = opts.smooth ?? 2;
  const parts: string[] = [];
  for (const loop of loops) {
    const s = smooth > 0 ? chaikin(loop, smooth) : loop;
    if (s.length < 3) continue;
    parts.push(
      `M ${fmt(s[0].x)} ${fmt(s[0].y)} ` +
        s.slice(1).map((p) => `L ${fmt(p.x)} ${fmt(p.y)}`).join(" ") +
        " Z",
    );
  }
  return {
    d: parts.join(" "),
    minX: b.minX,
    minY: b.minY,
    width: b.maxX - b.minX,
    height: b.maxY - b.minY,
  };
}
