import {BRUSHES, DRAW_MS, INKS, PAPER_BG, SHOWN, SPIRAL_RADIUS, STAGGER_MS, TWEAKS, type Brush, type Ink, INK, inkColor} from './params';

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface PathPoint {
  x: number;
  y: number;
  t: number;
  v: number;
}

export function spiralPath(
  cx: number,
  cy: number,
  rMax: number,
  turns = 2.15,
  steps = 900,
): PathPoint[] {
  const pts: PathPoint[] = [];
  const a0 = -Math.PI * 0.55;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = rMax * Math.pow(t, 0.72);
    const a = a0 + t * turns * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, t, v: Math.pow(t, 0.6) });
  }
  return pts;
}

export function trailPath(raw: { x: number; y: number }[]): PathPoint[] {
  if (raw.length < 2) return [];
  const out: PathPoint[] = [];
  let total = 0;
  const seg: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    total += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    seg.push(total);
  }
  if (total <= 0) return [];
  for (let i = 0; i < raw.length; i++) {
    const prev = raw[Math.max(0, i - 1)];
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const d = Math.hypot(next.x - prev.x, next.y - prev.y);
    out.push({
      x: raw[i].x,
      y: raw[i].y,
      t: seg[i] / total,
      v: Math.min(1, d / 24),
    });
  }
  return out;
}

export interface StrokeOptions {
  progress?: number;
  sizePx?: number;
  hue?: number;
  dpr?: number;
  ink?: Ink;
  alpha?: number;
  from?: number;
}

export function stroke(
  ctx: CanvasRenderingContext2D,
  path: PathPoint[],
  brush: Brush,
  shortSide: number,
  opts: StrokeOptions = {},
) {
  if (path.length < 2) return;
  const dpr = opts.dpr ?? 1;
  const progress = opts.progress ?? 1;
  if (progress <= 0) return;
  const ink = opts.ink ?? INK;
  const alphaMul = opts.alpha ?? 1;
  if (alphaMul <= 0) return;
  const from = opts.from ?? 0;

  const base = Math.max(1, Math.round((opts.sizePx ?? brush.size * shortSide) * dpr));
  const step = Math.max(1, base * Math.max(0.02, brush.spacing));

  let carry = 0;
  let idx = 0;
  const limit = progress;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (a.t > limit) break;

    const dx = (b.x - a.x) * dpr;
    const dy = (b.y - a.y) * dpr;
    const segLen = Math.hypot(dx, dy);
    if (segLen <= 0) continue;
    const ux = dx / segLen;
    const uy = dy / segLen;
    const ang = Math.atan2(uy, ux);

    let travelled = carry;
    while (travelled < segLen) {
      const f = travelled / segLen;
      const t = a.t + (b.t - a.t) * f;
      if (t > limit) break;
      if (t < from) {
        idx++;
        travelled += step;
        continue;
      }

      const v = a.v + (b.v - a.v) * f;
      let px = (a.x * dpr + dx * f);
      let py = (a.y * dpr + dy * f);

      const h1 = hash(idx * 2.17);
      const h2 = hash(idx * 3.71 + 11.3);
      const h3 = hash(idx * 5.13 + 27.9);

      if (brush.jitter > 0) {
        const j = (h1 - 0.5) * 2 * brush.jitter * base;
        px += -uy * j;
        py += ux * j;
      }
      if (brush.scatter > 0) {
        const sa = h2 * Math.PI * 2;
        const sr = h3 * brush.scatter * base;
        px += Math.cos(sa) * sr;
        py += Math.sin(sa) * sr;
      }

      const scale = brush.speedSize > 0 ? 1 - brush.speedSize * v * 0.55 : 1;
      const cell = Math.max(1, Math.round(base * scale * 0.5));

      const rot = brush.follow > 0 ? ang * brush.follow : 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const hue = brush.hueDrift * t + (opts.hue ?? 0);

      for (const c of brush.cells) {
        const ox = c.x * base * 0.5;
        const oy = c.y * base * 0.5;
        const rx = ox * cos - oy * sin;
        const ry = ox * sin + oy * cos;
        const w = Math.max(1, Math.round(cell * c.s));
        const x = Math.floor(px + rx - w / 2);
        const y = Math.floor(py + ry - w / 2);
        ctx.fillStyle = inkColor(ink, hue, c.a * alphaMul);
        ctx.fillRect(x, y, w, w);
      }

      idx++;
      travelled += step;
    }
    carry = travelled - segLen;
  }
}

const PICKED: Brush[] = SHOWN.map(id => {
  const b = BRUSHES.find(x => x.id === id) ?? BRUSHES[0];
  return TWEAKS[id] ? {...b, ...TWEAKS[id]} : b;
});
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class BrushSheet {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private ro: ResizeObserver | null = null;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private elapsed = 0;
  private last = 0;
  private done = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.ok = !!this.ctx;
    if (!this.ok) return;
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(r.width * this.dpr);
    const bh = Math.round(r.height * this.dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    if (!this.running) this.draw(this.done ? Infinity : this.elapsed);
  }

  private draw(elapsed: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER_BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const cw = w / PICKED.length;
    const short = Math.min(cw, h);
    PICKED.forEach((brush, i) => {
      const p = easeOut(Math.min(1, Math.max(0, (elapsed - i * STAGGER_MS) / DRAW_MS)));
      if (p <= 0) return;
      stroke(ctx, spiralPath(cw * (i + 0.5), h / 2, short * SPIRAL_RADIUS), brush, short, {progress: p, dpr: this.dpr, ink: INKS[i % INKS.length]});
    });
  }

  private get length() {
    return (PICKED.length - 1) * STAGGER_MS + DRAW_MS;
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.elapsed += this.last ? now - this.last : 0;
    this.last = now;
    this.draw(this.elapsed);
    if (this.elapsed > this.length) { this.done = true; this.running = false; return; }
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running || this.done || !this.ok) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.done = true;
    this.draw(Infinity);
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.ctx = null;
  }
}
