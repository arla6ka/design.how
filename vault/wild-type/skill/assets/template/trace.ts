// Wild type (https://design.how/vault/wild-type), trace.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, ACCENTS, BG, INK, OBLIQUE, REST_WIDTH_FRAC, GRAIN_ALPHA, FONT_CSS).
export interface Ring {
  pts: Float64Array;
  hole: boolean;
}

export interface TracedGlyph {
  name: string;
  rings: Ring[];
  cx: number;
  cy: number;
  x0: number;
  x1: number;
}

export interface TracedWord {
  word: string;
  glyphs: TracedGlyph[];
  baseline: number;
}

type Seg = [number, number, number, number];

function area(p: number[]): number {
  let a = 0;
  const n = p.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += p[i * 2] * p[j * 2 + 1] - p[j * 2] * p[i * 2 + 1];
  }
  return a / 2;
}

function march(a: Float32Array, w: number, h: number, minArea: number): number[][] {
  const iso = 0.5;
  const segs: Seg[] = [];
  const at = (x: number, y: number) => a[y * w + x];
  const cross = (x0: number, y0: number, x1: number, y1: number): [number, number] => {
    const v0 = at(x0, y0);
    const v1 = at(x1, y1);
    const t = v1 === v0 ? 0.5 : (iso - v0) / (v1 - v0);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = at(x, y) >= iso ? 1 : 0;
      const tr = at(x + 1, y) >= iso ? 1 : 0;
      const br = at(x + 1, y + 1) >= iso ? 1 : 0;
      const bl = at(x, y + 1) >= iso ? 1 : 0;
      const c = tl | (tr << 1) | (br << 2) | (bl << 3);
      if (c === 0 || c === 15) continue;
      const e = (k: number): [number, number] =>
        k === 0
          ? cross(x, y, x + 1, y)
          : k === 1
            ? cross(x + 1, y, x + 1, y + 1)
            : k === 2
              ? cross(x, y + 1, x + 1, y + 1)
              : cross(x, y, x, y + 1);
      let pairs: number[][];
      switch (c) {
        case 1: case 14: pairs = [[3, 0]]; break;
        case 2: case 13: pairs = [[0, 1]]; break;
        case 3: case 12: pairs = [[3, 1]]; break;
        case 4: case 11: pairs = [[1, 2]]; break;
        case 6: case 9: pairs = [[0, 2]]; break;
        case 7: case 8: pairs = [[3, 2]]; break;
        case 5: case 10: {
          const mid = (at(x, y) + at(x + 1, y) + at(x + 1, y + 1) + at(x, y + 1)) / 4;
          const inside = mid >= iso;
          pairs = (c === 5) === inside ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]];
          break;
        }
        default: pairs = [];
      }
      for (const [p, q] of pairs) {
        const A = e(p);
        const B = e(q);
        segs.push([A[0], A[1], B[0], B[1]]);
      }
    }
  }
  const key = (x: number, y: number) => `${Math.round(x * 64)},${Math.round(y * 64)}`;
  const touching = new Map<string, number[]>();
  const add = (k: string, i: number) => (touching.get(k) ?? touching.set(k, []).get(k)!).push(i);
  for (let i = 0; i < segs.length; i++) {
    add(key(segs[i][0], segs[i][1]), i);
    add(key(segs[i][2], segs[i][3]), i);
  }
  const used = new Uint8Array(segs.length);
  const loops: number[][] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const loop: number[] = [segs[i][0], segs[i][1]];
    const startKey = key(segs[i][0], segs[i][1]);
    let cx = segs[i][2];
    let cy = segs[i][3];
    for (let guard = 0; guard < segs.length; guard++) {
      loop.push(cx, cy);
      const k = key(cx, cy);
      if (k === startKey) break;
      const cand = touching.get(k);
      let next = -1;
      if (cand) for (const j of cand) if (!used[j]) { next = j; break; }
      if (next < 0) break;
      used[next] = 1;
      const sg = segs[next];
      if (key(sg[0], sg[1]) === k) { cx = sg[2]; cy = sg[3]; }
      else { cx = sg[0]; cy = sg[1]; }
    }
    if (loop.length >= 4 && key(loop[loop.length - 2], loop[loop.length - 1]) === startKey) loop.length -= 2;
    if (loop.length >= 6 && Math.abs(area(loop)) >= minArea) loops.push(loop);
  }
  return loops;
}

