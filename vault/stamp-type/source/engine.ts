import {
  BAR_PAD_BOTTOM,
  BAR_PAD_TOP,
  BAR_PAD_X,
  BAR_RADIUS,
  BAR_STROKE,
  CONDENSE_MIN,
  FIELD_SWAP,
  HEADLINE,
  LINE_RIGHT_MARGIN,
  PARK_FRAMES,
  PARK_IN,
  PARK_OUT,
  PASS_END,
  PASS_OVERLAP,
  STAMP_TTL,
  STEP,
  TICK_MS,
  TRACKS,
  WORLDS,
  type Track,
  type World,
} from "./params";

const REF = 600;

const PARK_DELTA = PARK_FRAMES - (PARK_OUT - PARK_IN);
const PASS_FRAMES = PASS_END + PARK_DELTA;

const PASS_PITCH = PASS_FRAMES - PASS_OVERLAP;

function toTrack(f: number): number {
  if (f <= PARK_IN) return f;
  if (f >= PARK_IN + PARK_FRAMES) return f - PARK_DELTA;
  return PARK_IN;
}

function posAt(track: Track, f: number): [number, number] | null {
  if (f < track[0][0] || f > track[track.length - 1][0]) return null;
  for (let i = 1; i < track.length; i++) {
    if (f <= track[i][0]) {
      const [f0, x0, y0] = track[i - 1];
      const [f1, x1, y1] = track[i];
      const t = f1 === f0 ? 0 : (f - f0) / (f1 - f0);
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
  }
  return null;
}

interface Metrics {
  dx: number;
  asc: number;
  w: number;
  h: number;
  sx: number;
}

const PARKED_X = TRACKS.map((t) => posAt(t, PARK_IN)?.[0] ?? 0);

interface Line {
  text: string;
  track: number;
}

export interface StampTypeOptions {
  worlds?: World[];
}

export class StampType {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private canvas: HTMLCanvasElement;
  private raf = 0;
  private running = false;
  private acc = 0;
  private last = 0;
  private drawnTick = -1;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private family = "sans-serif";
  private worlds: World[];
  private lines: Line[][] = [];
  private metrics = new Map<string, Metrics>();

  constructor(canvas: HTMLCanvasElement, opts: StampTypeOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    this.worlds = opts.worlds?.length ? opts.worlds : WORLDS;
    this.lines = this.worlds.map((w) =>
      w.lines.map((text, i) => ({ text, track: i })),
    );
    if (this.ok) this.resize();
  }

  setFont(family: string) {
    this.family = family;
    this.metrics.clear();
    this.drawnTick = -1;
    if (!this.running) this.draw(this.stillTick());
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.drawnTick = -1;
    if (!this.running) this.draw(this.stillTick());
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = performance.now();
    const cycle = PASS_PITCH * this.worlds.length;
    const loop = (now: number) => {
      if (!this.running) return;
      this.acc += Math.min(now - this.last, 250);
      this.last = now;
      const tick = Math.floor(this.acc / TICK_MS) % cycle;
      if (tick !== this.drawnTick) this.draw(tick);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.draw(this.stillTick());
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  private stillTick() {
    return PARK_IN + Math.floor(PARK_FRAMES / 2);
  }

  private measure(
    ctx: CanvasRenderingContext2D,
    text: string,
    size: number,
    room = Infinity,
  ): Metrics {
    const key = `${size}|${room}|${text}`;
    const got = this.metrics.get(key);
    if (got) return got;
    ctx.font = `600 ${size * REF}px ${this.family}`;
    const m = ctx.measureText(text);
    const raw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const sx = raw > room ? Math.max(CONDENSE_MIN, room / raw) : 1;
    const met: Metrics = {
      dx: m.actualBoundingBoxLeft * sx,
      asc: m.actualBoundingBoxAscent,
      w: raw * sx,
      h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      sx,
    };
    this.metrics.set(key, met);
    return met;
  }

  private room(line: Line): number {
    return REF - PARKED_X[line.track] - LINE_RIGHT_MARGIN * REF;
  }

  private lineMetrics(ctx: CanvasRenderingContext2D, line: Line): Metrics {
    return this.measure(ctx, line.text, HEADLINE, this.room(line));
  }

  private place(line: Line, f: number): [number, number] | null {
    return posAt(TRACKS[line.track], toTrack(f));
  }

  private text(
    ctx: CanvasRenderingContext2D,
    str: string,
    size: number,
    x: number,
    y: number,
    m: Metrics,
    stroke: boolean,
  ) {
    ctx.font = `600 ${size * REF}px ${this.family}`;
    if (m.sx === 1) {
      if (stroke) ctx.strokeText(str, x, y);
      ctx.fillText(str, x, y);
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(m.sx, 1);
    if (stroke) ctx.strokeText(str, 0, 0);
    ctx.fillText(str, 0, 0);
    ctx.restore();
  }

  private silhouette(
    ctx: CanvasRenderingContext2D,
    line: Line,
    x: number,
    y: number,
    color: string,
  ) {
    const m = this.lineMetrics(ctx, line);
    const padX = BAR_PAD_X * REF;
    const padT = BAR_PAD_TOP * REF;
    const padB = BAR_PAD_BOTTOM * REF;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - padX, y - padT, m.w + padX * 2, m.h + padT + padB, BAR_RADIUS * REF);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = BAR_STROKE * REF;
    ctx.lineJoin = "round";
    this.text(ctx, line.text, HEADLINE, x + m.dx, y + m.asc, m, true);
  }

  private stamps(ctx: CanvasRenderingContext2D, wi: number, f: number) {
    const world = this.worlds[wi];
    const lines = this.lines[wi];
    const step0 = Math.floor(f / STEP) * STEP;
    for (let s = step0; s > f - STAMP_TTL; s -= STEP) {
      if (s < STEP) break;
      for (const line of lines) {
        const a = this.place(line, s - STEP);
        const b = this.place(line, s);
        if (!a || !b) continue;
        if (Math.abs(a[0] - b[0]) < 1.5 && Math.abs(a[1] - b[1]) < 1.5) continue;
        this.silhouette(ctx, line, a[0], a[1], world.bar);
      }
    }
  }

  private live(ctx: CanvasRenderingContext2D, wi: number, f: number) {
    const world = this.worlds[wi];
    const placed: [Line, [number, number]][] = [];
    for (const line of this.lines[wi]) {
      const p = this.place(line, f);
      if (p) placed.push([line, p]);
    }
    for (const [line, p] of placed) this.silhouette(ctx, line, p[0], p[1], world.bar);
    ctx.fillStyle = world.ink;
    for (const [line, p] of placed) {
      const m = this.lineMetrics(ctx, line);
      this.text(ctx, line.text, HEADLINE, p[0] + m.dx, p[1] + m.asc, m, false);
    }
  }

  private draw(tick: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.drawnTick = tick;
    const { W, H } = this;
    const k = H / REF;
    const ox = (W - H) / 2;
    const n = this.worlds.length;

    const wi = Math.floor(tick / PASS_PITCH) % n;
    const f = tick - Math.floor(tick / PASS_PITCH) * PASS_PITCH;
    const prev = (wi - 1 + n) % n;
    const prevF = f + PASS_PITCH;
    const overlapping = prevF <= PASS_FRAMES;

    const fieldWorld = f < FIELD_SWAP && overlapping ? prev : wi;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.worlds[fieldWorld].bg;
    ctx.fillRect(0, 0, W, H);

    ctx.setTransform(this.dpr * k, 0, 0, this.dpr * k, this.dpr * ox, 0);

    if (overlapping) this.stamps(ctx, prev, prevF);
    this.stamps(ctx, wi, f);
    if (overlapping) this.live(ctx, prev, prevF);
    this.live(ctx, wi, f);
  }
}
