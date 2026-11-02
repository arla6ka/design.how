import {
  ACCENT,
  BLOCK,
  BLOCK_H,
  BLOCK_SPAN,
  BLUR_MIN_SPEED,
  BLUR_REACH,
  BLUR_TAPS,
  CYCLE,
  DWELL,
  FONT,
  GRAIN_ALPHA,
  GRAIN_TILE,
  GROUND,
  HUE_BASE,
  HUE_COLD,
  HUE_EASE,
  HUE_HOT,
  HUE_HOVER,
  HUE_MID,
  HUE_PUSH,
  HUE_REACH,
  HUE_TRAVEL,
  LABEL_PAD_X,
  LABEL_PAD_Y,
  LABEL_TO_LEFT,
  LABEL_TO_RIGHT,
  MARGIN,
  MAG_EASE,
  MAG_PULL,
  MAG_REACH,
  PARALLAX_SCALE,
  PARALLAX_SHIFT,
  PITCH,
  ROWS,
  SPLIT_COOL,
  SPLIT_MAX,
  SPLIT_WARM,
  STAGGER,
  TOP,
  TRAVERSE,
  WAKE_ALPHA,
  WAKE_LAG,
  WAKE_TINT,
  WAKE_WIDTH,
} from "./params";

const SETTLE = 2;
const smoothstep = (k: number) => k * k * (3 - 2 * k);
const ease = (k: number) => 1 - Math.pow(1 - smoothstep(k), SETTLE);

const rawSpeed = (k: number) =>
  SETTLE * Math.pow(1 - smoothstep(k), SETTLE - 1) * (6 * k * (1 - k));

const SPEED_PEAK = (() => {
  let m = 0;
  for (let i = 0; i <= 1000; i++) m = Math.max(m, rawSpeed(i / 1000));
  return m || 1;
})();

const easeSpeed = (k: number) => Math.min(1, rawSpeed(k) / SPEED_PEAK);

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const HOT = hexToRgb(HUE_HOT);
const MID = hexToRgb(HUE_MID);
const COLD = hexToRgb(HUE_COLD);

const ACCENT_RGB = hexToRgb(ACCENT);

function heat(speed: number, slide: number, lit: number): string {
  const k = Math.max(
    0,
    Math.min(1, speed + (slide - speed) * (HUE_TRAVEL * lit)),
  );

  const m = 1 - k;
  const a = m * m;
  const b = 2 * m * k;
  const c = k * k;
  const r = a * COLD[0] + b * MID[0] + c * HOT[0];
  const g = a * COLD[1] + b * MID[1] + c * HOT[1];
  const bl = a * COLD[2] + b * MID[2] + c * HOT[2];

  const amount = (HUE_BASE + (HUE_HOVER - HUE_BASE) * lit) * (1 + (HUE_PUSH - 1) * lit);

  const ch = (v: number, base: number) =>
    Math.max(0, Math.min(255, Math.round(base + (v - base) * amount)));
  return `rgb(${ch(r, ACCENT_RGB[0])},${ch(g, ACCENT_RGB[1])},${ch(bl, ACCENT_RGB[2])})`;
}

interface RowState {
  x: number;
  label: string;
  slide: number;
  speed: number;
}

function rowState(row: number, t: number, left: number, right: number): RowState {
  const u = (((t / CYCLE + row * STAGGER) % 1) + 1) % 1;
  const legs = TRAVERSE + DWELL;
  const a = TRAVERSE / CYCLE;
  const b = legs / CYCLE;
  const c = (legs + TRAVERSE) / CYCLE;

  if (u < a) {
    const p = u / a;
    const k = ease(p);
    return {
      x: left + (right - left) * k,
      label: LABEL_TO_RIGHT,
      slide: k,
      speed: easeSpeed(p),
    };
  }
  if (u < b) {
    return { x: right, label: LABEL_TO_LEFT, slide: 1, speed: 0 };
  }
  if (u < c) {
    const p = (u - b) / (c - b);
    const k = ease(p);
    return {
      x: right - (right - left) * k,
      label: LABEL_TO_LEFT,
      slide: 1 - k,
      speed: easeSpeed(p),
    };
  }
  return { x: left, label: LABEL_TO_RIGHT, slide: 0, speed: 0 };
}

