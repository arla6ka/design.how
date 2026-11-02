// Flood type (https://design.how/vault/flood-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PRESETS, PEAK_SCALE, SPIN_MAX, SPIN_TAIL, HOLD_TICKS, PULL, FONT_VAR).
import {
  CYCLE_TICKS,
  DEPTH_AT_REST,
  DEPTH_SPREAD,
  EDGE_CULL,
  ENTER_RISE,
  ENTER_STAGGER,
  ENTER_TABLE,
  ENTER_TICKS,
  ENTER_TURN,
  TURN_LAG,
  ESCAPE_SPIN_MAX,
  ESCAPE_START,
  ESCAPE_TICKS,
  FALL_SPREAD,
  FALL_TABLE,
  FOCUS_DRIFT,
  FONT_WEIGHT,
  FPS,
  HOLD_STRETCH,
  HOLD_TICKS,
  LEAD_PIVOT,
  LEAD_REST,
  LEAD_START,
  LEAD_TABLE,
  LEAD_TICKS,
  MAX_CAP,
  PEAK_SCALE,
  PITCH_OVER_CAP,
  PRESETS,
  PULL,
  PULL_EASE,
  ROT_TABLE,
  SCALE_TABLE,
  SMEAR_MIN_SPEED,
  SMEAR_REACH,
  SMEAR_STEPS,
  SPIN_MAX,
  SPIN_TAIL,
  TARGET_WIDTH,
  FLOOD_SQUEEZE,
  TRACK_REST,
  TRACK_ZOOM,
  TUMBLE_MAX,
  ZOOM_START,
  ZOOM_TICKS,
  sample,
  type Preset,
} from "./params";

interface Glyph {
  ch: string;
  x: number;
  y: number;
  px: number;
  py: number;
  line: 0 | 1;
  settle: number;
  escape: number;
  tumble: number;
  turnIn: number;
  delay: number;
  spread: number;
  depth: number;
  lx: number;
  ly: number;
}

function spinDraw(max: number, tail: number, spread: number): number {
  const u = Math.random();
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * max * spread * Math.pow(u, tail);
}

interface Slot {
  g: Glyph;
  gx: number;
  gy: number;
  deg: number;
  face: number;
  sc: number;
  vx: number;
  vy: number;
}

function lineWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  track: number,
): number {
  const glyphs = [...line];
  if (!glyphs.length) return 0;
  return ctx.measureText(line).width + track * (glyphs.length - 1);
}

export class FloodType {
  ok = false;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private family = "sans-serif";
  private raf = 0;
  private running = false;

  private tick = 0;
  private last = 0;
  private dTick = 1;

  private presetIndex = 0;
  private preset: Preset = PRESETS[this.presetIndex];
  private glyphs: Glyph[] = [];
  private half = 0;
  private c1 = 0;
  private c2 = 0;
  private fontPx = 0;
  private focus = 1;

  private pxTarget = 0;
  private pyTarget = 0;
  private pxNow = 0;
  private pyNow = 0;
  private pointerIn = false;
  private waited = 0;

  private w = 0;
  private h = 0;

  private frame: Slot[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    this.ctx = ctx;
    this.ok = true;
    this.resize();
  }

  setPointer(x: number, y: number) {
    this.pxTarget = Math.max(-1, Math.min(1, x));
    this.pyTarget = Math.max(-1, Math.min(1, y));
    this.pointerIn = true;
  }

  clearPointer() {
    this.pointerIn = false;
    this.pxTarget = 0;
    this.pyTarget = 0;
  }

  setFont(family: string) {
    this.family = family;
    this.layout();
    if (!this.running) this.draw();
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout();
    if (!this.running) this.draw();
  }

