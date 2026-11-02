// Misprint type (https://design.how/vault/misprint-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (GROUND, FILL, OUTLINE, FOIL_STOPS, LINES, PULL_MIN, PULL_MAX, PARALLAX_OUTLINE, FONT_VAR).
import {
  ART,
  ART_H,
  CAP,
  FILL,
  FILL_WEIGHT,
  FOIL_LINE_ALPHA,
  FOIL_LINE_ANGLE,
  FOIL_LINE_PITCH,
  FOIL_LINE_SLIDE,
  FOIL_STOPS,
  GRAIN_ALPHA,
  GRAIN_SEED,
  GRAIN_TILE,
  GROUND,
  LINES,
  OUTLINE,
  OUTLINE_WEIGHT,
  PARALLAX_FOIL,
  REGISTER_IN,
  REGISTER_OUT,
  RING,
  RING_STAMPS,
  SCENE_W,
  SHADOW_ALPHA,
  SHADOW_BLUR,
  STREAK_CELL,
  TILT_FOLLOW,
  type Line,
  driftAt,
  foilPhase,
  foilSpanAt,
  outlineSpanAt,
  pinholesFor,
  planeOffsets,
  reprintAt,
  sheetAt,
  sheetOffset,
  streaksFor,
  tiltFromPointer,
} from "./params";

interface Run {
  cx: number;
  w: number;
}

const MEASURE_PX = 160;

type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

export class MisprintType {
  private ctx: CanvasRenderingContext2D | null;
  private ground: Layer | null = null;
  private fill: Layer | null = null;
  private bold: Layer | null = null;
  private rings: Layer[] = [];
  private foilMasks: Layer[] = [];
  private foil: Layer | null = null;
  private grain: CanvasPattern | null = null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private capFill = 0.7;
  private capOutline = 0.7;
  private runsFill = new Map<string, Run>();
  private runsOutline = new Map<string, Run>();
  private tilt = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private pointed = false;
  private held = false;
  private register = 0;
  private reprint = { x: 0, y: 0 };
  private sheet = -1;
  private now = 0;
  private dirty = true;

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

  private font(weight: number, px: number): string {
    return `${weight} ${px}px ${this.family}`;
  }

  refreshFont(family?: string) {
    if (family) this.family = family;
    this.measure();
    this.dirty = true;
    if (!this.running) this.renderStill();
  }

  point(u: number | null, v = 0) {
    if (u === null) {
      this.pointed = false;
      return;
    }
    this.pointed = true;
    this.target = tiltFromPointer(u, v);
  }

  hold(down: boolean) {
    this.held = down;
  }

  private get k(): number {
    return (this.canvas.width / SCENE_W) * ART.scale;
  }

  private get ks(): number {
    return this.canvas.width / SCENE_W;
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
    const make = (): Layer | null => {
      const l = document.createElement("canvas");
      l.width = c.width;
      l.height = c.height;
      const lctx = l.getContext("2d");
      return lctx ? { canvas: l, ctx: lctx } : null;
    };
    this.ground = make();
    this.fill = make();
    this.bold = make();
    this.foil = make();
    this.rings = LINES.map(() => make()).filter((l): l is Layer => !!l);
    this.foilMasks = LINES.map(() => make()).filter((l): l is Layer => !!l);
    this.grain = this.makeGrain();
    this.sheet = -1;
    this.dirty = true;
    if (!this.running) this.renderStill();
  }

  private measure() {
    const off = document.createElement("canvas");
    off.width = MEASURE_PX * 8;
    off.height = MEASURE_PX * 3;
    const g = off.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    const ox = MEASURE_PX / 2;
    const oy = MEASURE_PX * 2;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillStyle = "#fff";
    const box = (text: string, weight: number) => {
      g.clearRect(0, 0, off.width, off.height);
      g.font = this.font(weight, MEASURE_PX);
      g.fillText(text, ox, oy);
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
      return { cx: ((x0 + x1 + 1) / 2 - ox) / MEASURE_PX, w: (x1 - x0 + 1) / MEASURE_PX, h: (y1 - y0 + 1) / MEASURE_PX };
    };
    this.capFill = box("E", FILL_WEIGHT).h;
    this.capOutline = box("E", OUTLINE_WEIGHT).h;
    for (const L of LINES) {
      const r = box(L.text, FILL_WEIGHT);
      this.runsFill.set(L.text, { cx: r.cx, w: r.w });
      const b = box(L.text, OUTLINE_WEIGHT);
      this.runsOutline.set(L.text, { cx: b.cx, w: b.w });
    }
  }

