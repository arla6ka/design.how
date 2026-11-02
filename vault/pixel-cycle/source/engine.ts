import {
  BOX_ASPECT, BOX_HEIGHT, HOLD, INTERACTION_PIXEL_SIZE, IN_DURATION, OUT_DURATION, PIXEL_MIN, PIXEL_START, PIXEL_STEPS,
  SCALE, SLIDE_DURATION, SLIDE_TRAVEL, SWAP_SCALE_MIN, SWAP_SKEW,
} from './params';

type Source = HTMLCanvasElement | HTMLImageElement;
const sizeOf = (s: Source) => (s instanceof HTMLImageElement ? {w: s.naturalWidth, h: s.naturalHeight} : {w: s.width, h: s.height});

function buildRamp(): number[] {
  const sizes: number[] = [];
  let prev = Infinity;
  for (let i = 0; i < PIXEL_STEPS; i++) {
    const t = i / (PIXEL_STEPS - 1);
    const size = Math.max(PIXEL_MIN, Math.round(PIXEL_START + (PIXEL_MIN - PIXEL_START) * (t * (2 - t))));
    if (size < prev) { sizes.push(size); prev = size; }
  }
  if (sizes[sizes.length - 1] !== PIXEL_MIN) sizes.push(PIXEL_MIN);
  return sizes;
}
const BASE_SIZES = buildRamp();

const power3In = (u: number) => u * u * u;
const power3Out = (u: number) => 1 - (1 - u) ** 3;
const power2In = (u: number) => u * u;
const backOut = (u: number, s = 1.4) => 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2;
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

const CYCLE = HOLD + OUT_DURATION + SLIDE_DURATION * 0.4 + Math.max(SLIDE_DURATION * 0.6, SLIDE_DURATION * 0.12 + IN_DURATION);

type Particle = {x: number; y: number; color: string; born: number; life: number; size: number};

export class PixelCycle {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private temp: HTMLCanvasElement;
  private tctx: CanvasRenderingContext2D | null;
  private ro: ResizeObserver | null = null;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private box = {x: 0, y: 0, w: 0, h: 0};
  private sizes = BASE_SIZES;
  private particleSize = INTERACTION_PIXEL_SIZE;

  private raf = 0;
  private running = false;
  private elapsed = 0;
  private last = 0;
  private state = {image: 0, idx: 0, slide: 0, scale: 1, skew: 0};

  private mouse: {x: number; y: number} | null = null;
  private lastCell = '';
  private particles: Particle[] = [];

  constructor(private canvas: HTMLCanvasElement, private images: Source[], private interaction: boolean) {
    this.ctx = canvas.getContext('2d');
    this.temp = document.createElement('canvas');
    this.tctx = this.temp.getContext('2d', {willReadFrequently: true});
    this.ok = !!this.ctx && !!this.tctx && images.length > 0;
    if (!this.ok) return;
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
    if (interaction) {
      canvas.addEventListener('pointermove', this.onMove);
      canvas.addEventListener('pointerleave', this.onLeave);
    }
  }

  resize() {
    const ctx = this.ctx;
    if (!ctx) return;
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = r.width;
    this.cssH = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    const h = Math.min(r.height * BOX_HEIGHT, (r.width * 0.9) / BOX_ASPECT);
    const w = h * BOX_ASPECT;
    this.box = {x: (r.width - w) / 2, y: (r.height - h) / 2, w, h};
    let f = SCALE.min.scale;
    if (w >= SCALE.max.width) f = SCALE.max.scale;
    else if (w > SCALE.min.width) f = SCALE.min.scale + ((SCALE.max.scale - SCALE.min.scale) * (w - SCALE.min.width)) / (SCALE.max.width - SCALE.min.width);
    this.sizes = BASE_SIZES.map(s => Math.max(1, Math.round(s * f)));
    this.particleSize = Math.max(1, Math.round(INTERACTION_PIXEL_SIZE * f));
    if (!this.running) this.draw();
  }

  private at(t: number) {
    const last = this.sizes.length - 1;
    const n = this.images.length;
    if (t < IN_DURATION) return {image: 0, idx: last * power3Out(t / IN_DURATION), slide: 0, scale: 1, skew: 0};
    const k = Math.floor((t - IN_DURATION) / CYCLE);
    const p = (t - IN_DURATION) - k * CYCLE;
    const away = SLIDE_DURATION * 0.4;
    if (p < HOLD) return {image: k % n, idx: last, slide: 0, scale: 1, skew: 0};
    if (p < HOLD + OUT_DURATION) return {image: k % n, idx: last * (1 - power3In((p - HOLD) / OUT_DURATION)), slide: 0, scale: 1, skew: 0};
    if (p < HOLD + OUT_DURATION + away) {
      const e = power2In((p - HOLD - OUT_DURATION) / away);
      return {image: k % n, idx: 0, slide: -e, scale: 1 + (SWAP_SCALE_MIN - 1) * e, skew: SWAP_SKEW * e};
    }
    const q = p - HOLD - OUT_DURATION - away;
    const e = backOut(clamp01(q / (SLIDE_DURATION * 0.6)));
    const r = clamp01((q - SLIDE_DURATION * 0.12) / IN_DURATION);
    return {image: (k + 1) % n, idx: last * power3Out(r), slide: 1 - e, scale: SWAP_SCALE_MIN + (1 - SWAP_SCALE_MIN) * e, skew: -SWAP_SKEW * (1 - e)};
  }

