// Swing type (https://design.how/vault/swing-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, BG, PERIOD, DETENT, CAP_FRAC, WORD_SECONDS, FONT_VAR).
import {
  BG,
  CAP_FRAC,
  CULL_DEG,
  DETENT,
  FONT_WEIGHT,
  FONT_WEIGHT_EDGE,
  INK,
  K_OVER_CAP,
  LEAN,
  PERIOD,
  PITCH_DEG,
  PIVOT_CAP,
  swingDeg,
  VSCALE,
  VSCALE_BY_HEIGHT,
  WORDS,
  WORD_SECONDS,
  FLIP_SECONDS,
  FLIP_STAGGER,
} from "./params";

const DEG = Math.PI / 180;

interface Face {
  bmp: HTMLCanvasElement;
  heavy: HTMLCanvasElement;
  w: number;
  h: number;
  dx: number;
  dy: number;
  tall: number;
}

interface Slot {
  u: number;
  faces: Face[];
  word: number;
}

const PITCH_RAD = PITCH_DEG * DEG;
function detent(phi: number): number {
  return phi - (DETENT * PITCH_RAD * Math.sin((2 * Math.PI * phi) / PITCH_RAD)) / (2 * Math.PI);
}

function table(t: number[], absDeg: number): number {
  const s = Math.min(absDeg, 90) / 15;
  const i = Math.min(Math.floor(s), t.length - 2);
  return t[i] + (t[i + 1] - t[i]) * (s - i);
}

export class SwingType {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private w = 0;
  private h = 0;

  private slots: Slot[] = [];
  private target = 0;
  private flipAt: number[] = [];
  private clock = 0;
  private carried = 0;
  private cap = 0;
  private K = 0;
  private baseline = 0;
  private pivotY = 0;

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private family: string = "sans-serif",
  ) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) this.resize();
  }

  refreshFont(family?: string) {
    if (family) this.family = family;
    this.layout();
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
    this.layout();
    if (!this.running) this.renderStill();
  }

  private layout() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.cap = this.h * CAP_FRAC;
    this.K = this.cap * K_OVER_CAP;
    this.baseline = this.h / 2 + this.cap / 2;
    this.pivotY = this.baseline - this.cap * PIVOT_CAP;

    const probe = 200;
    ctx.font = `${FONT_WEIGHT} ${probe}px ${this.family}`;
    const capAt = ctx.measureText("H").actualBoundingBoxAscent || probe * 0.72;
    const size = (probe * this.cap) / capAt;

    const words = WORDS.map((w: string) => [...w]);
    const n = words[0].length;
    const dpr = this.dpr;

    const faceOf = (ch: string, i: number, size: number): Face => {
      ctx.font = `${FONT_WEIGHT} ${size}px ${this.family}`;
      const m = ctx.measureText(ch);
      const left = m.actualBoundingBoxLeft;
      const right = m.actualBoundingBoxRight;
      const asc = m.actualBoundingBoxAscent;
      const desc = m.actualBoundingBoxDescent;
      const gw = Math.max(1, left + right);
      const gh = Math.max(1, asc + desc);
      const pad = 2;

      const cut = (weight: number) => {
        const c = document.createElement("canvas");
        const bleed = pad * 3;
        c.width = Math.ceil((gw + bleed * 2) * dpr);
        c.height = Math.ceil((gh + bleed * 2) * dpr);
        const g = c.getContext("2d");
        if (g) {
          g.scale(dpr, dpr);
          g.font = `${weight} ${size}px ${this.family}`;
          g.textBaseline = "alphabetic";
          g.fillStyle = INK[i % INK.length];
          g.fillText(ch, bleed + left, bleed + asc);
        }
        return c;
      };

      const bmp = cut(FONT_WEIGHT);
      const heavy = cut(FONT_WEIGHT_EDGE);
      const bleed = pad * 3;
      return {
        bmp,
        heavy,
        tall: gh / this.cap,
        w: gw + bleed * 2,
        h: gh + bleed * 2,
        dx: -(gw + bleed * 2) / 2,
        dy: this.cap * PIVOT_CAP - asc - bleed,
      };
    };

    const keep = this.slots.map((sl) => sl.word);
    this.slots = Array.from({ length: n }, (_, i) => ({
      u: (i - (n - 1) / 2) * PITCH_DEG * DEG,
      faces: words.map((w: string[]) => faceOf(w[i], i, size)),
      word: keep[i] ?? 0,
    }));
    if (this.flipAt.length !== n) this.flipAt = new Array(n).fill(-1);
  }

  private render(phi: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { dpr, w, h } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w * dpr, h * dpr);

    const cx = w / 2;

    const cullRad = CULL_DEG * DEG;
    const order = this.slots
      .map((sl, i) => {
        const base = sl.u + phi;
        let a = base;
        const from = this.flipAt[i];
        if (from >= 0) {
          const k = (this.clock - from) / FLIP_SECONDS;
          if (k >= 1) {
            this.flipAt[i] = -1;
            sl.word = this.target;
          } else if (k > 0) {
            const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
            const tri = 1 - Math.abs(2 * e - 1);
            const sign = base >= 0 ? 1 : -1;
            a = base + sign * (cullRad - Math.abs(base)) * tri;
            if (k >= 0.5) sl.word = this.target;
          }
        }
        return { sl, a };
      })
      .sort((p, q) => Math.abs(q.a) - Math.abs(p.a));

    const cull = CULL_DEG * DEG;
    for (const { sl, a } of order) {
      if (Math.abs(a) >= cull) continue;
      const g = sl.faces[sl.word];
      const x = cx + this.K * a;
      const absDeg = Math.abs(a) / DEG;
      const sq = Math.cos(a);
      const vs = 1 - (1 - table(VSCALE, absDeg)) * (1 + (g.tall - 1) * VSCALE_BY_HEIGHT);
      const rho = -Math.atan(table(LEAN, absDeg) * (a < 0 ? 1 : -1));
      const cr = Math.cos(rho);
      const sr = Math.sin(rho);

      ctx.setTransform(
        sq * cr * dpr,
        sq * sr * dpr,
        -vs * sr * dpr,
        vs * cr * dpr,
        x * dpr,
        this.pivotY * dpr,
      );
      ctx.drawImage(g.bmp, g.dx, g.dy, g.w, g.h);
      const heavy = 1 - sq;
      if (heavy > 0.01) {
        ctx.globalAlpha = heavy;
        ctx.drawImage(g.heavy, g.dx, g.dy, g.w, g.h);
        ctx.globalAlpha = 1;
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.carried * 1000;
    const swing = swingDeg([...WORDS[0]].length) * DEG;
    const tick = (now: number) => {
      if (!this.running) return;
      const elapsed = (now - this.t0) / 1000;
      this.clock = elapsed;
      const want = Math.floor(elapsed / WORD_SECONDS) % WORDS.length;
      if (want !== this.target) {
        this.target = want;
        for (let i = 0; i < this.slots.length; i++) {
          this.flipAt[i] = elapsed + i * FLIP_STAGGER;
        }
      }
      const t = elapsed % PERIOD;
      this.render(detent(swing * Math.sin((2 * Math.PI * t) / PERIOD)));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.carried = (performance.now() - this.t0) / 1000;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    const first = this.slots[0];
    this.render(first ? -first.u : 0);
  }

  destroy() {
    this.stop();
    this.slots = [];
    this.ctx = null;
  }
}
