// Spike type (https://design.how/vault/spike-type), outline.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, PALETTE, MAX_LEN, EVERY, BREATH_AMT, BREATH_RATE, REPEL, HUE_TO, FONT_VAR).
export type Contour = number[];

export interface Field {
  hit: (x: number, y: number) => boolean;
  scale: number;
}

export interface Edge {
  pts: number[];
  nrm: number[];
}

export interface TraceOpts {
  word: string;
  font: string;
  w: number;
  h: number;
  dpr: number;
}

const WEIGHT = 700;

const EMPTY = { contours: [] as Contour[], field: { hit: () => false, scale: 1 } };

export function traceWord(o: TraceOpts): { contours: Contour[]; field: Field } {
  const gh = Math.max(360, Math.round(o.h * o.dpr * 1.15));
  const gw = Math.max(8, Math.round((gh * o.w) / o.h));

  const cv = document.createElement("canvas");
  cv.width = gw;
  cv.height = gh;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return EMPTY;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, gw, gh);

  const face = (px: number) => `${WEIGHT} ${px}px ${o.font}`;
  const PROBE = 100;
  ctx.font = face(PROBE);
  if (!ctx.font.includes(`${PROBE}px`)) return EMPTY;

  const unit = ctx.measureText(o.word).width / PROBE;
  const size = Math.min((gw * 0.74) / unit, gh * 0.62);
  ctx.font = face(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(o.word, gw / 2, gh / 2);

  const src = ctx.getImageData(0, 0, gw, gh).data;
  const bits = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) bits[i] = src[i * 4] > 127 ? 1 : 0;

  const on = (x: number, y: number): boolean => {
    if (x < 1 || y < 1 || x >= gw - 1 || y >= gh - 1) return false;
    return bits[y * gw + x] === 1;
  };

  const sx = o.w / gw;
  const sy = o.h / gh;
  const contours = traceContours(on, gw, gh).map((c) => {
    const out: number[] = new Array(c.length);
    for (let i = 0; i < c.length; i += 2) {
      out[i] = c[i] * sx;
      out[i + 1] = c[i + 1] * sy;
    }
    return out;
  });

  const field: Field = {
    hit: (x, y) => on(Math.round(x / sx), Math.round(y / sy)),
    scale: sx,
  };

  return { contours, field };
}

function traceContours(
  on: (x: number, y: number) => boolean,
  gw: number,
  gh: number,
): number[][] {
  const DX = [1, 0, -1, 0];
  const DY = [0, 1, 0, -1];
  const NX = [0, 1, 0, -1];
  const NY = [-1, 0, 1, 0];
  const SX = [0, 1, 1, 0];
  const SY = [0, 0, 1, 1];

  const used = new Set<number>();
  const key = (x: number, y: number, d: number) => (y * gw + x) * 4 + d;
  const out: number[][] = [];

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (!on(x, y)) continue;
      for (let d = 0; d < 4; d++) {
        if (on(x + NX[d], y + NY[d])) continue;
        if (used.has(key(x, y, d))) continue;

        const pts: number[] = [];
        let px = x;
        let py = y;
        let pd = d;
        let guard = gw * gh * 8;

        while (guard-- > 0) {
          const k = key(px, py, pd);
          if (used.has(k)) break;
          used.add(k);
          pts.push(px + SX[pd], py + SY[pd]);

          const lx = px + DX[pd] + NX[pd];
          const ly = py + DY[pd] + NY[pd];
          const fx = px + DX[pd];
          const fy = py + DY[pd];

          if (on(lx, ly)) {
            px = lx;
            py = ly;
            pd = (pd + 3) & 3;
          } else if (on(fx, fy)) {
            px = fx;
            py = fy;
          } else {
            pd = (pd + 1) & 3;
          }
        }

        if (pts.length >= Math.max(32, gh / 8)) out.push(pts);
      }
    }
  }

  return out;
}

export function prepare(raw: number[], step: number, rough: number, seed: number): Edge | null {
  const base = resample(smooth(raw, 2), step);
  const n = base.length / 2;
  if (n < 8) return null;

  const pts = new Array<number>(n * 2);
  const nrm = new Array<number>(n * 2);

  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area2 += base[i * 2] * base[j * 2 + 1] - base[j * 2] * base[i * 2 + 1];
  }
  const out = area2 > 0 ? 1 : -1;

  for (let i = 0; i < n; i++) {
    const p = ((i - 1) % n + n) % n;
    const q = (i + 1) % n;
    const tx = base[q * 2] - base[p * 2];
    const ty = base[q * 2 + 1] - base[p * 2 + 1];
    const tl = Math.hypot(tx, ty) || 1;
    const ux = (ty / tl) * out;
    const uy = (-tx / tl) * out;

    const a = i * 0.9 + seed;
    const chew =
      Math.sin(a * 0.21) * 0.55 +
      Math.sin(a * 0.53 + 1.7) * 0.3 +
      Math.sin(a * 1.27 + 4.1) * 0.15;

    pts[i * 2] = base[i * 2] + ux * chew * rough;
    pts[i * 2 + 1] = base[i * 2 + 1] + uy * chew * rough;
    nrm[i * 2] = ux;
    nrm[i * 2 + 1] = uy;
  }

  return { pts, nrm };
}

function resample(src: number[], step: number): number[] {
  const n = src.length / 2;
  if (n < 3) return [];
  const out: number[] = [];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const ax = src[i * 2];
    const ay = src[i * 2 + 1];
    const j = (i + 1) % n;
    const dx = src[j * 2] - ax;
    const dy = src[j * 2 + 1] - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    let t = carry;
    while (t < len) {
      const u = t / len;
      out.push(ax + dx * u, ay + dy * u);
      t += step;
    }
    carry = t - len;
  }
  return out;
}

function smooth(src: number[], passes: number): number[] {
  const n = src.length / 2;
  if (n < 5) return src.slice();
  let cur = src;
  for (let p = 0; p < passes; p++) {
    const out = new Array<number>(n * 2);
    for (let i = 0; i < n; i++) {
      let sx = 0;
      let sy = 0;
      for (let k = -2; k <= 2; k++) {
        const j = (((i + k) % n) + n) % n;
        sx += cur[j * 2];
        sy += cur[j * 2 + 1];
      }
      out[i * 2] = sx / 5;
      out[i * 2 + 1] = sy / 5;
    }
    cur = out;
  }
  return cur;
}