function simplify(pts: number[], tol: number): number[] {
  const n = pts.length / 2;
  if (n < 4) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const ax = pts[a * 2], ay = pts[a * 2 + 1], bx = pts[b * 2], by = pts[b * 2 + 1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bd = tol;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i * 2] - ax, py = pts[i * 2 + 1] - ay;
      const d = Math.abs(px * dy - py * dx) / len;
      if (d > bd) { bd = d; best = i; }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
  return out;
}

function inside(px: number, py: number, ring: number[]): boolean {
  let hit = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1], xj = ring[j * 2], yj = ring[j * 2 + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function traceWord(
  word: string,
  family: string,
  weight: number,
  oblique: number,
  em: number,
  tol: number,
  minArea = 0,
): TracedWord | null {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;
  const font = `${weight} ${em}px ${family}`;
  measure.font = font;
  const advances: number[] = [];
  let total = 0;
  for (const ch of word) {
    advances.push(total);
    total += measure.measureText(ch).width;
  }
  const pad = Math.ceil(em * 0.5);
  const W = Math.ceil(total + pad * 2 + em * oblique);
  const H = Math.ceil(em * 1.7);
  const baselineY = Math.round(em * 1.15);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const raw: { name: string; rings: number[][] }[] = [];
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  const chars = [...word];
  for (let k = 0; k < chars.length; k++) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.setTransform(1, 0, -oblique, 1, oblique * baselineY, 0);
    ctx.font = font;
    ctx.fillStyle = "#000";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(chars[k], pad + advances[k], baselineY);
    const img = ctx.getImageData(0, 0, W, H).data;
    const a = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = img[i * 4 + 3] / 255;
    const loops = march(a, W, H, minArea).map((l) => simplify(l, tol));
    for (const l of loops) {
      for (let i = 0; i < l.length; i += 2) {
        if (l[i] < minx) minx = l[i];
        if (l[i] > maxx) maxx = l[i];
        if (l[i + 1] < miny) miny = l[i + 1];
        if (l[i + 1] > maxy) maxy = l[i + 1];
      }
    }
    raw.push({ name: chars[k], rings: loops });
  }
  if (!isFinite(minx)) return null;
  const cx0 = (minx + maxx) / 2;
  const cy0 = (miny + maxy) / 2;
  const half = (maxx - minx) / 2 || 1;
  const nx = (x: number) => (x - cx0) / half;
  const ny = (y: number) => (y - cy0) / half;

  const glyphs: TracedGlyph[] = raw.map((g) => {
    const rings: Ring[] = g.rings.map((r, i) => {
      const hole = g.rings.some((o, j) => j !== i && inside(r[0], r[1], o));
      const pts = new Float64Array(r.length);
      for (let p = 0; p < r.length; p += 2) {
        pts[p] = nx(r[p]);
        pts[p + 1] = ny(r[p + 1]);
      }
      return { pts, hole };
    });
    let sx = 0, sy = 0, n = 0, x0 = Infinity, x1 = -Infinity;
    for (const r of rings) {
      if (r.hole) continue;
      for (let p = 0; p < r.pts.length; p += 2) {
        sx += r.pts[p];
        sy += r.pts[p + 1];
        n++;
        if (r.pts[p] < x0) x0 = r.pts[p];
        if (r.pts[p] > x1) x1 = r.pts[p];
      }
    }
    return { name: g.name, rings, cx: n ? sx / n : 0, cy: n ? sy / n : 0, x0, x1 };
  });
  return { word, glyphs, baseline: ny(baselineY) };
}
