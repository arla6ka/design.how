import type { SpineSample, TipSample } from "./scene";

export interface ScribbleSpec {
  ref: number;
  humps: number;
  amplitude: number;
  span: number;
  crestR: number;
  valleyR: number;
  drift: number;
  jitter: number;
  from: number;
  to: number;
  samples: number;
  seed: number;
}

export const SCRIBBLE_DEFAULTS: ScribbleSpec = {
  ref: 540,
  humps: 3,
  amplitude: 0.19,
  span: 0.87,
  crestR: 26,
  valleyR: 45,
  drift: 0.35,
  jitter: 0.06,
  from: 3,
  to: 32,
  samples: 84,
  seed: 1,
};

function rnd(seed: number, i: number): number {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function wander(seed: number, t: number, octaves = 2): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const x = t * freq;
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const a = rnd(seed + o * 17, i) * 2 - 1;
    const b = rnd(seed + o * 17, i + 1) * 2 - 1;
    v += (a + (b - a) * s) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return v / (norm || 1);
}

function pointAt(spec: ScribbleSpec, t: number): [number, number] {
  const { ref, humps, amplitude, span, drift, seed } = spec;
  const x0 = (ref - ref * span) / 2;
  const x = x0 + ref * span * t;

  const shares: number[] = [];
  let sum = 0;
  for (let i = 0; i < humps; i++) {
    const s = 0.72 + rnd(seed + 41, i) * 0.62;
    shares.push(s);
    sum += s;
  }

  let acc = 0;
  let idx = humps - 1;
  let local = 1;
  for (let i = 0; i < humps; i++) {
    const w0 = shares[i] / sum;
    if (t <= acc + w0 || i === humps - 1) {
      idx = i;
      local = w0 > 0 ? Math.min(1, Math.max(0, (t - acc) / w0)) : 0;
      break;
    }
    acc += w0;
  }

  const height = ref * amplitude * (0.6 + rnd(seed + 7, idx) * 0.8);
  const skew = 0.32 + rnd(seed + 19, idx) * 0.36;

  const ss = (v: number) => v * v * (3 - 2 * v);
  const y =
    local < skew
      ? -height * ss(local / Math.max(1e-4, skew))
      : -height * (1 - ss((local - skew) / Math.max(1e-4, 1 - skew)));

  const w = wander(seed, t * 2.3) * ref * amplitude * drift;
  const tilt = (t - 0.5) * ref * amplitude * 0.22;

  return [x, ref / 2 + y + height * 0.5 + w + tilt];
}

export function generateSpine(input: Partial<ScribbleSpec> = {}): SpineSample[] {
  const spec = { ...SCRIBBLE_DEFAULTS, ...input };
  const n = Math.max(8, Math.round(spec.samples));

  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push(pointAt(spec, i / n));

  const seg: number[] = [0];
  for (let i = 1; i <= n; i++) {
    seg.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const cum: number[] = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + seg[i]);
  const total = cum[n] || 1;

  const speeds = seg.map((s) => s);
  const maxS = Math.max(...speeds.slice(1)) || 1;
  const minS = Math.min(...speeds.slice(1)) || 0;
  const range = maxS - minS || 1;

  const out: SpineSample[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = pts[i];

    const s0 = speeds[Math.max(1, i)];
    const s1 = speeds[Math.min(n, Math.max(1, i + 1))];
    const sp = ((s0 + s1) / 2 - minS) / range;
    const r = spec.valleyR + (spec.crestR - spec.valleyR) * sp;

    const dx = pts[Math.min(n, i + 1)][0] - pts[Math.max(0, i - 1)][0];
    const dy = pts[Math.min(n, i + 1)][1] - pts[Math.max(0, i - 1)][1];
    const len = Math.hypot(dx, dy) || 1;
    const j = (rnd(spec.seed, i) * 2 - 1) * r * spec.jitter;
    const jx = (-dy / len) * j;
    const jy = (dx / len) * j;

    const u = cum[i] / total;
    const eased = u * 0.82 + (u * u * (3 - 2 * u)) * 0.18;
    const frame = spec.from + (spec.to - spec.from) * eased;

    const endTaper = Math.min(1, Math.min(t, 1 - t) / 0.06);
    const rr = Math.max(2, r * (0.35 + 0.65 * endTaper));

    out.push([
      Math.round((x + jx) * 10) / 10,
      Math.round((y + jy) * 10) / 10,
      Math.round(rr * 10) / 10,
      Math.round(frame * 100) / 100,
    ]);
  }
  return out;
}

export function generateTip(
  spine: readonly SpineSample[],
  opts: { rise?: number; radiusScale?: number; fps?: number } = {},
): { tip: TipSample[]; tipAt: number } {
  const rise = opts.rise ?? 6;
  const rs = opts.radiusScale ?? 0.92;
  if (spine.length === 0) return { tip: [], tipAt: 0 };

  const first = Math.floor(spine[0][3]);
  const last = Math.ceil(spine[spine.length - 1][3]);
  const tip: TipSample[] = [];

  for (let f = first; f <= last; f++) {
    let i = 0;
    while (i < spine.length - 1 && spine[i + 1][3] < f) i++;
    const a = spine[i];
    const b = spine[Math.min(spine.length - 1, i + 1)];
    const span = b[3] - a[3];
    const t = span > 0 ? Math.min(1, Math.max(0, (f - a[3]) / span)) : 0;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    const r = (a[2] + (b[2] - a[2]) * t) * rs;
    tip.push([Math.round(x * 10) / 10, Math.round((y - rise) * 10) / 10, Math.round(r * 10) / 10]);
  }

  const head: TipSample[] = [];
  const p0 = tip[0];
  for (let i = 0; i < 3; i++) head.push([p0[0], p0[1], +(p0[2] * ((i + 1) / 4)).toFixed(1)]);
  const tail: TipSample[] = [];
  const pn = tip[tip.length - 1];
  for (let i = 0; i < 4; i++) tail.push([pn[0], pn[1], +(pn[2] * (1 - (i + 1) / 4)).toFixed(1)]);

  return { tip: [...head, ...tip, ...tail], tipAt: Math.max(0, first - 3) };
}

export function generateFlood(
  frames: number,
  opts: { scale?: number; swell?: number; holdFrac?: number } = {},
): { scale: number[]; swell: number[] } {
  const n = Math.max(2, Math.round(frames));
  const maxS = opts.scale ?? 3.94;
  const maxK = opts.swell ?? 2.4;
  const hold = opts.holdFrac ?? 0.6;

  const scale: number[] = [];
  const swell: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const z = Math.pow(t, 2.6) * (1 - t) + (1 - Math.pow(1 - t, 2.2)) * t;
    scale.push(+(1 + (maxS - 1) * z).toFixed(3));

    const kt = t <= hold ? 0 : (t - hold) / (1 - hold);
    swell.push(+(1 + (maxK - 1) * Math.pow(kt, 1.7)).toFixed(3));
  }
  return { scale, swell };
}
