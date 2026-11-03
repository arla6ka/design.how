// Roll type (https://design.how/vault/roll-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (DEFAULT_PHRASES, STAGGER_MS, PHRASE_MS, GLASS_SPEED, LENS, FRINGE, FONT_WEIGHT, FONT_VAR).
import {
  BASELINES,
  BOTTOM_LINE,
  CAP,
  CUT_AFTER_MS,
  DEFAULT_PHRASES,
  ENTER,
  ENTER_AFTER_MS,
  EXIT,
  FIRST_EXIT_MS,
  FONT_WEIGHT,
  FRAME_MS,
  FRINGE,
  FRINGE_ALPHA,
  FRINGE_HUES,
  GLASS_SPEED,
  LENS,
  STRIPS,
  KEY_MS,
  LEAN,
  LEAN_IN,
  PHRASE_MS,
  SCENE_W,
  STAGGER_MS,
  TOP_LINE,
  loopMs,
  sample,
  type Phrases,
} from './params';

type Word = {text: string; pen: number; baseline: number; cx: number; cy: number; top: number; ascent: number; descent: number; left: number; right: number; order: number; sprite?: Sprite};
type Sprite = {canvas: HTMLCanvasElement | OffscreenCanvas; k: number; ink: string};
type Layout = {words: Word[]; ground: string; ink: string; fringe: readonly [string, string]};
type Pose = {w: number; h: number; lean: number; x: number; y: number; tx: number; ty: number; top: number; bottom: number};

export interface RollTypeOptions {
  family: string;
  phrases?: Phrases;
  weight?: number;
  speed?: number;
}

const ENTER_KEYS = ENTER.e.length - 1;
const EXIT_KEYS = EXIT.d.length - 1;
const MID = SCENE_W / 2;
const PAD = 6;

