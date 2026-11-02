// Kinetic typography (https://design.how/vault/kinetic-typography), engine.ts.
// FIXED. Change the VARIABLE values in params instead (text, paper, ink, accent, tiles, offset, speed, spread, chroma, shade, grain, FONT_VAR).
import {ASPECT, FONT_WEIGHT, STILL_FRAME, type KineticParams} from './params';

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const rgb = ([r, g, b]: [number, number, number], a = 1) => `rgba(${r},${g},${b},${a})`;

export class KineticType {
  readonly ok: boolean;
  private ctx: CanvasRenderingContext2D | null;
  private mask: HTMLCanvasElement;
  private mctx: CanvasRenderingContext2D | null;
  private warp: HTMLCanvasElement;
  private wctx: CanvasRenderingContext2D | null;
  private tint: HTMLCanvasElement;
  private tctx: CanvasRenderingContext2D | null;
  private grain: HTMLCanvasElement | null = null;
  private ro: ResizeObserver | null = null;

  private dpr = 1;
  private frame = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  private paperRGB: [number, number, number] = [252, 252, 252];
  private inkRGB: [number, number, number] = [27, 27, 27];
  private accentRGB: [number, number, number] = [59, 130, 246];
  private accentInv: [number, number, number] = [196, 125, 9];
  private box = {x0: 0, y0: 0, x1: 0, y1: 0};

  constructor(private canvas: HTMLCanvasElement, private p: KineticParams, private family: string) {
    this.ctx = canvas.getContext('2d');
    this.mask = document.createElement('canvas');
    this.mctx = this.mask.getContext('2d', {willReadFrequently: true});
    this.warp = document.createElement('canvas');
    this.wctx = this.warp.getContext('2d');
    this.tint = document.createElement('canvas');
    this.tctx = this.tint.getContext('2d');
    this.ok = !!(this.ctx && this.mctx && this.wctx && this.tctx);
    if (!this.ok) return;
    this.applyColors();
    this.resize();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
  }

  setParams(params: KineticParams) {
    const old = this.p;
    this.p = params;
    if (params.paper !== old.paper || params.ink !== old.ink || params.accent !== old.accent) this.applyColors();
    if (params.text !== old.text) this.drawLetter();
    if (params.grain !== old.grain) this.buildGrain();
    if (!this.running) this.render(this.frame);
  }

  private applyColors() {
    this.paperRGB = parseHex(this.p.paper);
    this.inkRGB = parseHex(this.p.ink);
    this.accentRGB = parseHex(this.p.accent);
    this.accentInv = [255 - this.accentRGB[0], 255 - this.accentRGB[1], 255 - this.accentRGB[2]];
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (pw === this.canvas.width && ph === this.canvas.height && dpr === this.dpr && this.mask.width === pw) return;
    this.dpr = dpr;
    for (const c of [this.canvas, this.mask, this.warp, this.tint]) { c.width = pw; c.height = ph; }
    this.buildGrain();
    this.drawLetter();
    if (!this.running) this.render(this.frame);
  }

  refreshLetter() {
    this.drawLetter();
    if (!this.running) this.render(this.frame);
  }

  private drawLetter() {
    const {mctx, mask} = this;
    if (!mctx) return;
    const W = mask.width, H = mask.height;
    mctx.clearRect(0, 0, W, H);
    const text = (this.p.text || 'a').slice(0, 12);
    const single = text.length === 1;
    let size = Math.round(H * (single ? 0.86 : 0.6));
    mctx.fillStyle = '#fff';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    const setFont = (s: number) => (mctx.font = `${FONT_WEIGHT} ${s}px ${this.family}`);
    setFont(size);
    if (!single) {
      let guard = 0;
      while (mctx.measureText(text).width > W * 0.9 && size > 12 && guard++ < 40) setFont((size -= 4));
    }
    mctx.fillText(text, W / 2, H * 0.54);
    this.measureBox();
  }

  private measureBox() {
    const {mctx, mask} = this;
    const W = mask.width, H = mask.height;
    try {
      const data = mctx!.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          if (data[(y * W + x) * 4 + 3] > 20) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      this.box = x1 < x0 ? {x0: 0, y0: 0, x1: W, y1: H} : {x0, y0, x1, y1};
    } catch {
      this.box = {x0: 0, y0: 0, x1: W, y1: H};
    }
  }

