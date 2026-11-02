// Dot cut (https://design.how/vault/dot-cut), engine.ts.
// FIXED. Change the VARIABLE values in params instead (SCENES, PALETTES, DEFAULTS.cols, DEFAULTS.hold, DEFAULTS.morph, DEFAULTS.fill, DEFAULTS.brush, FONT_VAR).
import {
  PALETTES,
  SCENES,
  cellDelay,
  cellMotion,
  rasterize,
  styleField,
  type Scene,
} from "./scenes";

const COLS = 42;
const HOLD_MS = 600;
const MORPH_MS = 520;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface DotCutParams {
  cols: number;
  squareness: number;
  hold: number;
  morph: number;
  brush: number;
  fill: number;
}

export const DEFAULTS: DotCutParams = {
  cols: COLS,
  squareness: 0,
  hold: HOLD_MS,
  morph: MORPH_MS,
  brush: 1.6,
  fill: 1.0,
};

export class DotCut {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;

  readonly params: DotCutParams = { ...DEFAULTS };

  private cols = COLS;
  private rows = 12;
  private pitch = 10;
  private ox = 0;
  private oy = 0;

  private target = new Uint8Array(0);
  private live = new Float32Array(0);
  private from = new Float32Array(0);
  private delay = new Float32Array(0);
  private rnd = new Float32Array(0);
  private prog = new Float32Array(0);
  private dir = new Float32Array(0);
  private bore = new Float32Array(0);
  private styleT = 0;

  private sceneIdx = 0;
  private phase: "hold" | "morph" = "hold";
  private phaseT = 0;
  private clock = 0;

  private paletteMix = 1;
  private prevPalette = 0;
  private prevScene = 0;

  private pointer: { x: number; y: number } | null = null;
  private raf = 0;
  private last = 0;
  private running = false;
  private dpr = 1;
  private ro: ResizeObserver | null = null;
  private disposed = false;
  private fontFamily = "sans-serif";

