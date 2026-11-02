// Verb type (https://design.how/vault/verb-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PHASES, MOTTLE_DEPTH, SPLIT_PX, SPLIT_HUE, SMEAR_ALPHA, FONT_VAR).
import {
  BREAK_CAP,
  BREAK_LETTERS,
  CONDENSE_CAP,
  CONDENSE_CX,
  CONDENSE_LETTERS,
  CONDENSE_W118,
  CONDENSE_Y,
  FONT_WEIGHT,
  FRAME_MS,
  LOOP_MS,
  MOTTLE_CELLS,
  MOTTLE_DEPTH,
  MOTTLE_TILE,
  MOVE_CAP,
  MOVE_LETTERS,
  ROTATE_CAP,
  ROTATE_LETTERS,
  ROTATE_PIVOT,
  SCENE_W,
  SKEW_CAP,
  SKEW_LETTERS,
  SKEW_Y,
  SMEAR_ALPHA,
  SMEAR_SHUTTER,
  SMEAR_TAPS,
  SPLIT_ALPHA,
  SPLIT_FRAMES,
  SPLIT_HUE,
  SPLIT_PX,
  STILL_FRAME,
  type Phase,
  breakPose,
  condenseWidth,
  movePose,
  phaseAt,
  rotatePose,
  shiftHue,
  skewPose,
  smearWeight,
} from "./params";

const DEG = Math.PI / 180;

interface Glyph {
  bx: number;
  by: number;
  cx: number;
  cy: number;
  w: number;
}

const MEASURE_PX = 200;

export class VerbType {
  private ctx: CanvasRenderingContext2D | null;
  private layer: HTMLCanvasElement | null = null;
  private lctx: CanvasRenderingContext2D | null = null;
  private mottle: CanvasPattern | null = null;
  private raf = 0;
  private running = false;
  private elapsed = 0;
  private t0 = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private capPerPx = 0.7;
  private glyphs = new Map<string, Glyph>();
  private condenseK = 0.44;
  private lastPhase: Phase | null = null;