  private buildGrain() {
    if (this.p.grain <= 0) { this.grain = null; return; }
    const W = this.mask.width, H = this.mask.height;
    if (!W || !H) return;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    if (!g) return;
    const img = g.createImageData(W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      d[i] = d[i + 1] = d[i + 2] = clamp255(128 + (n - 0.5) * 255);
      d[i + 3] = 12;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.06;
    g.fillStyle = '#000';
    const step = Math.max(2, Math.round(3 * this.dpr));
    for (let y = 0; y < H; y += step) g.fillRect(0, y, W, Math.max(1, Math.round(this.dpr)));
    this.grain = c;
  }

  render(frame: number) {
    const {ctx, wctx, mask, p} = this;
    if (!ctx || !wctx) return;
    const W = mask.width, H = mask.height;
    const off = p.offset * this.dpr;

    wctx.globalCompositeOperation = 'source-over';
    wctx.globalAlpha = 1;
    wctx.clearRect(0, 0, W, H);
    const TILES_X = Math.max(2, Math.round(p.tiles));
    const TILES_Y = Math.max(2, Math.round(p.tiles / ASPECT));
    const tileW = Math.floor(W / TILES_X);
    const tileH = Math.floor(H / TILES_Y);
    if (tileW > 0 && tileH > 0) {
      const cx0 = Math.max(0, Math.floor(this.box.x0 / tileW) - 1);
      const cy0 = Math.max(0, Math.floor(this.box.y0 / tileH) - 1);
      const cx1 = Math.min(TILES_X - 1, Math.ceil(this.box.x1 / tileW) + 1);
      const cy1 = Math.min(TILES_Y - 1, Math.ceil(this.box.y1 / tileH) + 1);
      const t = frame * p.speed;
      for (let y = cy0; y <= cy1; y++) {
        for (let x = cx0; x <= cx1; x++) {
          const phase = x * y;
          const mix = Math.sin(t + phase * p.spread) * 0.65 + Math.sin(t * 0.7 + (x + y) * p.spread * 1.9 + 1.3) * 0.45;
          const sx = x * tileW + Math.round(mix * off);
          const sy = y * tileH + Math.round(Math.sin(t * 0.9 + phase * p.spread * 0.6) * off * 0.7);
          const dx = x * tileW, dy = y * tileH;
          const dw = x === TILES_X - 1 ? W - dx : tileW;
          const dh = y === TILES_Y - 1 ? H - dy : tileH;
          if (dw <= 0 || dh <= 0 || sx + dw <= 0 || sy + dh <= 0 || sx >= W || sy >= H) continue;
          wctx.globalAlpha = p.shade > 0 ? 1 - p.shade * 0.5 + Math.min(1, Math.abs(mix)) * p.shade * 0.5 : 1;
          wctx.drawImage(mask, sx, sy, dw, dh, dx, dy, dw, dh);
        }
      }
      wctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgb(this.paperRGB);
    ctx.fillRect(0, 0, W, H);
    if (p.chroma > 0) {
      const shift = Math.round(p.chroma * 5 * this.dpr) + 1;
      this.composite(this.accentRGB, shift, 0.7 * p.chroma);
      this.composite(this.accentInv, -shift, 0.6 * p.chroma);
    }
    this.composite(this.inkRGB, 0, 1);
    if (this.grain && p.grain > 0) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = p.grain;
      ctx.drawImage(this.grain, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  private composite(col: [number, number, number], dx: number, alpha: number) {
    const s = this.tctx!;
    const W = this.warp.width, H = this.warp.height;
    s.globalCompositeOperation = 'source-over';
    s.globalAlpha = 1;
    s.clearRect(0, 0, W, H);
    s.drawImage(this.warp, 0, 0);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = rgb(col);
    s.fillRect(0, 0, W, H);
    s.globalCompositeOperation = 'source-over';
    this.ctx!.globalAlpha = alpha;
    this.ctx!.drawImage(this.tint, dx, 0);
    this.ctx!.globalAlpha = 1;
  }

  renderStill() {
    this.frame = STILL_FRAME;
    this.render(STILL_FRAME);
  }

  private tick = (ms: number) => {
    if (!this.running) return;
    this.frame += this.last ? Math.min(3, (ms - this.last) / (1000 / 60)) : 1;
    this.last = ms;
    this.render(this.frame);
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

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.grain = null;
    this.ctx = this.mctx = this.wctx = this.tctx = null;
  }
}