  private layout() {
    const ctx = this.ctx;
    if (!ctx || !this.w) return;
    const [l1, l2] = this.preset.lines;

    const PROBE = 100;
    ctx.font = `${FONT_WEIGHT} ${PROBE}px ${this.family}`;
    const capProbe =
      ctx.measureText("H").actualBoundingBoxAscent || PROBE * 0.7;

    const probeTrack = TRACK_REST * PROBE;
    const wide = Math.max(
      lineWidth(ctx, l1, probeTrack),
      lineWidth(ctx, l2, probeTrack),
    );

    let px = (this.w * TARGET_WIDTH * PROBE) / wide;
    const capAt = (s: number) => (capProbe * s) / PROBE;
    if (capAt(px) > this.h * MAX_CAP) px = (this.h * MAX_CAP * PROBE) / capProbe;
    this.fontPx = px;

    ctx.font = `${FONT_WEIGHT} ${px}px ${this.family}`;
    const cap = capAt(px);
    const pitch = cap * PITCH_OVER_CAP;

    const b1 = -pitch / 2;
    const b2 = pitch / 2;
    const m1 = ctx.measureText(l1);
    const m2 = ctx.measureText(l2);
    const top = b1 - m1.actualBoundingBoxAscent;
    const bot = b2 + m2.actualBoundingBoxDescent;
    const mid = (top + bot) / 2;
    this.half = (bot - top) / 2;

    this.c1 = b1 + (m1.actualBoundingBoxDescent - m1.actualBoundingBoxAscent) / 2 - mid;
    this.c2 = b2 + (m2.actualBoundingBoxDescent - m2.actualBoundingBoxAscent) / 2 - mid;

    const spread = this.preset.spin;
    const glyphs: Glyph[] = [];
    const lines: [string, number, 0 | 1][] = [
      [l1, b1, 0],
      [l2, b2, 1],
    ];
    const track = TRACK_REST * px;
    for (const [line, baseline, li] of lines) {
      const total = lineWidth(ctx, line, track);
      let pen = -total / 2;
      for (const ch of line) {
        const gm = ctx.measureText(ch);
        const left = -gm.actualBoundingBoxLeft;
        const right = gm.actualBoundingBoxRight;
        const asc = gm.actualBoundingBoxAscent;
        const dsc = gm.actualBoundingBoxDescent;
        if (ch !== " ") {
          glyphs.push({
            ch,
            x: pen,
            y: baseline - mid,
            px: (left + right) / 2,
            py: (dsc - asc) / 2,
            line: li,
            settle: spinDraw(SPIN_MAX, SPIN_TAIL, spread),
            escape: spinDraw(ESCAPE_SPIN_MAX, SPIN_TAIL, spread),
            tumble: spinDraw(TUMBLE_MAX, SPIN_TAIL, spread),
            depth: Math.random() * 2 - 1,
            lx: NaN,
            ly: NaN,
            turnIn: (Math.random() < 0.5 ? -1 : 1) * ENTER_TURN,
            delay: 0,
            spread: 0,
          });
        }
        pen += gm.width + track;
      }
    }

    let maxDist = 0;
    for (const g of glyphs) maxDist = Math.max(maxDist, Math.abs(g.x + g.px));
    for (const g of glyphs) {
      const d = maxDist > 0 ? Math.abs(g.x + g.px) / maxDist : 0;
      g.delay = (1 - d) * ENTER_STAGGER;
      g.spread = maxDist > 0 ? (g.x + g.px) / maxDist : 0;
    }

    this.glyphs = glyphs;
    this.frame = glyphs.map(() => ({
      g: glyphs[0],
      gx: 0,
      gy: 0,
      deg: 0,
      face: 1,
      sc: 1,
      vx: 0,
      vy: 0,
    }));
  }

