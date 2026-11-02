// Tile field (https://design.how/vault/tile-field), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, CELLS_ACROSS, HUE, HUE_SWING, REST, SPEED, FADE_RATE).
import {
  CELLS_ACROSS, FADE_RATE, FILL, FONT, GLOW_LCH, HUE, HUE_SWING, LETTER_TRACK, LIGHT_RATE, MAX_SIZE, REST, SPARK,
  SPARK_SHARE, SPEED, STILL_TIME, WAVE_C, WAVE_L, WORD,
} from './params';

const TAU = Math.PI * 2;
const HUE_STEPS = 24;
const ALPHA_STEPS = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x: number, e0: number, e1: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
function hash(x: number, y: number) {
  const r = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return r - Math.floor(r);
}

export class TileField {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private ro: ResizeObserver | null = null;
  private dpr = 1;
  private viewW = 0;
  private viewH = 0;
  private cell = 2;
  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  private n = 0;
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private hueSeed = new Float32Array(0);
  private spark = new Uint8Array(0);
  private lit = new Float32Array(0);
  private seed = new Float32Array(0);

  private hasPointer = false;
  private rawX = 0;
  private rawY = 0;
  private lightX = 0;
  private lightY = 0;
  private lightSpeed = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.ok = !!this.ctx;
    if (!this.ok) return;
    this.resize();
    window.addEventListener('pointermove', this.onMove, {passive: true});
    window.addEventListener('pointerleave', this.onLeave);
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (rect.width === this.viewW && rect.height === this.viewH && dpr === this.dpr) return;
    this.viewW = rect.width;
    this.viewH = rect.height;
    this.dpr = dpr;
    this.cell = Math.max(2, Math.round(this.viewW / CELLS_ACROSS));
    const {cell, viewW, viewH} = this;
    this.canvas.width = Math.ceil(viewW * dpr);
    this.canvas.height = Math.ceil(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const sc = document.createElement('canvas');
    sc.width = Math.max(1, Math.floor(viewW));
    sc.height = Math.max(1, Math.floor(viewH));
    const s = sc.getContext('2d', {willReadFrequently: true});
    const xs: number[] = [], ys: number[] = [], sp: number[] = [], sd: number[] = [], hs: number[] = [];
    if (s) {
      s.fillStyle = '#000';
      s.textAlign = 'center';
      s.textBaseline = 'middle';
      let fs = viewH * 0.9;
      s.letterSpacing = `${LETTER_TRACK * fs}px`;
      s.font = FONT(fs);
      fs *= (viewW * FILL) / (s.measureText(WORD).width || 1);
      s.letterSpacing = `${LETTER_TRACK * fs}px`;
      s.font = FONT(fs);
      s.fillText(WORD, viewW / 2, viewH / 2);
      const data = s.getImageData(0, 0, sc.width, sc.height).data;
      const cols = Math.ceil(viewW / cell);
      const rows = Math.ceil(viewH / cell);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = Math.floor(c * cell + cell / 2);
          const y = Math.floor(r * cell + cell / 2);
          if (x >= sc.width || y >= sc.height) continue;
          if ((data[(y * sc.width + x) * 4 + 3] ?? 0) / 255 <= 0.5) continue;
          xs.push(x);
          ys.push(y);
          sp.push(hash(x + 7, y - 3) > 1 - SPARK_SHARE ? 1 : 0);
          sd.push(hash(x * 1.3, y * 0.7));
          hs.push(hash(x * 0.7 + 11, y * 1.9 - 5));
        }
      }
    }
    this.n = xs.length;
    this.px = new Float32Array(xs);
    this.py = new Float32Array(ys);
    this.spark = new Uint8Array(sp);
    this.seed = new Float32Array(sd);
    this.hueSeed = new Float32Array(hs);
    this.lit = new Float32Array(this.n);
    if (!this.running) this.paint(this.time || STILL_TIME, 0, 0);
  }

  private distSegSq(qx: number, qy: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return (qx - ax) ** 2 + (qy - ay) ** 2;
    const t = clamp(((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    return (qx - (ax + dx * t)) ** 2 + (qy - (ay + dy * t)) ** 2;
  }

  private paint(T: number, frames: number, ms: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const {viewW, viewH, cell, n, px, py, hueSeed, spark, lit, seed} = this;
    ctx.clearRect(0, 0, viewW, viewH);

    const prevX = this.lightX, prevY = this.lightY;
    if (this.hasPointer) {
      const follow = 1 - Math.pow(0.5, frames);
      this.lightX += (this.rawX - this.lightX) * follow;
      this.lightY += (this.rawY - this.lightY) * follow;
    }
    const lightX = this.lightX, lightY = this.lightY;
    this.lightSpeed = 0.9 * this.lightSpeed + 0.1 * Math.hypot(lightX - prevX, lightY - prevY);
    const moving = this.hasPointer;
    const reach = clamp(viewH * 0.22 + this.lightSpeed * 0.9, viewH * 0.18, viewH * 0.42);
    const influence = 1.5 * reach;
    const influenceSq = influence * influence;
    const minX = Math.min(prevX, lightX) - influence, maxX = Math.max(prevX, lightX) + influence;
    const minY = Math.min(prevY, lightY) - influence, maxY = Math.max(prevY, lightY) + influence;
    const up = 1 - Math.pow(1 - LIGHT_RATE, frames);
    const down = 1 - Math.pow(1 - FADE_RATE, frames);

    const grey = new Path2D();
    const litList: number[] = [];
    const buckets: Path2D[][] = Array.from({length: HUE_STEPS}, () => Array.from({length: ALPHA_STEPS}, () => new Path2D()));
    const hueOfStep = new Float32Array(HUE_STEPS);

    for (let i = 0; i < n; i++) {
      const x = px[i], y = py[i];
      let target = 0;
      if (moving && x >= minX && x <= maxX && y >= minY && y <= maxY) {
        const dSq = this.distSegSq(x, y, prevX, prevY, lightX, lightY);
        if (dSq <= influenceSq) {
          const ang = Math.atan2(y - lightY, x - lightX);
          const wobble = 1 + 0.3 * Math.sin(3 * ang + T * 1.6) + 0.16 * Math.sin(5 * ang - T * 1.1 + 1.3);
          const f = clamp(1 - Math.sqrt(dSq) / (reach * wobble), 0, 1);
          target = f * f * (3 - 2 * f);
        }
      }
      lit[i] += (target - lit[i]) * (target > lit[i] ? up : down);

      const u = x / Math.max(viewW, 1);
      const v = y / Math.max(viewH, 1);
      const flow =
        Math.sin((u * 1.6 + 0.4 * Math.sin(T * 0.3)) * TAU + T * 0.8) +
        0.7 * Math.sin((v * 2.1 - u * 0.9) * TAU - T * 0.6 + 1.7) +
        0.5 * Math.sin((u * 3.3 + v * 2.7) * TAU + T * 0.4 + 4.2) +
        0.4 * Math.cos((v * 1.3 - 1.1 * Math.sin(T * 0.2)) * TAU - T * 0.5);
      const colour = Math.max(smoothstep(flow, 0.1, 1.6), lit[i]);

      const breathe = 0.5 + 0.5 * Math.sin(seed[i] * TAU + T * 1.3);
      const base = 0.22 + 0.1 * breathe;
      const sz = cell * (base + (MAX_SIZE - base) * colour);
      const h = sz / 2;
      grey.rect(x - h, y - h, sz, sz);

      if (colour > 0.04) {
        const hue = HUE + (flow - 0.8) * HUE_SWING + (hueSeed[i] - 0.5) * 8;
        const hStep = ((Math.round((hue / 360) * HUE_STEPS) % HUE_STEPS) + HUE_STEPS) % HUE_STEPS;
        hueOfStep[hStep] = hue;
        buckets[hStep][Math.min(ALPHA_STEPS - 1, Math.floor(colour * ALPHA_STEPS))].rect(x - h, y - h, sz, sz);
      }
      if (lit[i] > 0.02) litList.push(i);
    }

    ctx.fillStyle = REST;
    ctx.fill(grey);
    for (let s = 0; s < HUE_STEPS; s++) {
      for (let a = 0; a < ALPHA_STEPS; a++) {
        ctx.globalAlpha = (a + 1) / ALPHA_STEPS;
        ctx.fillStyle = `oklch(${WAVE_L} ${WAVE_C} ${hueOfStep[s]})`;
        ctx.fill(buckets[s][a]);
      }
    }
    ctx.globalAlpha = 1;

    for (const i of litList) {
      const L = lit[i];
      const x = px[i], y = py[i];
      const gsz = cell * (0.7 + (MAX_SIZE - 0.7) * L);
      const gh = gsz / 2;
      if (spark[i]) {
        const ph = seed[i];
        const tt = 0.00025 * ms;
        const amp = (0.45 + ph) * cell * 0.28;
        const jx = x + Math.sin(0.05 * x + 1.3 * tt + ph * TAU) * amp;
        const jy = y + Math.cos(0.04 * y - 0.9 * tt + ph * TAU) * amp;
        ctx.fillStyle = `rgba(${SPARK},${(0.1 * L).toFixed(3)})`;
        ctx.fillRect(jx - gh * 1.5, jy - gh * 1.5, gsz * 1.5, gsz * 1.5);
        ctx.fillStyle = `rgba(${SPARK},${(0.55 * L).toFixed(3)})`;
        ctx.fillRect(jx - gh, jy - gh, gsz, gsz);
      } else {
        ctx.fillStyle = `oklch(${GLOW_LCH} / ${(0.85 * L).toFixed(3)})`;
        ctx.fillRect(x - gh, y - gh, gsz, gsz);
      }
    }
  }

  private tick = (ms: number) => {
    if (!this.running) return;
    const frames = this.last ? Math.min(3, (ms - this.last) / (1000 / 60)) : 1;
    this.last = ms;
    this.time += SPEED * frames;
    this.paint(this.time, frames, ms);
    this.raf = requestAnimationFrame(this.tick);
  };

  private onMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x >= -40 && y >= -40 && x <= rect.width + 40 && y <= rect.height + 40) {
      if (!this.hasPointer) {
        this.hasPointer = true;
        this.lightX = x;
        this.lightY = y;
        this.lightSpeed = 0;
      }
      this.rawX = x;
      this.rawY = y;
    } else this.hasPointer = false;
  };

  private onLeave = () => { this.hasPointer = false; };

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    if (!this.time) this.time = STILL_TIME;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.time = STILL_TIME;
    this.paint(STILL_TIME, 0, 0);
  }

  destroy() {
    this.stop();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerleave', this.onLeave);
    this.ro?.disconnect();
    this.ro = null;
    this.ctx = null;
  }
}
