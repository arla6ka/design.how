// Pixel fire (https://design.how/vault/pixel-fire), engine.ts.
// FIXED. Change the VARIABLE values in params instead (FLAME, COOL_MIN, COOL_RANDOM, FPS, BURN_RADIUS, HEAL_RATE, BLOCK, GROUND, SEED).
import {BURN_RADIUS, FIRE_FRAC, FPS, FRAMES, HEAL_RATE, N, STILL_FRAME, SWAY_MAX, block, flipbook} from './params';

export class PixelFire {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private off: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D | null;
  private buf: ImageData | null = null;
  private stone: HTMLCanvasElement;
  private frames: Uint8ClampedArray<ArrayBuffer>[];

  private grid = new Float32Array(N * N * 4);
  private scratch = new Float32Array(N * N * 4);
  private dist = new Float32Array(N * N);
  private primed = false;

  private swayX = 0;
  private vel = {x: 0, y: 0};
  private pcell: {x: number; y: number} | null = null;
  private prevP: {x: number; y: number} | null = null;
  private box = {x: 0, y: 0, size: 0, dpr: 1};

  private raf = 0;
  private running = false;
  private last = 0;
  private acc = 0;

  constructor(private host: HTMLElement, private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.off = document.createElement('canvas');
    this.off.width = N;
    this.off.height = N;
    this.offCtx = this.off.getContext('2d');
    this.stone = document.createElement('canvas');
    this.stone.width = N;
    this.stone.height = N;
    this.ok = !!this.ctx && !!this.offCtx;
    this.frames = flipbook();
    if (!this.ok) return;
    this.buf = this.offCtx!.createImageData(N, N);
    this.stone.getContext('2d')?.putImageData(new ImageData(block(), N, N), 0, 0);
    this.resize();
    window.addEventListener('pointermove', this.onMove, {passive: true});
    host.addEventListener('pointerleave', this.onLeave);
    host.addEventListener('pointerdown', this.onTap, {passive: true});
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = this.host.clientWidth;
    const ch = Math.max(1, this.host.clientHeight);
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    const size = Math.min(cw, ch) * FIRE_FRAC;
    this.box = {x: (cw - size) / 2, y: (ch - size) / 2 - ch * 0.08, size, dpr};
    ctx.imageSmoothingEnabled = false;
    if (!this.running && this.primed) this.render();
  }

  private onMove = (e: PointerEvent) => {
    const r = this.host.getBoundingClientRect();
    const px = e.clientX - r.left - this.box.x;
    const py = e.clientY - r.top - this.box.y;
    if (px < 0 || py < 0 || px > this.box.size || py > this.box.size) { this.pcell = null; return; }
    this.pcell = {x: (px / this.box.size) * N, y: (py / this.box.size) * N};
  };
  private onLeave = () => { this.pcell = null; };

  private onTap = () => {
    for (let i = 0; i < N * N; i++) {
      const p = i * 4;
      if (this.grid[p + 3] > 127) {
        this.grid[p] = this.grid[p + 1] = this.grid[p + 2] = this.grid[p + 3] = 0;
        this.dist[i] = 1;
      }
    }
  };