  constructor(host: HTMLElement, fontFamily?: string) {
    this.host = host;
    if (fontFamily) this.fontFamily = fontFamily;
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) return;

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
  }

  get ok() {
    return !!this.ctx;
  }

  private applyScene(scene: Scene, instant: boolean) {
    const next = rasterize(scene, this.cols, this.rows, this.fontFamily);
    this.from.set(this.live);
    this.target = next;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        this.delay[i] = cellDelay(
          scene.transition,
          x,
          y,
          this.cols,
          this.rows,
          this.rnd[i],
        );
      }
    }
    if (instant) {
      for (let i = 0; i < next.length; i++) this.live[i] = next[i];
      this.from.set(this.live);
    }
  }

  private resize() {
    const ctx = this.ctx;
    if (!ctx || this.disposed) return;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);

    const margin = 0.75;
    this.cols = Math.max(6, Math.round(this.params.cols));
    this.pitch = w / (this.cols + 2 * margin);
    this.rows = Math.max(3, Math.floor((h - 2 * margin * this.pitch) / this.pitch));
    this.ox = (w - this.cols * this.pitch) / 2;
    this.oy = (h - this.rows * this.pitch) / 2;

    const n = this.cols * this.rows;
    this.target = new Uint8Array(n);
    this.live = new Float32Array(n);
    this.from = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.rnd = new Float32Array(n);
    this.prog = new Float32Array(n);
    this.dir = new Float32Array(n);
    this.bore = new Float32Array(n);
    for (let i = 0; i < n; i++) this.rnd[i] = hash(i * 1.37 + 0.5);

    this.applyScene(SCENES[this.sceneIdx], true);
    if (!this.running) this.draw(0);
  }

  setParams(p: Partial<DotCutParams>) {
    const needsGrid = p.cols !== undefined && p.cols !== this.params.cols;
    Object.assign(this.params, p);
    if (needsGrid) this.resize();
  }

  setPointer(p: { x: number; y: number } | null) {
    this.pointer = p;
  }

  advance() {
    this.prevScene = this.sceneIdx;
    this.sceneIdx = (this.sceneIdx + 1) % SCENES.length;
    this.prevPalette = SCENES[(this.sceneIdx - 1 + SCENES.length) % SCENES.length].palette;
    this.paletteMix = 0;
    this.phase = "morph";
    this.phaseT = 0;
    this.styleT = 0;
    this.applyScene(SCENES[this.sceneIdx], false);
  }

  private step(dt: number) {
    this.clock += dt;
    this.phaseT += dt * 1000;

    if (this.phase === "hold" && this.phaseT >= this.params.hold) {
      this.advance();
    } else if (this.phase === "morph" && this.phaseT >= this.params.morph) {
      this.phase = "hold";
      this.phaseT = 0;
    }

    const p = this.phase === "morph" ? Math.min(1, this.phaseT / this.params.morph) : 1;
    const n = this.cols * this.rows;
    for (let i = 0; i < n; i++) {
      const d = this.delay[i];
      const local = Math.min(1, Math.max(0, (p - d * 0.72) / 0.28));
      const e = easeOut(local);
      this.live[i] = this.from[i] + (this.target[i] - this.from[i]) * e;
      const changing = this.from[i] !== this.target[i] && this.phase === "morph";
      this.prog[i] = changing ? local : 0;
      this.dir[i] = this.target[i] > this.from[i] ? 1 : -1;
    }

    this.paletteMix = Math.min(1, this.paletteMix + dt * 2.2);

    this.styleT =
      this.phase === "morph"
        ? Math.min(1, this.styleT + dt / (this.params.morph / 1000))
        : 1;
    styleField(
      SCENES[this.sceneIdx],
      this.cols,
      this.rows,
      this.styleT,
      this.bore,
      SCENES[this.prevScene],
    );
  }

  private draw(dt: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.step(dt);

    const W = this.canvas.width;
    const H = this.canvas.height;
    const s = this.dpr;
    const scene = SCENES[this.sceneIdx];

    const [cA, bA] = PALETTES[this.prevPalette % PALETTES.length];
    const [cB, bB] = PALETTES[scene.palette % PALETTES.length];
    const m = easeInOut(this.paletteMix);
    const circle = mixHex(cA, cB, m);
    const back = mixHex(bA, bB, m);

    ctx.fillStyle = back;
    ctx.fillRect(0, 0, W, H);

    const pitch = this.pitch * s;
    const r = pitch / 2;
    const sq = Math.max(0, Math.min(1, this.params.squareness));

    ctx.fillStyle = circle;

    const solidPath = new Path2D();
    const stroke = Math.max(1.1 * s, r * 0.30);
    const brush = this.params.brush;

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        let v = this.live[i];
        if (v <= 0.004) continue;

        if (this.pointer && brush > 0) {
          const d = Math.hypot(x + 0.5 - this.pointer.x, y + 0.5 - this.pointer.y);
          if (d < brush) v *= Math.min(1, (d / brush) ** 2);
        }
        if (v <= 0.004) continue;

        const mo = cellMotion(scene.transition, this.prog[i], this.dir[i], this.rnd[i]);

        const cx = this.ox * s + (x + 0.5) * pitch + mo.dx * pitch;
        const cy = this.oy * s + (y + 0.5) * pitch + mo.dy * pitch;

        const pop = 1;
        const rr = r * v * pop * mo.scale * this.params.fill;
        if (rr <= 0.3) continue;

        const canRing = rr > 3.2 * s;
        const bore = canRing ? (rr - stroke) * this.bore[i] : 0;

        solidPath.moveTo(cx + rr, cy);
        if (sq < 0.02) {
          solidPath.arc(cx, cy, rr, 0, Math.PI * 2);
        } else {
          roundedSquare(solidPath, cx, cy, rr, sq);
        }
        if (bore > 0.4) {
          solidPath.moveTo(cx + bore, cy);
          solidPath.arc(cx, cy, bore, 0, Math.PI * 2, true);
        }
      }
    }

    ctx.fill(solidPath, "evenodd");
  }

  renderStill() {
    this.phase = "hold";
    this.phaseT = 0;
    this.paletteMix = 1;
    this.applyScene(SCENES[this.sceneIdx], true);
    this.draw(0);
  }

  start() {
    if (this.running || !this.ok || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      this.draw(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.ctx = null;
    this.canvas.remove();
  }

  toCell(px: number, py: number) {
    return { x: (px - this.ox) / this.pitch, y: (py - this.oy) / this.pitch };
  }
}

function roundedSquare(
  ctx: Pick<CanvasRenderingContext2D, "moveTo" | "lineTo" | "closePath">,
  cx: number,
  cy: number,
  r: number,
  sq: number,
) {
  const n = 2 + sq * 8;
  const steps = 22;
  ctx.moveTo(cx + r, cy);
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * r;
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * r;
    ctx.lineTo(cx + x, cy + y);
  }
  ctx.closePath();
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round((((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t));
  const g = Math.round((((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t));
  const bl = Math.round(((pa & 255) * (1 - t) + (pb & 255) * t));
  return `rgb(${r},${g},${bl})`;
}
