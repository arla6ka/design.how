// Loud burst (https://design.how/vault/loud-burst), engine.ts.
// FIXED. Change the VARIABLE values in params instead (SENTENCES, PAPER, INK, BODY_TINT, FPS, FLECK_COUNT, FONT_CSS).
import {
  ARRIVAL_STEP,
  ARRIVE_SCALE_FIRST,
  ARRIVE_SCALE_REST,
  BASELINE_FRAC,
  BLUR_LAST,
  BLUR_MOST,
  BODY_TINT,
  BURST_TICK,
  DART_BELLY,
  DART_SPIKE_MIN,
  DART_WOBBLE,
  FINALE_SPIKE,
  FLECK_COUNT,
  FLECK_DELAY_MAX,
  FLECK_FADE_LEN,
  FLECK_FADE_START,
  FLECK_R_MAX,
  FLECK_R_MIN,
  FLECK_SPD_MAX,
  FLECK_SPD_MIN,
  FONT_FRAC,
  FONT_WEIGHT,
  FPS,
  GAP_EM,
  GLIDE_RATE,
  INHALE_LIFT,
  INHALE_SCALE,
  INHALE_TICKS,
  INK,
  KICK_BASE,
  KICK_JIT,
  KICK_ZOOM,
  LETTER_DRIFT,
  MORPH_LEN,
  MORPH_STAGGER,
  ORIGIN_X,
  ORIGIN_Y,
  PAPER,
  RECENTER,
  REF_BURST,
  REF_H,
  RING_ALPHA,
  RING_R0,
  RING_TICKS,
  RING_V,
  RING_WIDTH,
  SCALE_RETAIN,
  SEED,
  SEG_BANDS,
  SEG_EXIT,
  SEG_GAP_MUL,
  SEG_MAX_PER_LETTER,
  SEG_MIN_RUN_EM,
  SENTENCES,
  SHAKE_DX,
  SHAKE_DY,
  SHAKE_END,
  SHAKE_OMEGA,
  SHAKE_ROT,
  SHAKE_TICK,
  SLIDE_EM,
  SLOT_PROG_JIT,
  STILL_TICK,
  STREAK_ALPHA,
  STREAK_LEN,
  STREAK_WIDTH,
  STROKE_OFFSET,
  THROW_BALLISTIC,
  THROW_BALLISTIC_AT,
  THROW_EXP,
  THROW_PX,
  THUMP_EXCESS,
  THUMP_SQUASH,
  THUMP_STRETCH,
  TICKS,
  TINT_LEN,
  TINT_TICK,
  TRAIL_ALPHA,
  TRAIL_DT,
  WORD_FADE_END,
  WORD_FADE_START,
  ZOOM_EXP,
  ZOOM_MAX,
  type SentenceSpec,
} from "./params";
import { GROUPS, groupAt } from "./strokes";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const rad = (d: number) => (d * Math.PI) / 180;

type Rgb = [number, number, number];

function hexRgb(hex: string): Rgb {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
const INK_RGB = hexRgb(INK);

function hueOf([r, g, b]: Rgb): number {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return 0;
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) % 360 + 360) % 360;
}

const circDist = (a: number, b: number) => {
  const d = Math.abs(((a % 360) + 360) % 360 - ((b % 360) + 360) % 360);
  return Math.min(d, 360 - d);
};

const mixArr = (a: Rgb, b: Rgb, u: number): Rgb => [
  lerp(a[0], b[0], u),
  lerp(a[1], b[1], u),
  lerp(a[2], b[2], u),
];