  onCut: ((phase: Phase) => void) | null = null;

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
    this.layer = document.createElement("canvas");
    this.layer.width = c.width;
    this.layer.height = c.height;
    this.lctx = this.layer.getContext("2d");
    this.mottle = this.makeMottle();
    if (!this.running) this.renderStill();
  }

  private makeMottle(): CanvasPattern | null {
    const ctx = this.lctx;
    if (!ctx) return null;
    const cells = MOTTLE_CELLS;
    const small = document.createElement("canvas");
    small.width = cells;
    small.height = cells;
    const sc = small.getContext("2d");
    if (!sc) return null;
    const img = sc.createImageData(cells, cells);
    let seed = 0x9e3779b9;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    for (let i = 0; i < cells * cells; i++) {
      const v = (rnd() + rnd()) / 2;
      img.data[i * 4 + 3] = Math.round(v * 255 * MOTTLE_DEPTH);
    }
    sc.putImageData(img, 0, 0);
    const tile = document.createElement("canvas");
    const size = Math.round(MOTTLE_TILE * this.dpr);
    tile.width = size;
    tile.height = size;
    const tc = tile.getContext("2d");
    if (!tc) return null;
    tc.imageSmoothingEnabled = true;
    tc.imageSmoothingQuality = "high";
    const cell = size / cells;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        tc.drawImage(small, dx * size - cell / 2, dy * size - cell / 2, size + cell, size + cell);
      }
    }
    return ctx.createPattern(tile, "repeat");
  }

  private measure() {
    const chars = new Set<string>();
    for (const L of MOVE_LETTERS) chars.add(L.ch);
    for (const L of SKEW_LETTERS) chars.add(L.ch);
    for (const L of ROTATE_LETTERS) chars.add(L.ch);
    for (const L of BREAK_LETTERS) chars.add(L.ch);
    for (const L of CONDENSE_LETTERS) chars.add(L.ch);

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

    for (const ch of chars) {
      g.clearRect(0, 0, S, S);
      g.fillText(ch, ox, oy);
      const px = g.getImageData(0, 0, S, S).data;
      let x0 = S;
      let x1 = -1;
      let y0 = S;
      let y1 = -1;
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const a = px[(y * S + x) * 4 + 3];
          if (a < 128) continue;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          sx += x;
          sy += y;
          n++;
        }
      }
      if (n === 0) continue;
      this.glyphs.set(ch, {
        bx: ((x0 + x1 + 1) / 2 - ox) / MEASURE_PX,
        by: ((y0 + y1 + 1) / 2 - oy) / MEASURE_PX,
        cx: (sx / n + 0.5 - ox) / MEASURE_PX,
        cy: (sy / n + 0.5 - oy) / MEASURE_PX,
        w: (x1 - x0 + 1) / MEASURE_PX,
      });
      if (ch === "E") this.capPerPx = (y1 - y0 + 1) / MEASURE_PX;
    }

    const fontPx = CONDENSE_CAP / this.capPerPx;
    let sum = 0;
    let count = 0;
    for (const L of CONDENSE_LETTERS) {
      const gl = this.glyphs.get(L.ch);
      if (!gl) continue;
      sum += L.w / (gl.w * fontPx);
      count++;
    }
    if (count) this.condenseK = sum / count;
  }

  render(f: number) {
    const ctx = this.ctx;
    const lctx = this.lctx;
    const layer = this.layer;
    if (!ctx || !lctx || !layer) return;
    const phase = phaseAt(f);
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = phase.ground;
    ctx.fillRect(0, 0, W, H);

    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = "source-over";
    lctx.globalAlpha = 1;
    lctx.clearRect(0, 0, W, H);

    const age = f - phase.from;
    if (age < SPLIT_FRAMES) {
      const a = SPLIT_ALPHA * (1 - age / SPLIT_FRAMES);
      this.word(lctx, f, phase, shiftHue(phase.ink, -SPLIT_HUE), a, -SPLIT_PX);
      this.word(lctx, f, phase, shiftHue(phase.ink, SPLIT_HUE), a, SPLIT_PX);
    }
    this.word(lctx, f, phase, phase.ink, 1, 0);

    if (this.mottle) {
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalAlpha = 1;
      lctx.globalCompositeOperation = "destination-out";
      lctx.fillStyle = this.mottle;
      lctx.fillRect(0, 0, W, H);
      lctx.globalCompositeOperation = "source-over";
    }

    ctx.drawImage(layer, 0, 0);
  }

  private word(
    ctx: CanvasRenderingContext2D,
    f: number,
    phase: Phase,
    ink: string,
    alpha: number,
    dx: number,
  ) {
    const k = this.canvas.width / SCENE_W;
    ctx.setTransform(k, 0, 0, k, dx * k, 0);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    switch (phase.name) {
      case "move": {
        const px = MOVE_CAP / this.capPerPx;
        ctx.font = this.font(px);
        const pose = movePose(f);
        const back = movePose(f - 0.5);
        MOVE_LETTERS.forEach((L, i) => {
          const speed = Math.hypot(pose[i].x - back[i].x, pose[i].y - back[i].y) * 2;
          const wgt = smearWeight(speed);
          if (wgt > 0) {
            for (let t = SMEAR_TAPS; t >= 1; t--) {
              const p = movePose(f - (SMEAR_SHUTTER * t) / SMEAR_TAPS)[i];
              ctx.globalAlpha = alpha * SMEAR_ALPHA * wgt * (1 - t / (SMEAR_TAPS + 1));
              this.boxAt(ctx, L.ch, px, p.x, p.y);
            }
            ctx.globalAlpha = alpha;
          }
          this.boxAt(ctx, L.ch, px, pose[i].x, pose[i].y);
        });
        break;
      }
      case "skew": {
        const px = SKEW_CAP / this.capPerPx;
        ctx.font = this.font(px);
        const pose = skewPose(f);
        SKEW_LETTERS.forEach((L, i) => {
          const g = this.glyphs.get(L.ch);
          if (!g) return;
          const s = Math.tan(pose[i].deg * DEG);
          ctx.save();
          ctx.translate(L.x + pose[i].dx, SKEW_Y);
          ctx.transform(1, 0, -s, 1, 0, 0);
          ctx.fillText(L.ch, -g.bx * px, -g.by * px);
          ctx.restore();
        });
        break;
      }
      case "rotate": {
        const px = ROTATE_CAP / this.capPerPx;
        ctx.font = this.font(px);
        const theta = rotatePose(f);
        ROTATE_LETTERS.forEach((L, i) => {
          const g = this.glyphs.get(L.ch);
          if (!g) return;
          ctx.save();
          ctx.translate(ROTATE_PIVOT.x, ROTATE_PIVOT.y);
          ctx.rotate(-theta[i] * DEG);
          ctx.translate(L.ox, L.oy);
          ctx.fillText(L.ch, -g.cx * px, -g.cy * px);
          ctx.restore();
        });
        break;
      }
      case "break": {
        const px = BREAK_CAP / this.capPerPx;
        ctx.font = this.font(px);
        const pose = breakPose(f);
        BREAK_LETTERS.forEach((L, i) => this.boxAt(ctx, L.ch, px, pose[i].x, pose[i].y));
        break;
      }
      case "condense": {
        const px = CONDENSE_CAP / this.capPerPx;
        ctx.font = this.font(px);
        const s = condenseWidth(f) / CONDENSE_W118;
        if (s <= 0) break;
        ctx.save();
        ctx.translate(CONDENSE_CX, CONDENSE_Y);
        ctx.scale(s, 1);
        for (const L of CONDENSE_LETTERS) {
          const g = this.glyphs.get(L.ch);
          if (!g) continue;
          ctx.save();
          ctx.translate(L.x0 + L.w / 2 - CONDENSE_CX, 0);
          ctx.scale(this.condenseK, 1);
          ctx.fillText(L.ch, -g.bx * px, -g.by * px);
          ctx.restore();
        }
        ctx.restore();
        break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private boxAt(ctx: CanvasRenderingContext2D, ch: string, px: number, x: number, y: number) {
    const g = this.glyphs.get(ch);
    if (!g) return;
    ctx.fillText(ch, x - g.bx * px, y - g.by * px);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastPhase = phaseAt(this.elapsed / FRAME_MS);
    const tick = (now: number) => {
      if (!this.running) return;
      const t = (this.elapsed + (now - this.t0)) % LOOP_MS;
      const f = t / FRAME_MS;
      const phase = phaseAt(f);
      if (this.lastPhase && phase !== this.lastPhase) this.onCut?.(phase);
      this.lastPhase = phase;
      this.render(f);
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
    this.glyphs.clear();
    if (this.layer) this.layer.width = this.layer.height = 0;
    this.ctx = null;
    this.lctx = null;
    this.layer = null;
    this.mottle = null;
  }
}
