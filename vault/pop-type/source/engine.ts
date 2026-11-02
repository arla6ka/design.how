import {
  FONT_WEIGHT,
  FRAME_MS,
  GROUND,
  LOOP_MS,
  MARK,
  N,
  POP_CENTRE,
  POP_DASH,
  POP_MS,
  POP_SPOKES,
  SCENE_W,
  STILL_MS,
  WORD,
  bentStrips,
  dropPose,
  frameStart,
  layoutWord,
  markAt,
  popAt,
  poseBox,
  setFor,
  shadowOffset,
  shadowPose,
  swellAmp,
  type Box,
  type GlyphMetrics,
} from "./params";

const MEASURE_PX = 200;
const OVERSAMPLE = 1.6;
const SPRITE_PAD = 4;

interface Sprite {
  canvas: HTMLCanvasElement;
  ink: { x: number; y: number; w: number; h: number };
}

export class PopType {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private metrics: GlyphMetrics[] = [];
  private rests: Box[] = [];
  private sprites = new Map<string, Sprite>();
  private lastFrame = -1;

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
    this.sprites.clear();
    this.lastFrame = -1;
    if (!this.running) this.renderStill();
  }

  private measure() {
    const S = MEASURE_PX * 3;
    const off = document.createElement("canvas");
    off.width = S;
    off.height = S;
    const g = off.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    const ox = MEASURE_PX;
    const oy = MEASURE_PX * 2;
    g.font = this.font(MEASURE_PX);
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillStyle = "#fff";
    const metrics: GlyphMetrics[] = [];
    for (const ch of WORD) {
      g.clearRect(0, 0, S, S);
      g.fillText(ch, ox, oy);
      const px = g.getImageData(0, 0, S, S).data;
      let x0 = S;
      let x1 = -1;
      let y0 = S;
      let y1 = -1;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (px[(y * S + x) * 4 + 3] < 128) continue;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      if (x1 < 0) return;
      metrics.push({
        left: (x0 - ox) / MEASURE_PX,
        right: (x1 + 1 - ox) / MEASURE_PX,
        top: (y0 - oy) / MEASURE_PX,
        bottom: (y1 + 1 - oy) / MEASURE_PX,
      });
    }
    this.metrics = metrics;
    this.rests = layoutWord(metrics).boxes;
    this.sprites.clear();
  }

  private scale(): number {
    return this.canvas.width / SCENE_W;
  }

  private sprite(i: number, colour: string): Sprite {
    const key = `${i}:${colour}`;
    const hit = this.sprites.get(key);
    if (hit) return hit;
    const m = this.metrics[i];
    const rest = this.rests[i];
    const s = this.scale() * OVERSAMPLE;
    const fontPx = ((rest.bottom - rest.top) * s) / (m.bottom - m.top);
    const w = (m.right - m.left) * fontPx;
    const h = (m.bottom - m.top) * fontPx;
    const c = document.createElement("canvas");
    c.width = Math.ceil(w + 2 * SPRITE_PAD);
    c.height = Math.ceil(h + 2 * SPRITE_PAD);
    const g = c.getContext("2d");
    if (g) {
      g.font = this.font(fontPx);
      g.textBaseline = "alphabetic";
      g.textAlign = "left";
      g.fillStyle = colour;
      g.fillText(WORD[i], SPRITE_PAD - m.left * fontPx, SPRITE_PAD - m.top * fontPx);
    }
    const sp = { canvas: c, ink: { x: SPRITE_PAD, y: SPRITE_PAD, w, h } };
    this.sprites.set(key, sp);
    return sp;
  }

  private glyph(ctx: CanvasRenderingContext2D, i: number, colour: string, box: Box, A: number) {
    const sp = this.sprite(i, colour);
    const { ink } = sp;
    const bw = box.x1 - box.x0;
    const bh = box.bottom - box.top;
    if (bw <= 0 || bh <= 0) return;
    if (Math.abs(A) < 1e-3) {
      ctx.drawImage(sp.canvas, ink.x, ink.y, ink.w, ink.h, box.x0, box.top, bw, bh);
      return;
    }
    for (const st of bentStrips(box, A)) {
      const sy0 = ink.y + ink.h * st.from;
      const sy1 = ink.y + ink.h * st.to;
      ctx.drawImage(sp.canvas, ink.x, sy0, ink.w, sy1 - sy0, st.box.x0, st.box.top, st.box.x1 - st.box.x0, st.box.bottom - st.box.top);
    }
  }

  render(t: number, run = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const f = frameStart(t);
    const k = this.scale();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.rests.length !== N) return;
    ctx.setTransform(k, 0, 0, k, 0, 0);

    const set = setFor(run);
    if (f < POP_MS) this.word(ctx, f, set.face, set.shadow);
    else this.pop(ctx, f - POP_MS, setFor(run + 1).face);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private word(ctx: CanvasRenderingContext2D, t: number, face: string, shadow: string) {
    const A = swellAmp(t);
    const off = shadowOffset(A);
    for (let i = 0; i < N; i++) {
      const rest = this.rests[i];
      const sp = shadowPose(i, t);
      if (sp.live) {
        const b = poseBox(rest, sp);
        this.glyph(ctx, i, shadow, { x0: b.x0 + off.x, x1: b.x1 + off.x, top: b.top + off.y, bottom: b.bottom + off.y }, A);
      }
      const fp = dropPose(i, t);
      if (fp.live) this.glyph(ctx, i, face, poseBox(rest, fp), A);
    }
    ctx.fillStyle = shadow;
    for (let i = 0; i < N; i++) {
      const m = markAt(i, t);
      if (!m) continue;
      const rest = this.rests[i];
      const y = rest.bottom + 2;
      ctx.globalAlpha = m.alpha;
      ctx.fillRect(rest.x0 - m.spread - m.len, y, m.len, MARK.width);
      ctx.fillRect(rest.x1 + m.spread, y, m.len, MARK.width);
    }
    ctx.globalAlpha = 1;
  }

  private pop(ctx: CanvasRenderingContext2D, tau: number, colour: string) {
    const ring = popAt(tau);
    if (!ring || ring.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = ring.alpha;
    ctx.strokeStyle = colour;
    ctx.lineWidth = POP_DASH.width;
    ctx.lineCap = "butt";
    ctx.beginPath();
    for (let i = 0; i < POP_SPOKES; i++) {
      const a = (i / POP_SPOKES) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      ctx.moveTo(POP_CENTRE.x + c * (ring.r - POP_DASH.length / 2), POP_CENTRE.y + s * (ring.r - POP_DASH.length / 2));
      ctx.lineTo(POP_CENTRE.x + c * (ring.r + POP_DASH.length / 2), POP_CENTRE.y + s * (ring.r + POP_DASH.length / 2));
    }
    ctx.stroke();
    ctx.restore();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const total = this.elapsed + (now - this.t0);
      const frame = Math.floor(total / FRAME_MS);
      if (frame !== this.lastFrame) {
        this.lastFrame = frame;
        const run = Math.floor(total / LOOP_MS);
        this.render(total - run * LOOP_MS, run);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed += performance.now() - this.t0;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.render(STILL_MS, 0);
  }

  destroy() {
    this.stop();
    this.metrics = [];
    this.rests = [];
    this.sprites.clear();
    this.ctx = null;
  }
}
