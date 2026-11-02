import {
  ROWS,
  REF_COLS,
  RECT_ROW_START,
  RECT_ROW_END,
  RECT_COLS,
  PERIOD,
  PULSE_DUR,
  ROW_START_FRAME,
  EASE_LUT,
  PALETTES,
  PALETTE_SECONDS,
  DWELL_SCALE,
  PULSE_RATE,
  FADE_SECONDS,
  PULSE_WINDOWS,
  type Palette,
} from "./params";

const LUT_N = EASE_LUT.length;
const TANGENTS: number[] = (() => {
  const h = 1 / (LUT_N - 1);
  const d: number[] = [];
  for (let i = 0; i < LUT_N - 1; i++) d.push((EASE_LUT[i + 1] - EASE_LUT[i]) / h);
  const m: number[] = [d[0]];
  for (let i = 1; i < LUT_N - 1; i++) m.push((d[i - 1] + d[i]) / 2);
  m.push(d[LUT_N - 2]);
  for (let i = 0; i < LUT_N - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }
  return m;
})();

function ease(k: number): number {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const x = k * (LUT_N - 1);
  const i = Math.min(LUT_N - 2, Math.floor(x));
  const t = x - i;
  const h = 1 / (LUT_N - 1);
  const y0 = EASE_LUT[i];
  const y1 = EASE_LUT[i + 1];
  const m0 = TANGENTS[i] * h;
  const m1 = TANGENTS[i + 1] * h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * m1
  );
}

interface Seg {
  c0: number;
  c1: number;
  m0: number;
  rate: number;
}

const { SEGMENTS, WARPED_PERIOD } = (() => {
  const segs: Seg[] = [];
  let c = 0;
  let m = 0;
  const push = (mEnd: number, rate: number) => {
    const span = (mEnd - m) / rate;
    segs.push({ c0: c, c1: c + span, m0: m, rate });
    c += span;
    m = mEnd;
  };
  for (const [p0, p1] of PULSE_WINDOWS) {
    push(p0, 1 / DWELL_SCALE);
    push(p1, PULSE_RATE);
  }
  push(PERIOD, 1 / DWELL_SCALE);
  return { SEGMENTS: segs, WARPED_PERIOD: c };
})();

function toMeasured(ct: number): number {
  for (let i = 0; i < SEGMENTS.length; i++) {
    const s = SEGMENTS[i];
    if (ct < s.c1 || i === SEGMENTS.length - 1) return s.m0 + (ct - s.c0) * s.rate;
  }
  return ct;
}

const RGB_CACHE = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let v = RGB_CACHE.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    RGB_CACHE.set(hex, v);
  }
  return v;
}

const MIX_CACHE = new Map<string, string>();
function mix(a: string, b: string, q: number): string {
  if (q <= 0) return a;
  if (q >= 1) return b;
  const key = a + b + q;
  let out = MIX_CACHE.get(key);
  if (!out) {
    const [r1, g1, b1] = rgb(a);
    const [r2, g2, b2] = rgb(b);
    const r = Math.round(r1 + (r2 - r1) * q);
    const g = Math.round(g1 + (g2 - g1) * q);
    const bl = Math.round(b1 + (b2 - b1) * q);
    out = `rgb(${r},${g},${bl})`;
    MIX_CACHE.set(key, out);
  }
  return out;
}

export class CheckerConveyor {
  ok = false;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;

  private elapsed = 0;
  private base = 0;

  private W = 0;
  private H = 0;
  private cell = 1;
  private cols = 1;
  private rectStart = 0;