  private makeGrain(): CanvasPattern | null {
    const ctx = this.ground?.ctx;
    if (!ctx) return null;
    const size = Math.round(GRAIN_TILE * this.dpr);
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const tc = tile.getContext("2d");
    if (!tc) return null;
    const img = tc.createImageData(size, size);
    let s = GRAIN_SEED >>> 0;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
    for (let i = 0; i < size * size; i++) {
      const dark = rnd() < 0.5;
      img.data[i * 4] = dark ? 0 : 255;
      img.data[i * 4 + 1] = dark ? 0 : 255;
      img.data[i * 4 + 2] = dark ? 0 : 255;
      img.data[i * 4 + 3] = Math.round(rnd() * 255 * GRAIN_ALPHA * 2);
    }
    tc.putImageData(img, 0, 0);
    return ctx.createPattern(tile, "repeat");
  }

  private paintGround(n: number) {
    const L = this.ground;
    if (!L) return;
    const { ctx, canvas } = L;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!this.grain) return;
    const off = sheetOffset(n);
    ctx.save();
    ctx.translate(off.x * this.k, off.y * this.k);
    ctx.fillStyle = this.grain;
    ctx.fillRect(-off.x * this.k, -off.y * this.k, canvas.width, canvas.height);
    ctx.restore();
  }

  private paintWord(
    L: Layer,
    weight: number,
    runs: Map<string, Run>,
    capPerPx: number,
    spanOf: (l: Line) => { cx: number; w: number },
    colour: string,
    only?: Line,
  ) {
    const { ctx, canvas } = L;
    const k = this.k;
    const ox = this.ks * ART.x;
    const oy = this.ks * ART.y;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const px = CAP / capPerPx;
    ctx.font = this.font(weight, px);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = colour;
    for (const line of LINES) {
      if (only && line !== only) continue;
      const run = runs.get(line.text);
      if (!run) continue;
      const span = spanOf(line);
      const squeeze = span.w / (run.w * px);
      ctx.setTransform(k, 0, 0, k, ox, oy);
      ctx.translate(span.cx, line.baseline);
      ctx.scale(squeeze, 1);
      ctx.fillText(line.text, -run.cx * px, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private inkFill(n: number) {
    const L = this.fill;
    if (!L) return;
    const { ctx } = L;
    const k = this.k;
    ctx.setTransform(k, 0, 0, k, this.ks * ART.x, this.ks * ART.y);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    const streaks = streaksFor(n);
    for (let i = 0; i < streaks.length; i++) {
      ctx.globalAlpha = streaks[i];
      ctx.fillRect((i - 1) * STREAK_CELL, 0, STREAK_CELL, ART_H);
    }
    ctx.globalAlpha = 1;
    for (const p of pinholesFor(n)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private paintRing(R: Layer, line: Line) {
    const B = this.bold;
    if (!B) return;
    this.paintWord(
      B,
      OUTLINE_WEIGHT,
      this.runsOutline,
      this.capOutline,
      (l) => ({ cx: l.outlineCx, w: l.outlineW }),
      OUTLINE,
      line,
    );
    const { ctx, canvas } = R;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r = RING * this.k;
    for (let i = 0; i < RING_STAMPS; i++) {
      const a = (i / RING_STAMPS) * Math.PI * 2;
      ctx.drawImage(B.canvas, Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(B.canvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  private paintFill() {
    if (!this.fill) return;
    this.paintWord(
      this.fill,
      FILL_WEIGHT,
      this.runsFill,
      this.capFill,
      (l) => ({ cx: l.fillCx, w: l.fillW }),
      FILL,
    );
  }

  private paintWords() {
    LINES.forEach((line, i) => {
      const R = this.rings[i];
      if (R) this.paintRing(R, line);
      const M = this.foilMasks[i];
      if (M) {
        this.paintWord(
          M,
          OUTLINE_WEIGHT,
          this.runsOutline,
          this.capOutline,
          (l) => foilSpanAt(l, 0),
          "#fff",
          line,
        );
      }
    });
    this.dirty = false;
    this.sheet = -1;
  }

  private paintSheet(n: number) {
    this.paintGround(n);
    this.paintFill();
    this.inkFill(n);
    this.sheet = n;
  }

  private placeLine(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    line: Line,
    own: { cx: number; w: number },
    now: { cx: number; w: number },
    offX: number,
    offY: number,
  ) {
    const k = this.k;
    const pivot = this.ks * ART.x + own.cx * k;
    const sx = now.w / own.w;
    ctx.save();
    ctx.translate(pivot + (now.cx - own.cx) * k + offX * k, offY * k);
    ctx.scale(sx, 1);
    ctx.translate(-pivot, 0);
    ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
  }

  private paintFoil(r: number, offX: number, offY: number) {
    const F = this.foil;
    if (!F) return;
    const { ctx, canvas } = F;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    LINES.forEach((line, i) => {
      const M = this.foilMasks[i];
      if (!M) return;
      this.placeLine(ctx, M, line, foilSpanAt(line, 0), foilSpanAt(line, r), offX, offY);
    });
    const phase = foilPhase(this.tilt, this.now);
    const ang = Math.atan2(this.tilt.y, this.tilt.x + 1e-6) + Math.PI / 4;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const len = Math.hypot(canvas.width, canvas.height) / 2;
    const g = ctx.createLinearGradient(
      cx - Math.cos(ang) * len,
      cy - Math.sin(ang) * len,
      cx + Math.cos(ang) * len,
      cy + Math.sin(ang) * len,
    );
    const n = FOIL_STOPS.length;
    for (let i = 0; i <= n * 2; i++) {
      const stop = i / (n * 2);
      const idx = (((i - Math.round(phase * n)) % n) + n) % n;
      g.addColorStop(stop, FOIL_STOPS[idx]);
    }
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = FOIL_LINE_ALPHA;
    ctx.fillStyle = "#000";
    const pitch = FOIL_LINE_PITCH * this.k;
    const slide = ((this.tilt.x * FOIL_LINE_SLIDE * this.k) % pitch + pitch) % pitch;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((FOIL_LINE_ANGLE * Math.PI) / 180);
    const span = len * 1.5;
    for (let x = -span + slide; x < span; x += pitch) {
      ctx.fillRect(x, -span, pitch / 2, span * 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private paintRings(ctx: CanvasRenderingContext2D) {
    const k = this.k;
    const r = this.register;
    const off = planeOffsets(this.tilt);
    const rx = this.reprint.x * (1 - r);
    const ry = this.reprint.y * (1 - r);
    LINES.forEach((line, i) => {
      const R = this.rings[i];
      if (!R) return;
      ctx.save();
      ctx.shadowColor = `rgba(0,0,0,${SHADOW_ALPHA * (1 - 0.6 * r)})`;
      ctx.shadowBlur = SHADOW_BLUR * k;
      ctx.shadowOffsetX = (off.shadow.x - off.outline.x) * k;
      ctx.shadowOffsetY = (off.shadow.y - off.outline.y) * k * (1 - 0.6 * r);
      this.placeLine(
        ctx,
        R,
        line,
        { cx: line.outlineCx, w: line.outlineW },
        outlineSpanAt(line, r),
        off.outline.x + rx,
        off.outline.y + ry,
      );
      ctx.restore();
    });
  }

  render(sheet = 0) {
    const ctx = this.ctx;
    if (!ctx || !this.ground || !this.fill || this.rings.length < LINES.length) return;
    if (this.dirty) this.paintWords();
    if (this.sheet !== sheet) this.paintSheet(sheet);
    const k = this.k;
    const r = this.register;
    const off = planeOffsets(this.tilt);
    const rx = this.reprint.x * (1 - r);
    const ry = this.reprint.y * (1 - r);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowColor = "transparent";
    ctx.drawImage(this.ground.canvas, 0, 0);

    this.paintFoil(r, this.tilt.x * PARALLAX_FOIL + rx * 0.5, this.tilt.y * PARALLAX_FOIL + ry * 0.5);
    if (this.foil) ctx.drawImage(this.foil.canvas, 0, 0);

    ctx.drawImage(this.fill.canvas, off.fill.x * k, off.fill.y * k);
    this.paintRings(ctx);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const t = (this.elapsed + (now - this.t0)) / 1000;
      this.now = t;
      if (!this.pointed) this.target = driftAt(t);
      this.tilt.x += (this.target.x - this.tilt.x) * TILT_FOLLOW;
      this.tilt.y += (this.target.y - this.tilt.y) * TILT_FOLLOW;
      const goal = this.held ? 1 : 0;
      this.register += (goal - this.register) * (this.held ? REGISTER_IN : REGISTER_OUT);
      this.reprint = reprintAt(t);
      this.render(sheetAt(t).n);
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
    this.tilt = { x: 0, y: 0 };
    this.reprint = { x: 0, y: 0 };
    this.register = 0;
    this.render(0);
  }

  destroy() {
    this.stop();
    for (const l of [this.ground, this.fill, this.bold, this.foil, ...this.rings, ...this.foilMasks]) if (l) l.canvas.width = l.canvas.height = 0;
    this.ground = this.fill = this.bold = this.foil = null;
    this.rings = [];
    this.foilMasks = [];
    this.grain = null;
    this.ctx = null;
  }
}
