import {
  BLEED, COLS, COL_PHASE, CYCLE, DARKS, DARK_SHARE, EARLY, HUES, PALETTE, POWER, SPRING_K, STAGGER, STRETCH,
  STRIP_LENGTH, TILES, WHITE, WHITE_SHARE,
} from './params';

const SPRING_NORM = 1 - Math.exp(-SPRING_K);

function springStep(p: number): number {
  const half = (t: number) => (1 - Math.exp(-SPRING_K * t)) / SPRING_NORM;
  return p < 0.5 ? 0.5 * half(2 * p) : 1 - 0.5 * half(2 * (1 - p));
}

function pickDifferent(from: number, avoid: number[]): number {
  for (let i = 1; i <= PALETTE.length; i++) {
    const c = (from + i) % PALETTE.length;
    if (!avoid.includes(c)) return c;
  }
  return from;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildStrip(seed: number): number[] {
  const rand = mulberry32(seed);
  const strip: number[] = [];
  let lastHue = -1;
  for (let n = 0; n < STRIP_LENGTH; n++) {
    const r = rand();
    let next: number;
    if (r < WHITE_SHARE) next = WHITE;
    else if (r < WHITE_SHARE + DARK_SHARE) next = DARKS[Math.floor(rand() * DARKS.length)];
    else {
      let h = HUES[Math.floor(rand() * HUES.length)];
      if (h === lastHue) h = HUES[(HUES.indexOf(h) + 1) % HUES.length];
      lastHue = h;
      next = h;
    }
    if (n > 0 && next === strip[n - 1]) next = pickDifferent(next, [strip[n - 1]]);
    strip.push(next);
  }
  if (strip[STRIP_LENGTH - 1] === strip[0]) strip[STRIP_LENGTH - 1] = pickDifferent(strip[STRIP_LENGTH - 1], [strip[STRIP_LENGTH - 2], strip[0]]);
  return strip;
}

function tileEdge(k: number): number {
  const u = k / TILES;
  if (u < 0) return u * 0.05;
  if (u > 1) return 1 + (u - 1) * 0.05;
  const v = Math.pow(u, EARLY);
  const a = Math.pow(v, STRETCH);
  return a / (a + Math.pow(1 - v, STRETCH));
}

export class Datamosh {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private ro: ResizeObserver | null = null;
  private w = 0;
  private h = 0;
  private raf = 0;
  private running = false;
  private lastT = 0;
  private elapsed = 0;
  private edges: number[] = [];
  private strip: number[];

  constructor(private canvas: HTMLCanvasElement, seed = 1) {
    this.ctx = canvas.getContext('2d', {alpha: false});
    this.ok = !!this.ctx;
    this.strip = buildStrip(seed);
    if (!this.ok) return;
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
    ctx.imageSmoothingEnabled = false;
    this.edges = [];
    for (let i = 0; i <= COLS; i++) this.edges.push(Math.round(w * Math.pow(i / COLS, POWER)));
    if (!this.running) this.draw();
  }

  private draw() {
    const {ctx, h, edges} = this;
    if (!ctx) return;
    const bleed = Math.round(BLEED * h);
    const len = this.strip.length;
    for (let i = 0; i < COLS; i++) {
      const x0 = edges[i];
      const cw = edges[i + 1] - x0;
      if (cw <= 0) continue;
      const t = this.elapsed - (COLS - 1 - i) * STAGGER;
      const raw = t <= 0 ? 0 : t / CYCLE;
      const linear = raw + i * COL_PHASE;
      const step = Math.floor(linear);
      const flow = step + springStep(linear - step);
      const base = -Math.floor(flow);
      for (let n = TILES + 2; n >= -2; n--) {
        const id = base + n;
        const k = id + flow;
        const top = Math.round(tileEdge(k) * h);
        const bot = Math.round(tileEdge(k + 1) * h) + bleed;
        if (bot <= top || bot <= 0 || top >= h) continue;
        const y = Math.max(0, top);
        const th = Math.min(h, bot) - y;
        if (th <= 0) continue;
        const s = id - i;
        ctx.fillStyle = PALETTE[this.strip[((s % len) + len) % len]];
        ctx.fillRect(x0, y, cw, th);
      }
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = this.lastT ? Math.min(0.05, (now - this.lastT) / 1000) : 0;
    this.lastT = now;
    this.elapsed += dt;
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.lastT = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (!this.ok) return;
    this.elapsed = CYCLE * 0.45 + COLS * STAGGER;
    this.draw();
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.ctx = null;
  }
}
