import {
  AMP_RATIO,
  CELL_LAG,
  DEPTH,
  DETENT,
  LIGHT_LEAD,
  HORIZON,
  LIGHT_TURN,
  METALS,
  POINTER_EASE,
  POINTER_TURN,
  SHADE_BUCKETS,
  SPARK_GAIN,
  type Metal,
  BG,
  COLS,
  DPR_CAP,
  INK,
  MIN_STROKE,
  PERIOD_MS,
  PTS_PER_FREQ,
  ROWS,
  STROKE_RATIO,
  TAU,
} from "./params";

interface Cell {
  row: number;
  col: number;
  near: number;
  lagCos: number;
  lagSin: number;
  shadeIdx: number;
  sinFx: Float32Array;
  cosFx: Float32Array;
  cosFy: Float32Array;
  tanSin: Float32Array;
  tanCos: Float32Array;
  tanY: Float32Array;
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function bakeSwatches(ramp: Uint8Array, near: readonly number[]): string[][] {
  return near.map((nr) => {
    const shade = 0.55 + 0.45 * nr;
    const out: string[] = [];
    for (let b = 0; b < SHADE_BUCKETS; b++) {
      const i = Math.min(255, Math.round(((b + 0.5) / SHADE_BUCKETS) * 255)) * 3;
      out.push(
        `rgb(${(ramp[i] * shade) | 0},${(ramp[i + 1] * shade) | 0},${(ramp[i + 2] * shade) | 0})`,
      );
    }
    return out;
  });
}

function bakeRamp(m: Metal): Uint8Array {
  const stops = m.stops.map(hex);
  const out = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * 4;
    const col = [stops[0][0], stops[0][1], stops[0][2]];
    for (let sIdx = 1; sIdx < 5; sIdx++) {
      const raw = Math.min(1, Math.max(0, x - (sIdx - 1)));
      const w = raw * raw * (3 - 2 * raw);
      for (let ch = 0; ch < 3; ch++) {
        col[ch] += (stops[sIdx][ch] - col[ch]) * w;
      }
    }
    out[i * 3] = col[0];
    out[i * 3 + 1] = col[1];
    out[i * 3 + 2] = col[2];
  }
  return out;
}

function detent(p: number): number {
  return p - DETENT * 0.5 * Math.sin(2 * p);
}