  private step(dt: number, src: Uint8ClampedArray) {
    const {grid, scratch, dist} = this;
    if (!this.primed) { grid.set(src); this.primed = true; }

    if (this.pcell && this.prevP) {
      this.vel.x += ((this.pcell.x - this.prevP.x) / Math.max(dt, 0.001) - this.vel.x) * 0.3;
      this.vel.y += ((this.pcell.y - this.prevP.y) / Math.max(dt, 0.001) - this.vel.y) * 0.3;
    } else {
      this.vel.x *= 0.8;
      this.vel.y *= 0.8;
    }
    this.prevP = this.pcell ? {...this.pcell} : null;
    const swayTarget = this.pcell ? ((this.pcell.x - N / 2) / (N / 2)) * SWAY_MAX : 0;
    this.swayX += (swayTarget - this.swayX) * Math.min(1, dt * 6);

    const decay = Math.min(1, HEAL_RATE * dt);
    for (let i = 0; i < N * N; i++) {
      const p = i * 4;
      const srcLit = src[p + 3] > 127;
      const d = dist[i];
      if (d < 0.02) {
        if (srcLit) { grid[p] = src[p]; grid[p + 1] = src[p + 1]; grid[p + 2] = src[p + 2]; grid[p + 3] = 255; }
        else grid[p] = grid[p + 1] = grid[p + 2] = grid[p + 3] = 0;
        continue;
      }
      const lit = grid[p + 3] > 127;
      if (!lit && srcLit && Math.random() < decay * 0.6) {
        grid[p] = src[p]; grid[p + 1] = src[p + 1]; grid[p + 2] = src[p + 2]; grid[p + 3] = 255;
        dist[i] = 0;
        continue;
      }
      if (lit && !srcLit) grid[p] = grid[p + 1] = grid[p + 2] = grid[p + 3] = 0;
      dist[i] = d * (1 - decay);
    }

    if (!this.pcell) return;
    const {x: cx, y: cy} = this.pcell;
    const speed = Math.hypot(this.vel.x, this.vel.y);
    const inv = speed > 0.001 ? 1 / speed : 0;
    const pushX = this.vel.x * inv;
    const pushY = this.vel.y * inv - 0.8;
    const pl = Math.hypot(pushX, pushY) || 1;
    const ux = pushX / pl, uy = pushY / pl;
    const reach = BURN_RADIUS + 1.2;
    const x0 = Math.max(0, Math.floor(cx - reach)), x1 = Math.min(N - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach)), y1 = Math.min(N - 1, Math.ceil(cy + reach));
    scratch.set(grid);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > BURN_RADIUS) continue;
        const i = y * N + x;
        const p = i * 4;
        if (grid[p + 3] < 40) continue;
        const fall = 1 - d / BURN_RADIUS;
        const moveBy = 1 + Math.round(fall * 3);
        const tx = Math.min(N - 1, Math.max(0, x + Math.round(ux * moveBy)));
        const ty = Math.min(N - 1, Math.max(0, y + Math.round(uy * moveBy)));
        const tp = (ty * N + tx) * 4;
        const rr = grid[p] + (255 - grid[p]) * fall * 0.6;
        const gg = grid[p + 1] + (245 - grid[p + 1]) * fall * 0.45;
        const bb = grid[p + 2] + (190 - grid[p + 2]) * fall * 0.3;
        if (rr + gg + bb >= scratch[tp] + scratch[tp + 1] + scratch[tp + 2]) { scratch[tp] = rr; scratch[tp + 1] = gg; scratch[tp + 2] = bb; }
        scratch[tp + 3] = 255;
        dist[ty * N + tx] = 1;
        if (fall > 0.12) {
          scratch[p] = scratch[p + 1] = scratch[p + 2] = scratch[p + 3] = 0;
          dist[i] = 1;
        }
      }
    }
    grid.set(scratch);
  }

  private render() {
    const {ctx, canvas, box, off, buf, offCtx} = this;
    if (!ctx || !buf || !offCtx) return;
    const out = buf.data;
    for (let y = 0; y < N; y++) {
      const shift = Math.round(this.swayX * (1 - y / (N - 1)));
      for (let x = 0; x < N; x++) {
        const p = (y * N + x) * 4;
        const gp = (y * N + Math.min(N - 1, Math.max(0, x - shift))) * 4;
        out[p] = this.grid[gp]; out[p + 1] = this.grid[gp + 1]; out[p + 2] = this.grid[gp + 2]; out[p + 3] = this.grid[gp + 3];
      }
    }
    offCtx.putImageData(buf, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const d = box.dpr;
    ctx.drawImage(this.stone, box.x * d, (box.y + box.size) * d, box.size * d, box.size * d);
    ctx.drawImage(off, box.x * d, box.y * d, box.size * d, box.size * d);
  }

  private tick = (ms: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min(0.05, (ms - this.last) / 1000) : 0.016;
    this.last = ms;
    this.acc = (this.acc + dt * FPS) % FRAMES;
    this.step(dt, this.frames[Math.floor(this.acc) % FRAMES]);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (!this.ok) return;
    this.acc = STILL_FRAME;
    this.grid.set(this.frames[STILL_FRAME]);
    this.primed = true;
    this.render();
  }

  destroy() {
    this.stop();
    window.removeEventListener('pointermove', this.onMove);
    this.host.removeEventListener('pointerleave', this.onLeave);
    this.host.removeEventListener('pointerdown', this.onTap);
    this.ctx = null;
    this.offCtx = null;
  }
}