  private grid(px: number) {
    const {w: iw, h: ih} = sizeOf(this.images[this.state.image]);
    const ratio = iw / ih;
    const fw = ratio > this.box.w / this.box.h ? this.box.w : this.box.h * ratio;
    const fh = ratio > this.box.w / this.box.h ? this.box.w / ratio : this.box.h;
    const bx = Math.ceil(fw / px), by = Math.ceil(fh / px);
    const slide = this.state.slide * this.box.h * SLIDE_TRAVEL;
    return {
      fw, fh, bx, by,
      x: this.box.x + (this.box.w - fw) / 2 + (fw - bx * px) / 2,
      y: this.box.y + (this.box.h - fh) / 2 + (fh - by * px) / 2 + Math.round(slide / px) * px,
      cy: this.box.y + this.box.h / 2 + slide,
    };
  }

  private draw() {
    const {ctx, tctx, temp} = this;
    if (!ctx || !tctx) return;
    const s = this.state;
    const px = this.sizes[Math.min(Math.floor(s.idx), this.sizes.length - 1)];
    const g = this.grid(px);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.cssW, this.cssH);
    if (temp.width !== g.bx || temp.height !== g.by) { temp.width = g.bx; temp.height = g.by; }
    tctx.imageSmoothingEnabled = false;
    tctx.clearRect(0, 0, g.bx, g.by);
    tctx.drawImage(this.images[s.image], 0, 0, g.bx, g.by);
    const transforming = s.scale !== 1 || s.skew !== 0;
    if (transforming) {
      const cx = this.box.x + this.box.w / 2;
      ctx.save();
      ctx.translate(cx, g.cy);
      ctx.scale(s.scale, s.scale);
      ctx.transform(1, 0, s.skew, 1, 0, 0);
      ctx.translate(-cx, -g.cy);
    }
    ctx.drawImage(temp, 0, 0, g.bx, g.by, g.x, g.y, g.bx * px, g.by * px);
    if (transforming) ctx.restore();
    if (this.interaction && this.mouse) this.spawn();
    this.drawParticles();
  }

  private spawn() {
    const px = this.particleSize;
    const g = this.grid(px);
    const cx = Math.max(0, Math.min(Math.floor((this.mouse!.x - g.x) / px), g.bx - 1));
    const cy = Math.max(0, Math.min(Math.floor((this.mouse!.y - g.y) / px), g.by - 1));
    const key = `${cx},${cy}`;
    if (key === this.lastCell) return;
    this.lastCell = key;
    const tctx = this.tctx!;
    this.temp.width = g.bx;
    this.temp.height = g.by;
    tctx.drawImage(this.images[this.state.image], 0, 0, g.bx, g.by);
    const data = tctx.getImageData(0, 0, g.bx, g.by).data;
    const now = performance.now();
    const cells = [[cx, cy]];
    const around: number[][] = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const x = cx + dx, y = cy + dy;
      if ((dx || dy) && x >= 0 && x < g.bx && y >= 0 && y < g.by) around.push([x, y]);
    }
    around.sort(() => Math.random() - 0.5);
    cells.push(...around.slice(0, 1 + Math.floor(Math.random() * 3)));
    for (const [x, y] of cells) {
      const i = (y * g.bx + x) * 4;
      if (data[i + 3] < 40) continue;
      this.particles.push({x: g.x + x * px, y: g.y + y * px, color: `${data[i]}, ${data[i + 1]}, ${data[i + 2]}`, born: now, life: 600 + Math.random() * 400, size: px});
    }
  }

  private drawParticles() {
    if (!this.particles.length) return;
    const now = performance.now();
    this.particles = this.particles.filter(p => now - p.born < p.life);
    for (const p of this.particles) {
      this.ctx!.fillStyle = `rgba(${p.color}, ${1 - (now - p.born) / p.life})`;
      this.ctx!.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = this.canvas.getBoundingClientRect();
    this.mouse = {x: e.clientX - r.left, y: e.clientY - r.top};
  };
  private onLeave = () => { this.mouse = null; this.lastCell = ''; };

  private tick = (now: number) => {
    if (!this.running) return;
    this.elapsed += this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;
    this.state = this.at(this.elapsed);
    this.draw();
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
    this.elapsed = IN_DURATION + HOLD / 2;
    this.state = this.at(this.elapsed);
    this.draw();
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerleave', this.onLeave);
    this.particles = [];
    this.images = [];
    this.ctx = null;
  }
}
