// Dash cascade (https://design.how/vault/dash-cascade), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, BG, HUE_SPREAD_DEG, HUE_DRIFT_S, FPS).
import {
  AXIS,
  BG,
  CONTENT_MID,
  DASH_H,
  WORDS,
  LOOPS_PER_WORD,
  DOWN_AT,
  DOWN_RATE,
  DOWN_TILT,
  FPS,
  FRAMES,
  INK,
  HUE_SPREAD_DEG,
  HUE_LAYERS,
  HUE_DRIFT_S,
  HUE_WAVES,
  LIGHT_SPREAD,
  HOVER_SAT_LIFT,
  HOVER_DRIFT_GAIN,
  HOVER_EASE_S,
  LETTER_CENTER,
  PINCH_DOWN,
  PINCH_UP,
  REF_W,
  ROW_Y,
  UP_AT,
  UP_RATE,
  WAVE,
  WAVE_LEAD,
} from "./params";

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h: number;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (mx === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
const [INK_H, INK_S, INK_L] = hexToHsl(INK);

const ROWS = ROW_Y.length;

const COLLAPSE_FRAME = 0;

function delayOf(x0: number, x1: number, letter: number, row: number): number {
  if (letter === 0) {
    const c = (x0 + x1) / 2;
    return DOWN_AT + DOWN_RATE * row + DOWN_TILT * (c - LETTER_CENTER[0]);
  }
  if (letter === 2) return UP_AT + UP_RATE * (ROWS - 1 - row);
  return Math.min(
    PINCH_DOWN[0] + PINCH_DOWN[1] * row,
    PINCH_UP[0] + PINCH_UP[1] * (ROWS - 1 - row),
  );
}

function excursion(frame: number, delay: number): number {
  const ph = (((frame - delay + WAVE_LEAD) % FRAMES) + FRAMES) % FRAMES;
  const i = Math.floor(ph);
  const t = ph - i;
  return WAVE[i] * (1 - t) + WAVE[(i + 1) % FRAMES] * t;
}

export class DashCascade {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private lastFrame = -1;
  private word = 0;
  private hueClock = 0;
  private hover = 0;
  private hoverTarget = 0;
  private lastNow = 0;

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) this.resize();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.lastFrame = -1;
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastFrame = -1;
    const tick = (now: number) => {
      if (!this.running) return;

      const dt = this.lastNow === 0 ? 0 : Math.min(0.05, (now - this.lastNow) / 1000);
      this.lastNow = now;
      this.hueClock += dt * (1 + (HOVER_DRIFT_GAIN - 1) * this.hover);
      if (this.hover !== this.hoverTarget) {
        const step = dt / HOVER_EASE_S;
        this.hover =
          this.hoverTarget > this.hover
            ? Math.min(this.hoverTarget, this.hover + step)
            : Math.max(this.hoverTarget, this.hover - step);
      }

      const ticks = Math.floor(((now - this.t0) / 1000) * FPS);
      const frame = ticks % FRAMES;
      const colourMoving = this.hover !== this.hoverTarget || this.hover > 0;
      if (frame !== this.lastFrame || colourMoving) {
        if (frame === COLLAPSE_FRAME) {
          const loop = Math.floor(ticks / FRAMES);
          this.word = Math.floor(loop / LOOPS_PER_WORD) % WORDS.length;
        }
        this.lastFrame = frame;
        this.draw(frame);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  setHover(on: boolean) {
    this.hoverTarget = on ? 1 : 0;
  }

  stop() {
    this.running = false;
    this.lastNow = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(13);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  private ink(u: number, v: number, phase: number, sat: number): string {
    let k = 0;
    for (const w of HUE_WAVES) {
      k += w.weight * Math.cos((u * w.u + v * w.v + phase * w.speed) * Math.PI * 2);
    }
    const h = INK_H + (k * HUE_SPREAD_DEG) / 2;
    const l = INK_L + k * LIGHT_SPREAD;
    return `hsl(${h.toFixed(1)} ${(sat * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
  }

  private draw(frame: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const sc = W / REF_W;
    ctx.translate(0, H / 2 - CONTENT_MID * sc);
    ctx.scale(sc, sc);

    ctx.lineCap = "round";

    const phase = (this.hueClock / HUE_DRIFT_S) % 1;
    const sat = Math.min(1, INK_S + HOVER_SAT_LIFT * this.hover);

    for (let r = 0; r < ROWS; r++) {
      const y = ROW_Y[r];
      const vy = r / (ROWS - 1);
      for (const [x0, x1, letter] of WORDS[this.word][r]) {
        const e = excursion(frame, delayOf(x0, x1, letter, r));
        const a = AXIS + (x0 - AXIS) * e;
        const b = AXIS + (x1 - AXIS) * e;

        const span = b - a;
        if (span < 0.5) {
          const u = (a - AXIS) / REF_W + 0.5;
          ctx.fillStyle = this.ink(u, vy, phase, sat);
          ctx.beginPath();
          ctx.arc((a + b) / 2, y, DASH_H / 2, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.lineWidth = DASH_H;
        const seg = span / HUE_LAYERS;
        for (let i = 0; i < HUE_LAYERS; i++) {
          const s0 = Math.max(a, a + i * seg - seg * 0.5);
          const s1 = Math.min(b, a + (i + 1) * seg + seg * 0.5);
          const mid = (s0 + s1) / 2;
          const u = (mid - AXIS) / REF_W + 0.5;
          ctx.strokeStyle = this.ink(u, vy, phase, sat);
          ctx.beginPath();
          ctx.moveTo(s0, y);
          ctx.lineTo(s1, y);
          ctx.stroke();
        }
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