const rgbStr = (c: Rgb): string =>
  `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

const mixRgb = (a: Rgb, b: Rgb, u: number): string => rgbStr(mixArr(a, b, u));

interface DashJitter {
  along: number;
  lenMul: number;
  angJit: number;
  bend: number;
}

interface SegJitter {
  along: number;
  lenMul: number;
  angJit: number;
  bend: number;
  delay: number;
  sk: number;
}

interface Seg {
  bx: number;
  by: number;
  blen: number;
  bwid: number;
  letter: number;
  gi: number;
  slot: number;
  ji: number;
}

interface SegState {
  tailX: number;
  tailY: number;
  bendX: number;
  bendY: number;
  headX: number;
  headY: number;
  w: number;
  tailC: Rgb;
  headC: Rgb;
  alpha: number;
  e: number;
}

interface Fleck {
  ang: number;
  spd: number;
  r: number;
  color: string;
  delay: number;
}

const SEG_POOL = 96;

export class LoudBurst {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private lastTick = -1;
  private font: string;

  private si = 0;
  private sentence: SentenceSpec = SENTENCES[0];
  private words: string[] = SENTENCES[0].words;
  private burstIdx = SENTENCES[0].burst;
  private arrivals: number[] = [];
  private burstRgb: Rgb = [0, 0, 0];
  private bodyRgb: Rgb = [0, 0, 0];
  private bodyCss = "";
  private journeys: [Rgb, Rgb][] = [];

  private fontPx = 0;
  private baseline = 0;
  private gap = 0;
  private wordW: number[] = [];
  private slotX: number[] = [];
  private shift: number[] = [];
  private landAge: number[] = [];
  private originX = 0;
  private originY = 0;
  private refS = 1;

  private wordSprites: (HTMLCanvasElement | null)[] = [];
  private letterX: number[] = [];
  private letterW: number[] = [];
  private segs: Seg[] = [];
  private segCount: number[] = [];
  private segsReady = false;

  private dashJitter: DashJitter[][] = [];
  private segJitter: SegJitter[] = [];
  private flecks: Fleck[] = [];
  private kick: [number, number][] = KICK_BASE;

  private scratch: HTMLCanvasElement[] = [];

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    fontFamily?: string,
  ) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    this.font = fontFamily ?? "sans-serif";
    this.applySentence(0);
    if (this.ok) this.resize();
  }

  private applySentence(i: number) {
    this.si = i;
    this.sentence = SENTENCES[i];
    this.words = this.sentence.words;
    this.burstIdx = this.sentence.burst;
    this.arrivals = this.words.map((_, k) => k * ARRIVAL_STEP);

    const th = this.sentence.theme;
    const inkRgbs = th.inks.map(hexRgb);
    const inkHues = inkRgbs.map(hueOf);
    this.burstRgb = hexRgb(th.burst);
    this.bodyRgb = mixArr(INK_RGB, hexRgb(th.body), BODY_TINT);
    this.bodyCss = rgbStr(this.bodyRgb);
    const nearest = (h: number, excl = -1): number => {
      let best = excl === 0 ? 1 : 0;
      for (let k = 0; k < inkHues.length; k++) {
        if (k === excl) continue;
        if (circDist(h, inkHues[k]) < circDist(h, inkHues[best])) best = k;
      }
      return best;
    };
    this.journeys = GROUPS.map((g) => {
      const h0 = g.keys[0].hue;
      const h1 = g.keys[g.keys.length - 1].hue;
      const a = nearest(h0);
      let b = nearest(h1);
      if (b === a && circDist(h0, h1) > 25) b = nearest(h1, a);
      return [inkRgbs[a], inkRgbs[b]];
    });

    const rnd = mulberry32((SEED ^ Math.imul(i, 0x9e3779b9)) >>> 0);
    this.dashJitter = GROUPS.map((g) =>
      Array.from({ length: g.count }, () => ({
        along: (rnd() - 0.5) * 24,
        lenMul: 0.75 + rnd() * 0.3,
        angJit: (rnd() - 0.5) * 6,
        bend: (rnd() - 0.5) * 0.24,
      })),
    );
    this.segJitter = Array.from({ length: SEG_POOL }, () => ({
      along: (rnd() - 0.5) * 20,
      lenMul: 0.75 + rnd() * 0.3,
      angJit: (rnd() - 0.5) * 6,
      bend: (rnd() - 0.5) * 0.24,
      delay: rnd(),
      sk: 1.1 + rnd() * 0.8,
    }));
    this.flecks = Array.from({ length: FLECK_COUNT }, () => ({
      ang: rnd() * Math.PI * 2,
      spd: FLECK_SPD_MIN + rnd() * (FLECK_SPD_MAX - FLECK_SPD_MIN),
      r: FLECK_R_MIN + rnd() * (FLECK_R_MAX - FLECK_R_MIN),
      color: th.inks[Math.floor(rnd() * th.inks.length)],
      delay: rnd() * FLECK_DELAY_MAX,
    }));
    this.kick = KICK_BASE.map(([kx, ky]) => [
      kx + (rnd() - 0.5) * KICK_JIT,
      ky + (rnd() - 0.5) * KICK_JIT,
    ]) as [number, number][];

    if (this.fontPx > 0) this.layoutSentence();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.round(r.width * this.dpr));
    c.height = Math.max(1, Math.round(r.height * this.dpr));
    this.buildLayout();
    this.lastTick = -1;
    if (!this.running) this.renderStill();
  }

  private buildLayout() {
    const H = this.canvas.height;
    this.refS = H / REF_H;
    this.fontPx = FONT_FRAC * H;
    this.baseline = BASELINE_FRAC * H;
    this.gap = GAP_EM * this.fontPx;
    this.layoutSentence();
  }

  private arriveScale(i: number): number {
    return i === 0 ? ARRIVE_SCALE_FIRST : ARRIVE_SCALE_REST;
  }

  private layoutSentence() {
    const ctx = this.ctx!;
    const W = this.canvas.width;

    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.font}`;
    this.wordW = this.words.map((w) => ctx.measureText(w).width);
    const lineW =
      this.wordW.reduce((a, b) => a + b, 0) + this.gap * (this.words.length - 1);
    let x = (W - lineW) / 2;
    this.slotX = this.wordW.map((w) => {
      const sx = x;
      x += w + this.gap;
      return sx;
    });

    this.originX = this.slotX[this.burstIdx] + this.wordW[this.burstIdx] / 2;
    this.originY = this.baseline - 0.35 * this.fontPx;

    const word = this.words[this.burstIdx];
    this.letterX = [];
    this.letterW = [];
    let lx = 0;
    for (const ch of word) {
      const w = ctx.measureText(ch).width;
      this.letterX.push(lx);
      this.letterW.push(w);
      lx += w;
    }

    this.shift = [];
    const s0 = (W - this.wordW[0]) / 2 - this.slotX[0];
    for (let t = 0; t < TICKS; t++) {
      if (t < this.arrivals[1]) {
        this.shift.push(s0);
        continue;
      }
      const i = Math.round((t - this.arrivals[1]) * GLIDE_RATE);
      this.shift.push(s0 * (i < RECENTER.length ? RECENTER[i] : 0));
    }

    this.landAge = this.words.map((_, i) => {
      const settle = Math.ceil(
        Math.log(THUMP_EXCESS / (this.arriveScale(i) - 1)) /
          Math.log(SCALE_RETAIN),
      );
      return i === this.words.length - 1
        ? Math.max(settle, BLUR_LAST.length - 1)
        : settle;
    });

    this.wordSprites = this.words.map((w) => {
      const pad = Math.ceil(this.fontPx * 0.35);
      const wpx = Math.ceil(ctx.measureText(w).width);
      const sp = document.createElement("canvas");
      sp.width = (wpx + pad * 2) * 2;
      sp.height = Math.ceil(this.fontPx * 1.6) * 2;
      const sc = sp.getContext("2d");
      if (!sc) return null;
      sc.scale(2, 2);
      sc.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.font}`;
      sc.fillStyle = this.bodyCss;
      sc.textBaseline = "alphabetic";
      sc.fillText(w, pad, this.fontPx * 1.1);
      return sp;
    });
    this.segs = [];
    this.segCount = [];
    this.segsReady = false;
  }

  private shakeAmp(t: number): number {
    if (t < SHAKE_TICK) return 0;
    return clamp01((t - SHAKE_TICK) / (SHAKE_END - SHAKE_TICK)) ** 2;
  }

  private tintProgress(t: number): number {
    if (t < TINT_TICK) return 0;
    const u = clamp01((t - TINT_TICK) / TINT_LEN);
    return 1 - (1 - u) * (1 - u);
  }

  private wordFill(t: number): string {
    const p = this.tintProgress(t);
    if (p <= 0) return this.bodyCss;
    return mixRgb(this.bodyRgb, this.burstRgb, p);
  }

  private journeyAt(gi: number, u: number): Rgb {
    const [a, b] = this.journeys[gi];
    return mixArr(a, b, clamp01(u));
  }

  private letterJitter(i: number, t: number): [number, number, number] {
    const A = this.shakeAmp(t);
    if (A <= 0) return [0, 0, 0];
    const [ddx, ddy, drot] = LETTER_DRIFT[i % LETTER_DRIFT.length];
    const ph = i * 2.1;
    const s = this.refS;
    const wob = Math.sin(t * SHAKE_OMEGA + ph);
    const wob2 = Math.sin(t * SHAKE_OMEGA * 0.63 + ph * 1.7);
    return [
      A * (ddx + wob2 * SHAKE_DX) * s,
      A * (ddy + wob * SHAKE_DY) * s,
      rad(A * (drot + wob * SHAKE_ROT * 0.45)),
    ];
  }

  private scratchAt(idx: number, w: number, h: number): HTMLCanvasElement {
    let c = this.scratch[idx];
    if (!c) {
      c = document.createElement("canvas");
      this.scratch[idx] = c;
    }
    c.width = w;
    c.height = h;
    return c;
  }

  private drawDart(
    tailX: number,
    tailY: number,
    bendX: number,
    bendY: number,
    headX: number,
    headY: number,
    wMax: number,
    spike: number,
    skew: number,
    wobPhase: number,
    tailC: Rgb,
    headC: Rgb,
    alpha: number,
  ) {
    const ctx = this.ctx!;
    const span = Math.hypot(headX - tailX, headY - tailY);
    if (span < 1) return;
    wMax = Math.min(wMax, span * 0.32);
    const N = 10;
    const xs: number[] = [];
    const ys: number[] = [];
    const ws: number[] = [];
    const pxs: number[] = [];
    const pys: number[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const v = 1 - u;
      xs.push(v * v * tailX + 2 * v * u * bendX + u * u * headX);
      ys.push(v * v * tailY + 2 * v * u * bendY + u * u * headY);
      const tx = 2 * v * (bendX - tailX) + 2 * u * (headX - bendX);
      const ty = 2 * v * (bendY - tailY) + 2 * u * (headY - bendY);
      const n = Math.hypot(tx, ty) || 1;
      pxs.push(-ty / n);
      pys.push(tx / n);
      const prof = Math.sin(Math.PI * u ** skew) ** DART_BELLY;
      let w = wMax * lerp(1, prof, spike);
      const wob = DART_WOBBLE * Math.min(1, span / (wMax * 5));
      w *= 1 + wob * spike * Math.sin(u * 13 + wobPhase);
      ws.push(Math.max(0, w));
    }
    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
    grad.addColorStop(0, rgbStr(tailC));
    grad.addColorStop(1, rgbStr(headC));
    ctx.fillStyle = grad;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(xs[0] + (pxs[0] * ws[0]) / 2, ys[0] + (pys[0] * ws[0]) / 2);
    for (let i = 1; i <= N; i++) {
      ctx.lineTo(xs[i] + (pxs[i] * ws[i]) / 2, ys[i] + (pys[i] * ws[i]) / 2);
    }
    for (let i = N; i >= 0; i--) {
      ctx.lineTo(xs[i] - (pxs[i] * ws[i]) / 2, ys[i] - (pys[i] * ws[i]) / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private blurDraw(
    sp: HTMLCanvasElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    sigma: number,
  ) {
    const ctx = this.ctx!;
    if (sigma < 0.6) {
      ctx.drawImage(sp, dx, dy, dw, dh);
      return;
    }
    const k = sigma < 2 ? 1 : sigma < 5 ? 2 : 3;
    let src: HTMLCanvasElement = sp;
    let sw = sp.width;
    let sh = sp.height;
    let si = 0;
    for (let i = 0; i < k; i++) {
      const step = this.scratchAt(
        si++,
        Math.max(1, Math.round(sw / 2)),
        Math.max(1, Math.round(sh / 2)),
      );
      const sc2 = step.getContext("2d");
      if (!sc2) break;
      sc2.imageSmoothingEnabled = true;
      sc2.drawImage(src, 0, 0, sw, sh, 0, 0, step.width, step.height);
      src = step;
      sw = step.width;
      sh = step.height;
    }
    for (let i = 0; i < k - 1; i++) {
      const step = this.scratchAt(si++, sw * 2, sh * 2);
      const sc2 = step.getContext("2d");
      if (!sc2) break;
      sc2.imageSmoothingEnabled = true;
      sc2.drawImage(src, 0, 0, sw, sh, 0, 0, step.width, step.height);
      src = step;
      sw = step.width;
      sh = step.height;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh);
  }

  private rasterBurstWord(
    fill: (i: number) => string,
    t: number,
    scratchIdx: number,
  ): { sp: HTMLCanvasElement | null; pad: number; base: number } {
    const pad = Math.ceil(this.fontPx * 0.5);
    const w = Math.ceil(
      this.letterX[this.letterX.length - 1] + this.letterW[this.letterW.length - 1],
    );
    const sp = this.scratchAt(scratchIdx, w + pad * 2, Math.ceil(this.fontPx * 1.9));
    const sc = sp.getContext("2d", { willReadFrequently: true });
    const base = this.fontPx * 1.15;
    if (!sc) return { sp: null, pad, base };
    sc.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.font}`;
    sc.textBaseline = "alphabetic";
    const word = this.words[this.burstIdx];
    for (let i = 0; i < word.length; i++) {
      const [jx, jy, jr] = this.letterJitter(i, t);
      const cx = pad + this.letterX[i] + this.letterW[i] / 2;
      const cy = base - this.fontPx * 0.35;
      sc.save();
      sc.translate(cx + jx, cy + jy);
      sc.rotate(jr);
      sc.fillStyle = fill(i);
      sc.fillText(word[i], -this.letterW[i] / 2, this.fontPx * 0.35);
      sc.restore();
    }
    return { sp, pad, base };
  }

  private captureSegs() {
    this.segsReady = true;
    this.segs = [];
    this.segCount = GROUPS.map(() => 0);
    const capT = BURST_TICK - 1;
    const { sp, pad, base } = this.rasterBurstWord(() => "#000", capT, 5);
    if (!sp) return;
    const sc = sp.getContext("2d", { willReadFrequently: true });
    if (!sc) return;

    let img: ImageData;
    try {
      img = sc.getImageData(0, 0, sp.width, sp.height);
    } catch {
      return;
    }
    const alphaAt = (x: number, y: number) => img.data[(y * sp.width + x) * 4 + 3];

    let minY = sp.height;
    let maxY = 0;
    for (let y = 0; y < sp.height; y++) {
      for (let x = 0; x < sp.width; x += 2) {
        if (alphaAt(x, y) > 96) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          break;
        }
      }
    }
    if (maxY <= minY) return;
    const bandH = Math.max(2, (maxY - minY + 1) / SEG_BANDS);
    const minRun = Math.max(2, this.fontPx * SEG_MIN_RUN_EM);
    const spriteX = this.slotX[this.burstIdx] + this.shift[capT] - pad;
    const spriteTop = this.baseline - base;
    const word = this.words[this.burstIdx];

    const perLetter: Seg[][] = word.split("").map(() => []);
    for (let b = 0; b < SEG_BANDS; b++) {
      const y = Math.min(sp.height - 1, Math.round(minY + (b + 0.5) * bandH));
      let runStart = -1;
      let gapRun = 0;
      const flush = (endX: number) => {
        if (runStart < 0) return;
        const len = endX - runStart;
        if (len >= minRun) {
          const rcx = runStart + len / 2;
          let li = 0;
          while (
            li < word.length - 1 &&
            rcx - pad > this.letterX[li] + this.letterW[li]
          )
            li++;
          perLetter[li].push({
            bx: spriteX + rcx,
            by: spriteTop + y,
            blen: len,
            bwid: bandH * 0.92,
            letter: li,
            gi: 0,
            slot: 0,
            ji: 0,
          });
        }
        runStart = -1;
        gapRun = 0;
      };
      for (let x = 0; x < sp.width; x++) {
        if (alphaAt(x, y) > 96) {
          if (runStart < 0) runStart = x;
          gapRun = 0;
        } else if (runStart >= 0 && ++gapRun > 3) {
          flush(x - gapRun + 1);
        }
      }
      flush(sp.width);
    }

    for (let i = 0; i < perLetter.length; i++) {
      const list = perLetter[i];
      if (list.length > SEG_MAX_PER_LETTER) {
        const step = list.length / SEG_MAX_PER_LETTER;
        perLetter[i] = Array.from(
          { length: SEG_MAX_PER_LETTER },
          (_, k) => list[Math.floor(k * step)],
        );
      }
    }
    const segs = perLetter.flat();
    if (!segs.length) return;

    const burstGroups = GROUPS.map((g, gi) => ({ g, gi })).filter(
      ({ g }) => g.count > 1,
    );
    const dirs = burstGroups.map(({ g }) => {
      const k = g.keys[0];
      const dx = k.x - ORIGIN_X;
      const dy = k.y - ORIGIN_Y;
      const n = Math.hypot(dx, dy) || 1;
      return [dx / n, dy / n];
    });
    const cap = Math.ceil(segs.length / burstGroups.length) + 1;
    const counts = burstGroups.map(() => 0);
    for (const seg of segs) {
      const ox = (seg.bx - this.originX) / this.refS;
      const oy = (seg.by - this.originY) / this.refS;
      const n = Math.hypot(ox, oy) || 1;
      let best = 0;
      let bestScore = -Infinity;
      for (let k = 0; k < burstGroups.length; k++) {
        if (counts[k] >= cap) continue;
        const score = (ox / n) * dirs[k][0] + (oy / n) * dirs[k][1];
        if (score > bestScore) {
          bestScore = score;
          best = k;
        }
      }
      counts[best]++;
      seg.gi = burstGroups[best].gi;
    }
    for (let k = 0; k < burstGroups.length; k++) {
      const { g, gi } = burstGroups[k];
      const ang = rad(g.keys[0].ang);
      const px = -Math.sin(ang);
      const py = Math.cos(ang);
      const members = segs
        .filter((sg) => sg.gi === gi)
        .sort((a, b) => (a.bx * px + a.by * py) - (b.bx * px + b.by * py));
      members.forEach((sg, idx) => {
        sg.slot = idx;
      });
      this.segCount[gi] = members.length;
    }
    segs.forEach((sg, idx) => {
      sg.ji = idx % SEG_POOL;
    });
    this.segs = segs;
  }

  private render(t: number) {
    const ctx = this.ctx!;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
    if (t === BURST_TICK || t === BURST_TICK + 1) {
      const [kx, ky] = this.kick[t - BURST_TICK];
      ctx.translate(kx * this.refS, ky * this.refS);
      ctx.translate(this.originX, this.originY);
      ctx.scale(KICK_ZOOM, KICK_ZOOM);
      ctx.translate(-this.originX, -this.originY);
    }
    ctx.font = `${FONT_WEIGHT} ${this.fontPx}px ${this.font}`;
    ctx.textBaseline = "alphabetic";

    if (t < BURST_TICK) this.renderLine(t);
    else this.renderBurstWords(t);
    this.renderRing(t);
    this.renderFlecks(t);
    this.renderStrokes(t);
  }

  private renderLine(t: number) {
    const ctx = this.ctx!;
    const s = this.refS;
    const shift = this.shift[t];
    for (let i = 0; i < this.words.length; i++) {
      if (this.arrivals[i] > t) continue;
      const age = t - this.arrivals[i];

      if (i === this.burstIdx && t >= TINT_TICK) {
        const fill = this.wordFill(t);
        const wordCx = this.slotX[i] + shift + this.wordW[i] / 2;
        const wordCy = this.baseline - this.fontPx * 0.35;
        const wI =
          t >= BURST_TICK - INHALE_TICKS
            ? (t - (BURST_TICK - INHALE_TICKS) + 1) / INHALE_TICKS
            : 0;
        ctx.save();
        if (wI > 0) {
          const k = 1 + INHALE_SCALE * wI;
          ctx.translate(wordCx, wordCy - INHALE_LIFT * wI * s);
          ctx.scale(k, k);
          ctx.translate(-wordCx, -wordCy);
        }
        for (let li = 0; li < this.words[i].length; li++) {
          const [jx, jy, jr] = this.letterJitter(li, t);
          const cx =
            this.slotX[i] + shift + this.letterX[li] + this.letterW[li] / 2;
          const cy = this.baseline - this.fontPx * 0.35;
          ctx.save();
          ctx.translate(cx + jx, cy + jy);
          ctx.rotate(jr);
          ctx.fillStyle = fill;
          ctx.fillText(
            this.words[i][li],
            -this.letterW[li] / 2,
            this.fontPx * 0.35,
          );
          ctx.restore();
        }
        ctx.restore();
        continue;
      }

      const scale = 1 + (this.arriveScale(i) - 1) * SCALE_RETAIN ** age;
      let sqX = 1;
      let sqY = 1;
      if (age === this.landAge[i]) {
        sqX = THUMP_STRETCH;
        sqY = THUMP_SQUASH;
      } else if (age === this.landAge[i] + 1) {
        sqX = 1 + (THUMP_STRETCH - 1) * 0.4;
        sqY = 1 - (1 - THUMP_SQUASH) * 0.4;
      }
      const blurTable = i === this.words.length - 1 ? BLUR_LAST : BLUR_MOST;
      const sigma = (blurTable[Math.min(age, blurTable.length - 1)] ?? 0) * s;
      const sp = this.wordSprites[i];
      if (!sp) continue;
      const dw = (sp.width / 2) * scale * sqX;
      const dh = (sp.height / 2) * scale * sqY;
      const slide = i === 0 ? 0 : SLIDE_EM * this.fontPx * SCALE_RETAIN ** age;
      const cx = this.slotX[i] + shift + slide + this.wordW[i] / 2;
      const cy = this.baseline - this.fontPx * 0.35;
      this.blurDraw(sp, cx - dw / 2, cy - dh * (0.75 / 1.6), dw, dh, sigma);
    }
  }

  private renderBurstWords(t: number) {
    const ctx = this.ctx!;
    const s = this.refS;
    const u = clamp01((t - (BURST_TICK - 1)) / 8);
    const zoom = 1 + ZOOM_MAX * u ** ZOOM_EXP;
    let throwPx = THROW_PX * s * u ** THROW_EXP;
    if (t > THROW_BALLISTIC_AT) {
      throwPx *= THROW_BALLISTIC ** (t - THROW_BALLISTIC_AT);
    }
    const alpha =
      1 - clamp01((t - WORD_FADE_START) / (WORD_FADE_END - WORD_FADE_START));

    const shift = this.shift[BURST_TICK - 1];
    for (let i = 0; i < this.words.length; i++) {
      if (i === this.burstIdx) continue;
      const side = i < this.burstIdx ? -1 : 1;
      const cx = this.slotX[i] + shift + this.wordW[i] / 2;
      const cy = this.baseline - this.fontPx * 0.35;
      const zx = this.originX + (cx - this.originX) * zoom + side * throwPx;
      const zy = this.originY + (cy - this.originY) * zoom;
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(zx, zy);
        ctx.scale(zoom, zoom);
        ctx.fillStyle = this.bodyCss;
        ctx.fillText(this.words[i], -this.wordW[i] / 2, this.fontPx * 0.35);
        ctx.restore();
      }
      const sw = clamp01((t - (WORD_FADE_START - 1)) / 1.5);
      if (sw > 0 && t < WORD_FADE_END + 1) {
        const sl = (0.4 + 0.6 * sw) * STREAK_LEN * s;
        for (let k = 0; k < 2; k++) {
          const sy = zy - this.fontPx * 0.2 + ((i * 37 + k * 53) % 5 - 2) * 3 * s;
          const ix = zx - side * sl;
          this.drawDart(
            ix,
            sy,
            (ix + zx) / 2,
            sy,
            zx,
            sy,
            STREAK_WIDTH * 2 * s,
            1,
            1.4,
            i * 2.3 + k,
            this.bodyRgb,
            this.bodyRgb,
            STREAK_ALPHA * sw * (k === 0 ? 1 : 0.6),
          );
        }
      }
    }

    if (!this.segsReady) this.captureSegs();
    if (!this.segs.length) {
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.wordFill(BURST_TICK - 1);
        ctx.fillText(
          this.words[this.burstIdx],
          this.slotX[this.burstIdx] + shift,
          this.baseline,
        );
        ctx.restore();
      }
      return;
    }
    this.renderSegs(t);
  }

  private segStateAt(seg: Seg, tR: number): SegState | null {
    const g = GROUPS[seg.gi];
    const keys = g.keys;
    const tEnd = keys[keys.length - 1].t;
    const over = tR - tEnd;
    if (over > SEG_EXIT) return null;
    const st = groupAt(g, Math.min(Math.max(tR, keys[0].t), tEnd));
    if (!st) return null;
    let exitMul = 1;
    if (over > 0) {
      const ka = keys[keys.length - 2];
      const kb = keys[keys.length - 1];
      const dt = kb.t - ka.t || 1;
      st.x += ((kb.x - ka.x) / dt) * over;
      st.y += ((kb.y - ka.y) / dt) * over;
      exitMul = (1 - over / SEG_EXIT) ** 2;
    }
    const j = this.segJitter[seg.ji];
    const t0 = Math.max(REF_BURST, keys[0].t);
    const uRaw = clamp01((tR - t0 - j.delay * MORPH_STAGGER) / MORPH_LEN);
    const e = uRaw * uRaw * (3 - 2 * uRaw);

    const s = this.refS;
    const cxOff = this.originX - ORIGIN_X * s;
    const cyOff = this.originY - ORIGIN_Y * s;
    const n = this.segCount[seg.gi] || 1;
    const pxp = -Math.sin(rad(st.ang));
    const pyp = Math.cos(rad(st.ang));
    const spreadMul = Math.sqrt(Math.max(1, st.len / keys[0].len));
    const gapPx = g.gap * (g.count / n) * SEG_GAP_MUL;
    const off = (seg.slot - (n - 1) / 2) * gapPx * spreadMul;
    const tx = (st.x + pxp * off + Math.cos(rad(st.ang)) * j.along) * s + cxOff;
    const ty = (st.y + pyp * off + Math.sin(rad(st.ang)) * j.along) * s + cyOff;
    const tlen = st.len * j.lenMul * s;
    const twid = st.wid * s * (0.5 + 0.2 * j.lenMul);

    const x = lerp(seg.bx, tx, e);
    const y = lerp(seg.by, ty, e);
    const len = Math.max(1, lerp(seg.blen, tlen, e));
    const wid = Math.max(1, lerp(seg.bwid, twid, e));
    const ang = lerp(0, st.ang + j.angJit, e);
    const alpha = st.alpha * exitMul;
    if (alpha <= 0) return null;

    const dirx = Math.cos(rad(ang));
    const diry = Math.sin(rad(ang));
    const half = len / 2;
    const bendAmt = j.bend * half * e;

    const life = tEnd - keys[0].t || 1;
    const prog =
      clamp01((tR - keys[0].t) / life) + ((seg.slot % 3) - 1) * SLOT_PROG_JIT;
    const headC = mixArr(this.burstRgb, this.journeyAt(seg.gi, prog), e);
    const tailC = mixArr(this.burstRgb, this.journeyAt(seg.gi, prog - 0.18), e);

    return {
      tailX: x - dirx * half,
      tailY: y - diry * half,
      bendX: x + -diry * bendAmt,
      bendY: y + dirx * bendAmt,
      headX: x + dirx * half,
      headY: y + diry * half,
      w: wid,
      tailC,
      headC,
      alpha,
      e,
    };
  }

  private renderSegs(t: number) {
    const tR = t + STROKE_OFFSET;
    for (const seg of this.segs) {
      const main = this.segStateAt(seg, tR);
      if (!main) continue;
      const j = this.segJitter[seg.ji];
      const phase = seg.ji * 1.7;
      if (main.e > 0.3) {
        const tr = this.segStateAt(seg, tR - TRAIL_DT);
        if (tr) {
          this.drawDart(
            tr.tailX,
            tr.tailY,
            tr.bendX,
            tr.bendY,
            tr.headX,
            tr.headY,
            tr.w * 0.8,
            DART_SPIKE_MIN + (1 - DART_SPIKE_MIN) * tr.e,
            j.sk,
            phase,
            tr.tailC,
            tr.headC,
            tr.alpha * TRAIL_ALPHA,
          );
        }
      }
      this.drawDart(
        main.tailX,
        main.tailY,
        main.bendX,
        main.bendY,
        main.headX,
        main.headY,
        main.w,
        DART_SPIKE_MIN + (1 - DART_SPIKE_MIN) * main.e,
        j.sk,
        phase,
        main.tailC,
        main.headC,
        main.alpha,
      );
    }
  }

  private renderRing(t: number) {
    const age = t - BURST_TICK;
    if (age < 0 || age >= RING_TICKS) return;
    const ctx = this.ctx!;
    const s = this.refS;
    const r = (RING_R0 + RING_V * age) * s;
    ctx.save();
    ctx.globalAlpha = RING_ALPHA * (1 - age / RING_TICKS);
    ctx.strokeStyle = rgbStr(this.burstRgb);
    ctx.lineWidth = Math.max(1.2, RING_WIDTH * s);
    ctx.beginPath();
    ctx.ellipse(this.originX, this.originY, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderFlecks(t: number) {
    if (t < BURST_TICK) return;
    const ctx = this.ctx!;
    const s = this.refS;
    const fade = 1 - clamp01((t - FLECK_FADE_START) / FLECK_FADE_LEN);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    for (const fl of this.flecks) {
      const a = t - BURST_TICK + 1 - fl.delay;
      if (a <= 0) continue;
      const d = fl.spd * (a + 0.25 * a * a) * s;
      const x = this.originX + Math.cos(fl.ang) * d;
      const y = this.originY + Math.sin(fl.ang) * d * 0.8;
      ctx.fillStyle = fl.color;
      ctx.beginPath();
      ctx.arc(x, y, fl.r * s * (0.5 + 0.5 * fade), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderStrokes(t: number) {
    const tR = t + STROKE_OFFSET;
    const s = this.refS;
    const cxOff = this.originX - ORIGIN_X * s;
    const cyOff = this.originY - ORIGIN_Y * s;
    for (let gi = 0; gi < GROUPS.length; gi++) {
      const g = GROUPS[gi];
      if (g.count > 1) continue;
      const st = groupAt(g, tR);
      if (!st || st.alpha <= 0) continue;
      const dir = rad(st.ang);
      const ux = Math.cos(dir);
      const uy = Math.sin(dir);
      const px = -uy;
      const py = ux;
      const j = this.dashJitter[gi][0];
      const cx = (st.x + ux * j.along) * s + cxOff;
      const cy = (st.y + uy * j.along) * s + cyOff;
      const half = (st.len * j.lenMul * s) / 2;
      const life = g.keys[g.keys.length - 1].t - g.keys[0].t || 1;
      const prog = clamp01((tR - g.keys[0].t) / life);
      this.drawDart(
        cx - ux * half,
        cy - uy * half,
        cx + px * j.bend * half,
        cy + py * j.bend * half,
        cx + ux * half,
        cy + uy * half,
        st.wid * s,
        FINALE_SPIKE,
        1.4 + j.bend,
        gi * 2.9,
        this.journeyAt(gi, prog - 0.25),
        this.journeyAt(gi, prog),
        st.alpha,
      );
    }
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastTick = -1;
    const tick = (now: number) => {
      if (!this.running) return;
      const t = Math.floor(((now - this.t0) / 1000) * FPS) % TICKS;
      if (t !== this.lastTick) {
        if (t < this.lastTick) {
          this.applySentence((this.si + 1) % SENTENCES.length);
        }
        this.lastTick = t;
        this.render(t);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    if (!this.ok) return;
    this.render(STILL_TICK);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    for (const c of [...this.scratch, ...this.wordSprites]) if (c) c.width = c.height = 0;
    this.wordSprites = [];
    this.segs = [];
    this.scratch = [];
  }
}
