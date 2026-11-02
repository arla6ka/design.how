import { easeFn, sampleTable } from "./ease";
import {
  HALFTONE_DEFAULTS,
  drawHalftone,
  makeHalftoneTile,
} from "./halftone";
import { MEASURED } from "./presets/measured";
import type { Scene } from "./scene";

export class InkFlood {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private elapsed = 0;
  private running = false;
  private dpr = 1;
  private scene: Scene;

  private tile: HTMLCanvasElement | null = null;

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    scene: Scene = MEASURED,
  ) {
    this.scene = scene;
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) this.resize();
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.t0 = performance.now();
    this.elapsed = 0;
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.tile = null;
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.elapsed * 1000;
    const tick = (now: number) => {
      if (!this.running) return;
      this.draw((now - this.t0) / 1000);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed = (performance.now() - this.t0) / 1000;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(this.scene.restAt / this.scene.fps);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.tile = null;
  }

  private capsule(
    ctx: CanvasRenderingContext2D,
    x0: number, y0: number, x1: number, y1: number, r: number,
  ) {
    if (r <= 0) return;
    ctx.beginPath();
    if (Math.hypot(x1 - x0, y1 - y0) < 0.5) {
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  private stampInk(ctx: CanvasRenderingContext2D, u: number, k: number) {
    const { spine } = this.scene;
    for (let i = 0; i < spine.length - 1; i++) {
      const [ax, ay, ar, af] = spine[i];
      if (af > u) break;
      const [bx, by, br, bf] = spine[i + 1];
      const seg = bf <= u ? 1 : (u - af) / (bf - af);
      const dist = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.ceil((dist * seg) / Math.max(2, ar * k * 0.4)));
      for (let j = 0; j <= n; j++) {
        const t = (j / n) * seg;
        const r = (ar + (br - ar) * t) * k;
        ctx.beginPath();
        ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private toScene(ctx: CanvasRenderingContext2D, W: number, H: number, flip: boolean) {
    const { ref } = this.scene;
    ctx.translate(W / 2, H / 2);
    if (flip) ctx.scale(-1, 1);
    const hs = H / ref;
    ctx.scale(hs, hs);
    ctx.translate(-ref / 2, -ref / 2);
  }

  private screen(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const o = HALFTONE_DEFAULTS;
    if (!this.tile) this.tile = makeHalftoneTile(o.pitch, o.radius, this.dpr);
    drawHalftone(ctx, this.tile, W, H, this.dpr, o.alpha);
  }

  private draw(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.scene;
    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const halfSecs = s.half / s.fps;
    const total = time % (halfSecs * 2);
    const second = total >= halfSecs;
    const u = (total - (second ? halfSecs : 0)) * s.fps;
    const [fieldA, fieldB] = s.palette.fields;
    const bg = second ? fieldB : fieldA;
    const ink = second ? fieldA : fieldB;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (u >= s.flood.end) {
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, W, H);
      this.screen(ctx, W, H);
      return;
    }

    const flooding = u >= s.flood.at;
    const fe = easeFn(s.flood.ease);
    const zoom = flooding ? sampleTable(s.flood.scale, s.flood.at, u, fe) : 1;
    const k = flooding ? sampleTable(s.flood.swell, s.flood.at, u, fe) : 1;

    ctx.save();
    this.toScene(ctx, W, H, second);
    ctx.translate(s.ref / 2, s.ref / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-s.ref / 2, -s.ref / 2);
    ctx.fillStyle = ink;
    this.stampInk(ctx, u, k);
    ctx.restore();

    ctx.save();
    this.toScene(ctx, W, H, second);
    ctx.fillStyle = s.palette.dot;
    ctx.strokeStyle = s.palette.dot;

    const sp = s.sparks;
    if (sp && u >= sp.popAt) {
      const se = easeFn(sp.ease);
      const rNow =
        u < s.flood.at
          ? sampleTable(sp.pop, sp.popAt, u, se)
          : u < sp.shrinkAt
            ? sp.radius
            : sampleTable(sp.shrink, sp.shrinkAt, u, se);

      const div = (v: number) =>
        v < s.flood.at ? 1 : sampleTable(sp.diverge, s.flood.at, v, se);
      const now = div(u + 0.5);
      const was = div(Math.max(u - 0.5, sp.popAt));
      const c = s.ref / 2;
      for (const sign of [1, -1]) {
        this.capsule(
          ctx,
          c + sign * sp.offset[0] * was,
          c + sign * sp.offset[1] * was,
          c + sign * sp.offset[0] * now,
          c + sign * sp.offset[1] * now,
          rNow,
        );
      }
    }

    if (s.tip && u >= s.tipAt && u < s.tipAt + s.tip.length) {
      const [x, y, r] = this.tipAt(u);
      if (r > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    this.screen(ctx, W, H);
  }

  private tipAt(u: number): [number, number, number] {
    const tip = this.scene.tip!;
    const k = Math.min(Math.max(u - this.scene.tipAt, 0), tip.length - 1);
    const i = Math.min(Math.floor(k), tip.length - 2);
    const t = k - i;
    const a = tip[i];
    const b = tip[i + 1];
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

}
