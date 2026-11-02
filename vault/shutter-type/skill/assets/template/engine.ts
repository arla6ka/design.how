// Shutter type (https://design.how/vault/shutter-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PAPER, SKY, SKY_SPANS, STRIPE_LAG_MAX, STRIPE_SEED, FONT_VAR).
import {
  ADDUP_WORDS,
  ADDUP_XHEIGHT,
  ADDUP_PITCH,
  FONT_WEIGHT,
  FRAME_MS,
  LOOP_MS,
  PAPER,
  SKY,
  SCENE_H,
  SCENE_W,
  STILL_FRAME,
  STREAMS_CAP,
  STREAMS_CENTRE,
  STREAMS_WORDS,
  STRIPE_TAPS,
  type Stripe,
  addupBaselines,
  buildStripes,
  isSky,
  phaseAt,
  sampleFrame,
  streamsInner,
  streamsOuter,
  stripeLagOfTap,
} from "./params";

interface Box {
  cx: number;
  w: number;
}

const MEASURE_PX = 200;

export class ShutterType {
  private ctx: CanvasRenderingContext2D | null;
  private taps: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];
  private inner: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;
  private stripes: Stripe[] = buildStripes();
  private raf = 0;
  private running = false;
  private elapsed = 0;
  private t0 = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private capPerPx = 0.7;
  private xPerPx = 0.5;
  private boxes = new Map<string, Box>();

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private family: string = "sans-serif",
  ) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) {
      this.measure();
      this.resize();
    }
  }

  private font(px: number): string {
    return `${FONT_WEIGHT} ${px}px ${this.family}`;
  }

  refreshFont(family?: string) {
    if (family) this.family = family;
    this.measure();
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const box = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.taps = [];
    for (let i = 0; i <= STRIPE_TAPS; i++) {
      const t = document.createElement("canvas");
      t.width = c.width;
      t.height = c.height;
      const tctx = t.getContext("2d");
      if (!tctx) continue;
      if (i < STRIPE_TAPS) this.taps.push({ canvas: t, ctx: tctx });
      else this.inner = { canvas: t, ctx: tctx };
    }
    if (!this.running) this.renderStill();
  }

  private measure() {
    const words = new Set<string>(["E", "x"]);
    for (const w of STREAMS_WORDS) words.add(w.text);
    for (const w of ADDUP_WORDS) words.add(w.text);
    const S = MEASURE_PX * 6;
    const off = document.createElement("canvas");
    off.width = S;
    off.height = MEASURE_PX * 3;
    const g = off.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    const ox = MEASURE_PX / 2;
    const oy = MEASURE_PX * 2;
    g.font = this.font(MEASURE_PX);
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillStyle = "#fff";
    for (const word of words) {
      g.clearRect(0, 0, off.width, off.height);
      g.fillText(word, ox, oy);
      const px = g.getImageData(0, 0, off.width, off.height).data;
      let x0 = off.width;
      let x1 = -1;
      let y0 = off.height;
      let y1 = -1;
      for (let y = 0; y < off.height; y++) {
        for (let x = 0; x < off.width; x++) {
          if (px[(y * off.width + x) * 4 + 3] < 128) continue;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      if (x1 < 0) continue;
      this.boxes.set(word, { cx: ((x0 + x1 + 1) / 2 - ox) / MEASURE_PX, w: (x1 - x0 + 1) / MEASURE_PX });
      if (word === "E") this.capPerPx = (y1 - y0 + 1) / MEASURE_PX;
      if (word === "x") this.xPerPx = (y1 - y0 + 1) / MEASURE_PX;
    }
  }

  private squeeze(text: string, w: number, px: number): number {
    const b = this.boxes.get(text);
    return b && b.w > 0 ? w / (b.w * px) : 1;
  }

  private word(
    ctx: CanvasRenderingContext2D,
    text: string,
    px: number,
    x: number,
    baseline: number,
    kx: number,
  ) {
    const b = this.boxes.get(text);
    if (!b) return;
    ctx.save();
    ctx.translate(x, baseline);
    ctx.scale(kx, 1);
    ctx.fillText(text, -b.cx * px, 0);
    ctx.restore();
  }

  private scene(ctx: CanvasRenderingContext2D, f: number, ink: string) {
    const k = this.canvas.width / SCENE_W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const phase = phaseAt(f);
    if (phase.name === "streams") {
      const px = STREAMS_CAP / this.capPerPx;
      ctx.font = this.font(px);
      const pose = streamsInner(f);
      STREAMS_WORDS.forEach((w, i) =>
        this.word(ctx, w.text, px, pose[i].x, pose[i].baseline, this.squeeze(w.text, w.w, px)),
      );
    } else {
      const px = ADDUP_XHEIGHT / this.xPerPx;
      ctx.font = this.font(px);
      const base = addupBaselines(f);
      ADDUP_WORDS.forEach((w, i) => {
        const kx = this.squeeze(w.text, w.w, px);
        for (let r = -2; r <= 3; r++) {
          this.word(ctx, w.text, px, w.x, base[i] + r * ADDUP_PITCH, kx);
        }
      });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  render(f: number) {
    const ctx = this.ctx;
    const inner = this.inner;
    if (!ctx || !inner || this.taps.length < STRIPE_TAPS) return;
    const phase = phaseAt(f);
    const sky = isSky(f);
    const ground = sky ? SKY : PAPER;
    const ink = sky ? PAPER : SKY;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < STRIPE_TAPS; i++) {
      this.scene(this.taps[i].ctx, sampleFrame(f, stripeLagOfTap(i)), ink);
    }

    const k = W / SCENE_W;
    inner.ctx.setTransform(1, 0, 0, 1, 0, 0);
    inner.ctx.clearRect(0, 0, W, H);
    for (const s of this.stripes) {
      const y0 = Math.round(s.y0 * k);
      const y1 = Math.min(H, Math.round(s.y1 * k));
      if (y1 <= y0) continue;
      inner.ctx.drawImage(this.taps[s.tap].canvas, 0, y0, W, y1 - y0, 0, y0, W, y1 - y0);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (phase.name === "streams") {
      const { scale, lift } = streamsOuter(f);
      const cx = STREAMS_CENTRE.x * k;
      const cy = STREAMS_CENTRE.y * k;
      ctx.translate(cx, cy - lift * k);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);
    }
    ctx.drawImage(inner.canvas, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const t = (this.elapsed + (now - this.t0)) % LOOP_MS;
      this.render(t / FRAME_MS);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) {
      this.elapsed = (this.elapsed + (performance.now() - this.t0)) % LOOP_MS;
    }
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.render(STILL_FRAME);
  }

  destroy() {
    this.stop();
    for (const t of this.taps) t.canvas.width = t.canvas.height = 0;
    if (this.inner) this.inner.canvas.width = this.inner.canvas.height = 0;
    this.taps = [];
    this.inner = null;
    this.boxes.clear();
    this.ctx = null;
  }
}

export const SCENE_ASPECT = SCENE_W / SCENE_H;