  private nextPreset() {
    if (PRESETS.length > 1) {
      let n = this.presetIndex;
      while (n === this.presetIndex)
        n = Math.floor(Math.random() * PRESETS.length);
      this.presetIndex = n;
    }
    this.preset = PRESETS[this.presetIndex];
    this.focus = Math.random() < 0.5 ? -1 : 1;
    this.layout();
  }

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.1);
      this.last = now;
      this.dTick = dt * FPS;

      const k = 1 - Math.exp(-dt / PULL_EASE);
      this.pxNow += (this.pxTarget - this.pxNow) * k;
      this.pyNow += (this.pyTarget - this.pyNow) * k;

      const holdEnd = ENTER_TICKS + ENTER_STAGGER + HOLD_TICKS - 1;
      const atHold = this.tick >= holdEnd && this.tick < ZOOM_START;
      if (this.pointerIn && atHold && this.waited < HOLD_STRETCH) {
        this.waited += this.dTick;
      } else {
        this.tick += this.dTick;
      }

      if (this.tick >= CYCLE_TICKS) {
        this.tick -= CYCLE_TICKS;
        this.waited = 0;
        this.nextPreset();
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.tick = ENTER_TICKS + ENTER_STAGGER + HOLD_TICKS / 2;
    for (const g of this.glyphs) {
      g.lx = NaN;
      g.ly = NaN;
    }
    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    if (!ctx || !this.glyphs.length) return;
    const t = this.tick;

    ctx.fillStyle = this.preset.bg;
    ctx.fillRect(0, 0, this.w, this.h);

    const zoomU = (t - ZOOM_START) / ZOOM_TICKS;
    const zoom = sample(SCALE_TABLE, zoomU);
    const rot = sample(ROT_TABLE, zoomU);
    const scale = 1 + (PEAK_SCALE - 1) * zoom;

    const lu = (t - LEAD_START) / LEAD_TICKS;
    const lead = lu >= 1 ? LEAD_REST : sample(LEAD_TABLE, lu);

    const reach = this.h / 2 + this.half * scale * (1 + DEPTH_SPREAD);
    const drop = sample(FALL_TABLE, (t - ESCAPE_START) / ESCAPE_TICKS);
    const fall = drop * reach;

    const cx = this.w / 2;
    const cy = this.h / 2;

    const trackNow = TRACK_REST + (TRACK_ZOOM - TRACK_REST) * zoom;
    const trackDelta = (trackNow - TRACK_REST) * this.fontPx;
    const squeeze = 1 + FLOOD_SQUEEZE * zoom;

    const focusX = this.focus * FOCUS_DRIFT * this.w * zoom;

    const leanAmt = (1 - zoom) * PULL;
    const leanX = this.pxNow * leanAmt * this.w;
    const leanY = this.pyNow * leanAmt * this.h;

    const centreMid = (this.c1 + this.c2) / 2;
    const pivot = centreMid + LEAD_PIVOT * (this.c2 - centreMid);
    const open = lead - 1;
    const shift = [(this.c1 - pivot) * open, (this.c2 - pivot) * open];

    ctx.fillStyle = this.preset.ink;
    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.family}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const draws = this.frame;
    let n = 0;

    for (const g of this.glyphs) {
      const eu = (t - g.delay) / ENTER_TICKS;
      const arrive = sample(ENTER_TABLE, eu);

      const turned = Math.pow(Math.max(arrive, 0), TURN_LAG);
      const yaw = g.turnIn * (1 - turned) + g.tumble * drop;
      const face = Math.cos((yaw * Math.PI) / 180);
      if (Math.abs(face) < EDGE_CULL) continue;

      const ly = g.y + shift[g.line];

      const dx = g.spread * (trackDelta * 4 + FALL_SPREAD * drop * this.w);

      const depthNow = DEPTH_AT_REST + (1 - DEPTH_AT_REST) * zoom;
      const sc = scale * (1 + g.depth * DEPTH_SPREAD * depthNow);

      const par = 1 + g.depth * 0.6;
      const gx =
        cx + (g.x + g.px) * scale * squeeze + dx + focusX + leanX * par;
      const rise = (1 - arrive) * ENTER_RISE * this.half * scale;
      const gy = cy + (ly + g.py) * scale + fall - rise + leanY * par;

      const deg = g.settle * rot + g.escape * drop;

      const vx = Number.isNaN(g.lx) ? 0 : gx - g.lx;
      const vy = Number.isNaN(g.ly) ? 0 : gy - g.ly;
      g.lx = gx;
      g.ly = gy;

      const slot = draws[n++];
      slot.g = g;
      slot.gx = gx;
      slot.gy = gy;
      slot.deg = deg;
      slot.face = face;
      slot.sc = sc;
      slot.vx = vx;
      slot.vy = vy;
    }

    for (let i = 1; i < n; i++) {
      const s0 = draws[i];
      const k = s0.sc + Math.abs(s0.face) * 0.001;
      let j = i - 1;
      while (j >= 0 && draws[j].sc + Math.abs(draws[j].face) * 0.001 > k) {
        draws[j + 1] = draws[j];
        j--;
      }
      draws[j + 1] = s0;
    }

    const perTick = this.dTick > 1e-4 ? this.dTick : 1;
    const minSpeed = SMEAR_MIN_SPEED * this.w * perTick;
    for (let i = 0; i < n; i++) {
      const d = draws[i];

      const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (speed > minSpeed) {
        for (let k = SMEAR_STEPS; k >= 1; k--) {
          const back = (k / SMEAR_STEPS) * SMEAR_REACH;
          ctx.save();
          ctx.translate(d.gx - d.vx * back, d.gy - d.vy * back);
          ctx.rotate((d.deg * Math.PI) / 180);
          ctx.scale(d.sc * d.face, d.sc);
          ctx.fillText(d.g.ch, -d.g.px, -d.g.py);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(d.gx, d.gy);
      ctx.rotate((d.deg * Math.PI) / 180);
      ctx.scale(d.sc * d.face, d.sc);
      ctx.fillText(d.g.ch, -d.g.px, -d.g.py);
      ctx.restore();
    }
  }

  destroy() {
    this.stop();
    this.glyphs = [];
  }
}