function gcd(a: number, b: number): number {
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

export class PhaseTable {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private cells: Cell[] = [];

  private dpr = 1;
  private w = 0;
  private h = 0;
  private pitch = 0;
  private ox = 0;
  private oy = 0;
  private amp = 0;
  private lw = MIN_STROKE;

  private running = false;
  private raf = 0;
  private last = 0;
  private phase = 0;

  private metal: Metal | null = METALS[0];
  private ramp: Uint8Array | null = bakeRamp(METALS[0]);
  private swatches: string[][] | null = null;
  private nearLevels: number[] = [];
  private order: Cell[] = [];
  private readonly paths: (Path2D | null)[] = new Array(SHADE_BUCKETS).fill(null);
  private sparkRGB: [number, number, number] | null = hex(METALS[0].spark);
  private lightWant = 0;
  private lightTurn = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (!this.ok) return;
    this.build();
    this.resize();
  }

  private build() {
    const cells: Cell[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const fx = row + 1;
        const fy = col + 1;
        const g = gcd(fx, fy);
        const span = TAU / g;
        const n = Math.max(48, Math.round((PTS_PER_FREQ * (fx + fy)) / g));
        const sinFx = new Float32Array(n);
        const cosFx = new Float32Array(n);
        const cosFy = new Float32Array(n);
        const tanSin = new Float32Array(n);
        const tanCos = new Float32Array(n);
        const tanY = new Float32Array(n);
        for (let k = 0; k < n; k++) {
          const t = (span * k) / n;
          sinFx[k] = Math.sin(fx * t);
          cosFx[k] = Math.cos(fx * t);
          cosFy[k] = Math.cos(fy * t);
          tanCos[k] = fx * Math.cos(fx * t);
          tanSin[k] = -fx * Math.sin(fx * t);
          tanY[k] = -fy * Math.sin(fy * t);
        }
        const off = Math.abs(fx - fy) / Math.max(1, Math.max(ROWS, COLS) - 1);
        const lag = (row - col) * CELL_LAG;
        cells.push({
          row,
          col,
          near: 1 - off,
          lagCos: Math.cos(lag),
          lagSin: Math.sin(lag),
          shadeIdx: 0,
          sinFx,
          cosFx,
          cosFy,
          tanSin,
          tanCos,
          tanY,
        });
      }
    }
    this.cells = cells;

    this.order = [...cells].sort((a, b) => a.near - b.near);

    this.nearLevels = [...new Set(cells.map((c) => c.near))].sort((a, b) => a - b);
    for (const c of cells) c.shadeIdx = this.nearLevels.indexOf(c.near);
    if (this.ramp) this.swatches = bakeSwatches(this.ramp, this.nearLevels);
  }

  resize() {
    if (!this.ok) return;
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this.w = r.width;
    this.h = r.height;
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);

    this.pitch = Math.min(r.width / COLS, r.height / ROWS);
    this.ox = (r.width - this.pitch * COLS) / 2;
    this.oy = (r.height - this.pitch * ROWS) / 2;
    this.amp = AMP_RATIO * this.pitch;
    this.lw = Math.max(MIN_STROKE, STROKE_RATIO * this.pitch);

    if (!this.running) this.draw(detent(this.phase));
  }

  private draw(phase: number) {
    const ctx = this.ctx;
    if (!ctx || !this.pitch) return;

    const metal = this.metal;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = metal ? metal.bg : BG;
    ctx.fillRect(0, 0, this.w, this.h);

    const { amp, pitch, ox, oy } = this;
    const cp = Math.cos(phase);
    const sp = Math.sin(phase);

    if (!metal) {
      ctx.beginPath();
      for (const cell of this.cells) this.trace(ctx, cell, cp, sp);
      ctx.strokeStyle = INK;
      ctx.lineWidth = this.lw;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      return;
    }

    const ang = (LIGHT_TURN + this.lightTurn + Math.sin(phase) * LIGHT_LEAD) * TAU;
    const lx = Math.cos(ang);
    const ly = Math.sin(ang);
    const swatches = this.swatches!;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const paths = this.paths;

    for (const cell of this.order) {
      const cx = ox + pitch * (cell.col + 0.5);
      const cy = oy + pitch * (cell.row + 0.5);
      const { sinFx, cosFx, cosFy, tanSin, tanCos, tanY } = cell;
      const n = sinFx.length;
      const ccp = cp * cell.lagCos - sp * cell.lagSin;
      const csp = sp * cell.lagCos + cp * cell.lagSin;

      for (let b = 0; b < SHADE_BUCKETS; b++) paths[b] = null;

      let px = cx + amp * (sinFx[0] * ccp + cosFx[0] * csp);
      let py = cy - amp * cosFy[0];
      for (let k = 1; k <= n; k++) {
        const i = k % n;
        const x = cx + amp * (sinFx[i] * ccp + cosFx[i] * csp);
        const y = cy - amp * cosFy[i];

        const m = (k - 1 + (k % n === 0 ? 0 : 1)) % n;
        const tx = tanCos[m] * ccp + tanSin[m] * csp;
        const ty = -tanY[m];
        const inv = 1 / (Math.sqrt(tx * tx + ty * ty) || 1);
        const ux = tx * inv;
        const uy = ty * inv;

        const nDotL = -uy * lx + ux * ly;
        let tRamp = 0.5 - nDotL * 0.5;
        tRamp += (tRamp - 0.5) * HORIZON;

        const a1 = 1 - Math.abs(ux * lx + uy * ly);
        const a2 = a1 * a1;
        const a4 = a2 * a2;
        const glint = a4 * a4 * a4;

        let bIdx = Math.round(tRamp * (SHADE_BUCKETS - 1) + glint * SPARK_GAIN * SHADE_BUCKETS);
        bIdx = bIdx < 0 ? 0 : bIdx > SHADE_BUCKETS - 1 ? SHADE_BUCKETS - 1 : bIdx;

        let path = paths[bIdx];
        if (!path) {
          path = new Path2D();
          paths[bIdx] = path;
        }
        path.moveTo(px, py);
        path.lineTo(x, y);
        px = x;
        py = y;
      }

      ctx.lineWidth = this.lw * (1 - DEPTH * (1 - cell.near));
      const row = swatches[cell.shadeIdx];
      for (let b = 0; b < SHADE_BUCKETS; b++) {
        const path = paths[b];
        if (!path) continue;
        ctx.strokeStyle = row[b];
        ctx.stroke(path);
      }
    }
  }

  private trace(
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    cp: number,
    sp: number,
  ) {
    const { amp, pitch, ox, oy } = this;
    const cx = ox + pitch * (cell.col + 0.5);
    const cy = oy + pitch * (cell.row + 0.5);
    const { sinFx, cosFx, cosFy } = cell;
    const ccp = cp * cell.lagCos - sp * cell.lagSin;
    const csp = sp * cell.lagCos + cp * cell.lagSin;
    for (let k = 0; k < sinFx.length; k++) {
      const x = cx + amp * (sinFx[k] * ccp + cosFx[k] * csp);
      const y = cy - amp * cosFy[k];
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(100, now - this.last);
      this.last = now;
      this.phase = (this.phase + (dt / PERIOD_MS) * TAU) % TAU;
      this.lightTurn +=
        (this.lightWant - this.lightTurn) * (1 - Math.exp(-dt / POINTER_EASE));
      this.draw(detent(this.phase));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  setMetal(m: Metal | null) {
    this.metal = m;
    this.ramp = m ? bakeRamp(m) : null;
    this.sparkRGB = m ? hex(m.spark) : null;
    this.swatches = m && this.ramp ? bakeSwatches(this.ramp, this.nearLevels) : null;
    if (!this.running) this.draw(detent(this.phase));
  }

  setPointer(x: number | null) {
    this.lightWant = x == null ? 0 : (x - 0.5) * 2 * POINTER_TURN;
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.phase = 0;
    if (this.ok) this.draw(detent(this.phase));
  }

  destroy() {
    this.stop();
    this.cells = [];
  }
}