  private paletteIdx = 0;
  private palette: Palette = PALETTES[0];
  private fadeFrom: Palette | null = null;
  private fadeQ = 1;
  private heldFor = 0;
  private lastT = 0;
  private lastWall = 0;
  private cycle = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) return;
    this.ok = true;
    this.measure();
    this.drawAt(0);
  }

  private measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    this.canvas.width = w;
    this.canvas.height = h;
    this.W = w;
    this.H = h;
    this.cell = h / ROWS;
    this.cols = Math.max(REF_COLS, Math.ceil(w / this.cell));
    this.rectStart = Math.round((w / this.cell - RECT_COLS) / 2);
  }

  resize() {
    if (!this.ok) return;
    this.measure();
    this.drawAt(toMeasured(this.now()));
  }

  private colorAt(pal: Palette, scene: number, r: number, c: number): string {
    const even = (r + c) % 2 === 0;
    const inRect =
      r >= RECT_ROW_START &&
      r <= RECT_ROW_END &&
      c >= this.rectStart &&
      c < this.rectStart + RECT_COLS;
    const sc = pal.scenes[scene];
    const pair = inRect ? sc.rect : sc.ground;
    const to = even ? pair[0] : pair[1];
    if (!this.fadeFrom) return to;
    const fsc = this.fadeFrom.scenes[scene];
    const fpair = inRect ? fsc.rect : fsc.ground;
    return mix(even ? fpair[0] : fpair[1], to, this.fadeQ);
  }

  private rowState(r: number, t: number, pal: Palette): { scene: number; k: number } {
    const row = pal.reverseCascade ? ROWS - 1 - r : r;
    let scene = 0;
    for (let p = 0; p < PULSE_DUR.length; p++) {
      const t0 = (ROW_START_FRAME[p][row] - 1) / 30;
      if (t >= t0 + PULSE_DUR[p]) {
        scene = p + 1;
      } else if (t >= t0) {
        return { scene: p, k: (t - t0) / PULSE_DUR[p] };
      }
    }
    return { scene: scene % 3, k: 0 };
  }

  private drawAt(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { cell, cols, W, H } = this;
    const out = this.palette;
    for (let r = 0; r < ROWS; r++) {
      const y0 = Math.round(r * cell);
      const y1 = r === ROWS - 1 ? H : Math.round((r + 1) * cell);

      const { scene, k } = this.rowState(r, t, out);
      const next = (scene + 1) % 3;

      const rightward =
        out.direction === "right" || (out.direction === "split" && r % 2 === 1);

      const off = ease(k) * cols * cell;
      const shift = rightward ? -off : off;
      let j = Math.floor(shift / cell);
      for (; j * cell - shift < W; j++) {
        const x0 = Math.max(0, Math.round(j * cell - shift));
        const x1 = Math.min(W, Math.round((j + 1) * cell - shift));
        if (x1 <= x0) continue;
        const inFirst = rightward ? j >= 0 : j < cols;
        const col = ((j % cols) + cols) % cols;
        ctx.fillStyle = inFirst
          ? this.colorAt(out, scene, r, col)
          : this.colorAt(out, next, r, col);
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
  }

  private now(): number {
    return this.running
      ? (((performance.now() / 1000 - this.base) % WARPED_PERIOD) + WARPED_PERIOD) %
          WARPED_PERIOD
      : this.elapsed;
  }

  private advancePalette(ct: number, t: number) {
    if (!this.cycle || PALETTES.length < 2) return;
    let dt = ct - this.lastT;
    if (dt < 0) dt += WARPED_PERIOD;
    if (dt > 0.25) dt = 0;
    this.lastT = ct;

    this.heldFor += dt;
    if (this.heldFor < PALETTE_SECONDS) return;
    for (let r = 0; r < ROWS; r++) {
      if (this.rowState(r, t, this.palette).k > 0) return;
    }
    this.fadeFrom = this.palette;
    this.fadeQ = 0;
    this.paletteIdx = (this.paletteIdx + 1) % PALETTES.length;
    this.palette = PALETTES[this.paletteIdx];
    this.heldFor = 0;
  }

  private advanceFade(dt: number) {
    if (!this.fadeFrom) return;
    const step = dt / FADE_SECONDS;
    const raw = Math.min(1, this.fadeQ + step);
    this.fadeQ = Math.round(raw * 24) / 24;
    if (raw >= 1) {
      this.fadeFrom = null;
      this.fadeQ = 1;
    }
  }

  private tick = () => {
    if (!this.running) return;
    const wall = performance.now() / 1000;
    const dt = this.lastWall ? Math.min(0.1, wall - this.lastWall) : 0;
    this.lastWall = wall;

    const ct = this.now();
    const t = toMeasured(ct);
    this.advancePalette(ct, t);
    this.advanceFade(dt);
    this.drawAt(t);
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.base = performance.now() / 1000 - this.elapsed;
    this.lastT = this.now();
    this.lastWall = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.running) return;
    this.elapsed = this.now();
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill(paletteId?: string) {
    if (!this.ok) return;
    this.cycle = false;
    if (paletteId) this.setPalette(paletteId);
    this.elapsed = (ROW_START_FRAME[1][0] - 1) / 30 - 0.5;
    this.drawAt(this.elapsed);
  }

  setPalette(id: string) {
    const i = PALETTES.findIndex((p) => p.id === id);
    if (i < 0) return;
    this.paletteIdx = i;
    this.palette = PALETTES[i];
    this.fadeFrom = null;
    this.fadeQ = 1;
    this.heldFor = 0;
    if (!this.running) this.drawAt(toMeasured(this.elapsed));
  }

  setCycling(on: boolean) {
    this.cycle = on;
    this.heldFor = 0;
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.ok = false;
  }
}
