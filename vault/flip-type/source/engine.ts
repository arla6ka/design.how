import {
  ADV,
  CAP,
  FONT_SIZE,
  FONT_WEIGHT,
  FRAMES,
  FRAME_MS,
  GROUND,
  INK,
  LOOP_MS,
  POKE,
  SCENE_W,
  STILL_FRAME,
  lettersAt,
  pokeSeq,
  resting,
  type Glyph,
  type Poke,
} from "./params";

export class FlipType {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private lastFrame = -1;
  private pokes: Poke[] = [];
  private lastPoke = new Map<number, number>();

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private family: string,
  ) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) this.resize();
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
    this.lastFrame = -1;
    if (!this.running) this.renderStill();
  }

  frame(): number {
    const total = this.running ? this.elapsed + (performance.now() - this.t0) : this.elapsed;
    return Math.floor((total % LOOP_MS) / FRAME_MS);
  }

  poke(x: number, y: number) {
    if (!this.running) return;
    const f = this.frame();
    for (const g of lettersAt(f, this.pokes)) {
      if (!resting(g)) continue;
      const x1 = g.x + ADV[g.word][g.slot];
      if (x < g.x || x > x1 || y < g.y - CAP || y > g.y + CAP * 0.25) continue;
      const key = g.word * 16 + g.slot;
      const last = this.lastPoke.get(key);
      if (last !== undefined && ((f - last + FRAMES) % FRAMES) < POKE.cooldown) return;
      this.lastPoke.set(key, f);
      this.pokes.push({ slot: g.slot, word: g.word, at: f, seq: pokeSeq(g.slot, f, g.glyph) });
      this.lastFrame = -1;
      return;
    }
  }

  private paint(frame: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const k = this.canvas.width / SCENE_W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${this.family}`;
    ctx.fontKerning = "none";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    const glyphs: Glyph[] = lettersAt(frame, this.pokes);
    for (const g of glyphs) ctx.fillText(g.glyph, g.x, g.y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.pokes.length) {
      this.pokes = this.pokes.filter((p) => ((frame - p.at + FRAMES) % FRAMES) < POKE.hold * p.seq.length + 1);
    }
  }

  render(frame: number) {
    this.paint(((Math.floor(frame) % FRAMES) + FRAMES) % FRAMES);
  }

  renderStill() {
    this.render(STILL_FRAME);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastFrame = -1;
    const tick = () => {
      if (!this.running) return;
      const frame = this.frame();
      if (frame !== this.lastFrame) {
        this.lastFrame = frame;
        this.paint(frame);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed = (this.elapsed + (performance.now() - this.t0)) % LOOP_MS;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }
}