export class RollType {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private size = 140;
  private layouts: Layout[] = [];
  private readonly phrases: Phrases;
  private readonly weight: number;
  private readonly family: string;
  private readonly speed: number;
  private readonly loop: number;

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement, opts: RollTypeOptions) {
    this.ctx = canvas.getContext('2d');
    this.ok = !!this.ctx;
    this.family = opts.family;
    this.phrases = opts.phrases?.length ? opts.phrases : DEFAULT_PHRASES;
    this.weight = opts.weight ?? FONT_WEIGHT;
    this.speed = opts.speed ?? 1;
    this.loop = loopMs(this.phrases);
    if (this.ok) {
      this.measure();
      this.resize();
    }
  }

  private font(size = this.size) {
    return `${this.weight} ${size}px ${this.family}`;
  }

  measure() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = this.font(100);
    this.size = (100 * CAP) / (ctx.measureText('H').actualBoundingBoxAscent || 70);
    ctx.font = this.font();
    ctx.fontKerning = 'normal';
    const space = ctx.measureText(' ').width;
    this.layouts = this.phrases.map(phrase => {
      const words: Word[] = [];
      let order = 0;
      phrase.lines.slice(0, BASELINES.length).forEach((line, row) => {
        const widths = line.map(word => ctx.measureText(word).width);
        const total = widths.reduce((a, b) => a + b, 0) + space * Math.max(0, line.length - 1);
        let pen = MID - total / 2;
        const baseline = BASELINES[row];
        line.forEach((text, i) => {
          const m = ctx.measureText(text);
          const ascent = m.actualBoundingBoxAscent;
          const descent = m.actualBoundingBoxDescent;
          const cx = pen + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
          words.push({text, pen, baseline, cx, cy: baseline - (ascent - descent) / 2, top: baseline - ascent, ascent, descent, left: pen - m.actualBoundingBoxLeft, right: pen + m.actualBoundingBoxRight, order: order++});
          pen += widths[i] + space;
        });
      });
      return {words, ground: phrase.ground, ink: phrase.ink, fringe: phrase.fringe ?? FRINGE_HUES};
    });
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const box = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(box.width * dpr));
    const h = Math.max(1, Math.round(box.height * dpr));
    if (w === c.width && h === c.height) return;
    c.width = w;
    c.height = h;
    if (!this.running) this.renderStill();
  }

  time(): number {
    const total = this.running ? this.elapsed + (performance.now() - this.t0) * this.speed : this.elapsed;
    return ((total % this.loop) + this.loop) % this.loop;
  }

  private exitAt(q: number) {
    return FIRST_EXIT_MS + q * PHRASE_MS;
  }

  private pose(word: Word, enterAt: number, exitAt: number, t: number): Pose | null {
    const delay = word.order * STAGGER_MS;
    const inKey = (t - enterAt - delay) / KEY_MS;
    const outKey = (t - exitAt - delay) / KEY_MS;
    if (inKey < 0 || outKey > EXIT_KEYS || t >= exitAt + CUT_AFTER_MS) return null;
    const toward = (MID - word.cx) / MID;
    if (outKey >= 0) {
      const h = sample(EXIT.h, outKey), w = sample(EXIT.w, outKey);
      const y = word.cy + (TOP_LINE - word.cy) * sample(EXIT.d, outKey);
      return {w, h, lean: -LEAN * toward * Math.max(0, 1 - h), x: word.cx, y, tx: word.pen - word.cx, ty: word.baseline - word.cy, top: word.top - word.cy, bottom: word.top - word.cy + word.ascent + word.descent};
    }
    if (inKey < ENTER_KEYS) {
      const h = sample(ENTER.h, inKey), w = sample(ENTER.w, inKey);
      const y = BOTTOM_LINE + (word.top - BOTTOM_LINE) * sample(ENTER.e, inKey);
      return {w, h, lean: LEAN_IN * toward * Math.max(0, 1 - h), x: word.cx, y, tx: word.pen - word.cx, ty: word.ascent, top: 0, bottom: word.ascent + word.descent};
    }
    return {w: 1, h: 1, lean: 0, x: word.cx, y: word.top, tx: word.pen - word.cx, ty: word.ascent, top: 0, bottom: word.ascent + word.descent};
  }

  private place(pose: Pose, k: number, dy = 0) {
    this.ctx!.setTransform(k * pose.w, 0, k * pose.lean, k * pose.h, k * pose.x, k * (pose.y + dy));
  }

  private sprite(word: Word, ink: string, k: number): Sprite | null {
    if (word.sprite && word.sprite.k === k && word.sprite.ink === ink) return word.sprite;
    const w = Math.ceil((word.right - word.left + 2 * PAD) * k);
    const h = Math.ceil((word.ascent + word.descent + 2 * PAD) * k);
    if (w < 1 || h < 1) return null;
    const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), {width: w, height: h});
    const c = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!c) return null;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.font = this.font();
    c.fontKerning = 'normal';
    c.textBaseline = 'alphabetic';
    c.fillStyle = ink;
    c.fillText(word.text, PAD + word.pen - word.left, PAD + word.ascent);
    word.sprite = {canvas, k, ink};
    return word.sprite;
  }

  private lensed(word: Word, ink: string, pose: Pose, k: number, m: number) {
    const ctx = this.ctx!;
    const sprite = this.sprite(word, ink, k);
    if (!sprite) { this.place(pose, k); ctx.fillStyle = ink; ctx.fillText(word.text, pose.tx, pose.ty); return; }
    this.place(pose, k);
    const sw = sprite.canvas.width, sh = sprite.canvas.height;
    const W = sw / k, H = sh / k;
    const x0 = word.left - word.cx - PAD, y0 = pose.top - PAD;
    const g = LENS * m;
    if (g < 0.002) { ctx.drawImage(sprite.canvas, x0, y0, W, H); return; }
    const u = (v: number) => 0.5 + (v - 0.5) * (1 - g * (1 - 4 * (v - 0.5) ** 2));
    for (let i = 0; i < STRIPS; i++) {
      const v0 = i / STRIPS, v1 = (i + 1) / STRIPS;
      const s0 = u(v0) * sh, s1 = u(v1) * sh;
      const mid = (v0 + v1) / 2;
      const widen = 1 + 0.5 * g * (1 - 4 * (mid - 0.5) ** 2);
      const dw = W * widen;
      ctx.drawImage(sprite.canvas, 0, s0, sw, Math.max(0.5, s1 - s0), x0 - (dw - W) / 2, y0 + v0 * H, dw, (v1 - v0) * H + 0.6 / k);
    }
  }

  private paint(t: number) {
    const ctx = this.ctx;
    if (!ctx || !this.layouts.length) return;
    const n = this.layouts.length;
    const k = this.canvas.width / SCENE_W;
    let ground = this.layouts[0].ground;
    let latest = -Infinity;
    for (let q = -n; q < 2 * n; q++) {
      const cut = this.exitAt(q - 1) + CUT_AFTER_MS;
      if (cut <= t && cut > latest) { latest = cut; ground = this.layouts[((q % n) + n) % n].ground; }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = this.font();
    ctx.fontKerning = 'normal';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    for (let q = -n; q < 2 * n; q++) {
      const layout = this.layouts[((q % n) + n) % n];
      const enterAt = this.exitAt(q - 1) + ENTER_AFTER_MS;
      const exitAt = this.exitAt(q);
      for (const word of layout.words) {
        const pose = this.pose(word, enterAt, exitAt, t);
        if (!pose) continue;
        const before = this.pose(word, enterAt, exitAt, t - 3 * FRAME_MS);
        const centre = (p: Pose) => p.y + (p.h * (p.top + p.bottom)) / 2;
        const travel = before ? (centre(pose) - centre(before) + (pose.h - before.h) * (pose.bottom - pose.top)) / 3 : 0;
        const r = Math.min(1, Math.abs(travel) / GLASS_SPEED);
        const m = r * r * (3 - 2 * r);
        if (m < 0.01) {
          ctx.globalAlpha = 1;
          this.lensed(word, layout.ink, pose, k, 0);
          continue;
        }
        const split = Math.sign(travel) * FRINGE * m;
        ctx.globalAlpha = FRINGE_ALPHA * m;
        this.place(pose, k, split);
        ctx.fillStyle = layout.fringe[0];
        ctx.fillText(word.text, pose.tx, pose.ty);
        this.place(pose, k, -split);
        ctx.fillStyle = layout.fringe[1];
        ctx.fillText(word.text, pose.tx, pose.ty);
        ctx.globalAlpha = 1;
        this.lensed(word, layout.ink, pose, k, m);
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  render(ms: number) {
    this.paint(((ms % this.loop) + this.loop) % this.loop);
  }

  renderStill() {
    this.render(0);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = () => {
      if (!this.running) return;
      this.paint(this.time());
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed = this.time();
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }
}
