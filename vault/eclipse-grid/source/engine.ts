import {
  COLS,
  DISC_R,
  FRAME_MS,
  GROUND,
  INK,
  LIGHT,
  LOOP_MS,
  RING_R,
  RING_STROKE,
  ROWS,
  SCENE_W,
  STILL_FRAME,
  approach,
  cellPoseLit,
  type Light,
} from "./params";

export class EclipseGrid {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private lastFrame = -1;
  private light: Light = { x: 0, y: 0, a: 0 };
  private lightOn = false;
  private target = { x: 0, y: 0 };
  private lastNow = 0;

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement) {
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

  setLight(x: number, y: number) {
    if (!this.lightOn && this.light.a < 0.01) {
      this.light.x = x;
      this.light.y = y;
    }
    this.target.x = x;
    this.target.y = y;
    this.lightOn = true;
  }

  clearLight() {
    this.lightOn = false;
  }

  private stepLight(dtMs: number) {
    const target = this.lightOn ? 1 : 0;
    this.light.a += (target - this.light.a) * approach(dtMs, LIGHT.presenceMs);
    if (Math.abs(this.light.a - target) < 0.002) this.light.a = target;
    const f = approach(dtMs, LIGHT.followMs);
    this.light.x += (this.target.x - this.light.x) * f;
    this.light.y += (this.target.y - this.light.y) * f;
  }

  private lampLive(): boolean {
    return this.lightOn || this.light.a > 0;
  }

  render(frame: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const k = this.canvas.width / SCENE_W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineWidth = RING_STROKE;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const p = cellPoseLit(col, row, frame, this.light.a > 0 ? this.light : null);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(p.disc.x, p.disc.y, DISC_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = GROUND;
        ctx.beginPath();
        ctx.arc(p.ring.x, p.ring.y, RING_R + RING_STROKE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.arc(p.ring.x, p.ring.y, RING_R, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastNow = this.t0;
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(100, Math.max(0, now - this.lastNow));
      this.lastNow = now;
      const total = this.elapsed + (now - this.t0);
      const frame = Math.floor((total % LOOP_MS) / FRAME_MS);
      const live = this.lampLive();
      if (live) this.stepLight(dt);
      if (frame !== this.lastFrame || live) {
        this.lastFrame = frame;
        this.render(frame);
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

  renderStill() {
    this.render(STILL_FRAME);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }
}