function convexHull(pts: [number, number][]): [number, number][] {
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const s = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const lower: [number, number][] = [];
  for (const p of s) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export class SlideStack {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private elapsed = 0;
  private running = false;
  private size = 0;
  private dpr = 1;
  private family = "sans-serif";

  private prevX: (number | null)[] = new Array(ROWS).fill(null);
  private prevAt = 0;

  private wake: [number, number][][] = [];

  private pointer: { x: number; y: number } | null = null;
  private magX = 0;
  private magY = 0.5;
  private magAmt = 0;

  private lit: number[] = new Array(ROWS).fill(0);

  private grain: HTMLCanvasElement | null = null;

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) {
      this.buildGrain();
      this.resize();
    }
  }

  setFont(family: string) {
    this.family = family;
    if (!this.running) this.renderStill();
  }

  setPointer(p: { x: number; y: number } | null) {
    this.pointer = p;
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.size = Math.max(1, Math.min(r.width, r.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.prevX.fill(null);
    this.wake.length = 0;
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.elapsed * 1000;
    this.prevAt = 0;
    this.prevX.fill(null);
    const tick = (now: number) => {
      if (!this.running) return;
      this.draw((now - this.t0) / 1000);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed = ((performance.now() - this.t0) / 1000) % CYCLE;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(0, true);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.grain = null;
  }

  private buildGrain() {
    const n = GRAIN_TILE;
    const c = document.createElement("canvas");
    c.width = n;
    c.height = n;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(n, n);
    const d = img.data;
    let seed = 0x2f6e2b1;
    for (let i = 0; i < d.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = seed >>> 24;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    this.grain = c;
  }

  private draw(t: number, still = false) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { dpr, size: S } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(0, (H - S) / 2);

    const bh = BLOCK_H * S;

    const bw = BLOCK_SPAN * W;
    const left = MARGIN * W;
    const right = W - MARGIN * W - bw;

    const wantX = this.pointer ? this.pointer.x - 0.5 : 0;
    const wantY = this.pointer ? this.pointer.y : 0.5;
    const wantAmt = this.pointer ? 1 : 0;
    if (still) {
      this.magX = wantX;
      this.magY = wantY;
      this.magAmt = wantAmt;
    } else {
      this.magX += (wantX - this.magX) * MAG_EASE;
      this.magY += (wantY - this.magY) * MAG_EASE;
      this.magAmt += (wantAmt - this.magAmt) * MAG_EASE;
    }

    const states: RowState[] = [];
    for (let i = 0; i < ROWS; i++) states.push(rowState(i, t, left, right));

    for (let i = 0; i < ROWS; i++) {
      const rowMid = (TOP + i * PITCH) + BLOCK_H / 2;
      const dy = this.pointer ? Math.abs(rowMid - this.pointer.y) : Infinity;
      const near = (reach: number) => {
        const f = Math.max(0, 1 - dy / reach);
        return f * f;
      };
      const wantLit = this.pointer ? near(HUE_REACH) : 0;
      if (still) this.lit[i] = wantLit;
      else this.lit[i] += (wantLit - this.lit[i]) * HUE_EASE;
    }

    const depth = (i: number) => i / (ROWS - 1);
    const scaleOf = (i: number) => 1 - PARALLAX_SCALE * (1 - depth(i));
    const shiftOf = (i: number) => PARALLAX_SHIFT * W * (1 - depth(i));

    const placed = states.map((s, i) => {
      const sc = scaleOf(i);
      const w = bw * sc;
      const h = bh * sc;

      const rowMid = (TOP + i * PITCH) * S + bh / 2;
      const dy = Math.abs(rowMid / S - this.magY);
      const falloff = Math.max(0, 1 - dy / MAG_REACH);
      const lean = this.magX * MAG_PULL * W * falloff * falloff * this.magAmt;

      const cx = s.x + bw / 2 + shiftOf(i) + lean;
      const cy = (TOP + i * PITCH) * S + bh / 2;
      return { x: cx - w / 2, y: cy - h / 2, w, h, s };
    });

    const pts: [number, number][] = [];
    for (const p of placed) {
      pts.push([p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]);
    }
    const hull = convexHull(pts);

    if (!still) {
      this.wake.push(hull.map(([x, y]) => [x / W, y / S] as [number, number]));
      while (this.wake.length > WAKE_LAG) this.wake.shift();
    }
    const past = this.wake.length >= WAKE_LAG ? this.wake[0] : null;
    if (past && past.length > 2) {
      ctx.globalAlpha = WAKE_ALPHA;
      ctx.beginPath();
      ctx.moveTo(past[0][0] * W, past[0][1] * S);
      for (let i = 1; i < past.length; i++) ctx.lineTo(past[i][0] * W, past[i][1] * S);
      ctx.closePath();
      ctx.lineWidth = WAKE_WIDTH;
      ctx.lineJoin = "round";
      ctx.strokeStyle = WAKE_TINT;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    let top = Infinity;
    let bot = -Infinity;
    for (const [, y] of hull) {
      if (y < top) top = y;
      if (y > bot) bot = y;
    }
    let fill: string | CanvasGradient = ACCENT;
    if (bot > top) {
      const g = ctx.createLinearGradient(0, top, 0, bot);
      for (let i = 0; i < ROWS; i++) {
        const rowMid = placed[i].y + placed[i].h / 2;
        const stop = Math.max(0, Math.min(1, (rowMid - top) / (bot - top)));
        g.addColorStop(stop, heat(states[i].speed, states[i].slide, this.lit[i]));
      }
      fill = g;
    }

    ctx.beginPath();
    ctx.moveTo(hull[0][0], hull[0][1]);
    for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i][0], hull[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    const dt = still ? 0 : Math.max(1, (t - this.prevAt) * 1000);
    this.prevAt = t;

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    for (let i = 0; i < ROWS; i++) {
      const p = placed[i];
      const { label, slide, speed } = states[i];
      ctx.font = `600 ${FONT * S * scaleOf(i)}px ${this.family}`;

      const was = this.prevX[i];
      const nowFrac = p.x / W;
      if (was !== null && !still) {
        const travelled = (nowFrac - was) * W;
        const px = Math.abs(travelled) / dt;
        if (px > BLUR_MIN_SPEED && speed > 0) {
          const reach = -travelled * BLUR_REACH;
          ctx.fillStyle = BLOCK;
          for (let k = 1; k <= BLUR_TAPS; k++) {
            const f = k / BLUR_TAPS;
            ctx.globalAlpha = (1 - f) * 0.42 * speed;
            ctx.fillRect(p.x + reach * f, p.y, p.w, p.h);
          }
          ctx.globalAlpha = 1;
        }
      }
      this.prevX[i] = nowFrac;

      ctx.fillStyle = BLOCK;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      const pad = LABEL_PAD_X * S * scaleOf(i);
      const tw = ctx.measureText(label).width;
      const room = Math.max(0, p.w - pad * 2 - tw);
      const lx = p.x + pad + room * slide;
      const ly = p.y + p.h - LABEL_PAD_Y * S * scaleOf(i);

      const split = SPLIT_MAX * speed;
      if (split > 0.02) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = SPLIT_WARM;
        ctx.fillText(label, lx - split, ly);
        ctx.fillStyle = SPLIT_COOL;
        ctx.fillText(label, lx + split, ly);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = GROUND;
      ctx.fillText(label, lx, ly);
    }

    ctx.restore();

    if (this.grain) {
      ctx.globalAlpha = GRAIN_ALPHA;
      ctx.globalCompositeOperation = "overlay";
      const pat = ctx.createPattern(this.grain, "repeat");
      if (pat) {
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }
}
