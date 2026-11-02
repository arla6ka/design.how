// Word stickers (https://design.how/vault/word-stickers), engine.ts.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
import { STICKERS, type StickerDef } from "./stickers";
import { renderSticker } from "./sticker-render";
import { StickerGL } from "./gl-sticker";
import { capDpr, watchContextLoss } from "./runtime/dispose";

function resolveFamily(cssFamily: string): string {
  const probe = document.createElement("span");
  probe.style.fontFamily = cssFamily;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.textContent = "Ag";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily || "sans-serif";
  document.body.removeChild(probe);
  return fam;
}

export const FRICTION = 0.92;
export const BOUNCE = 0.55;
const MIN_VEL = 0.05;
export const THROW_SCALE = 0.7;
export const GRAB_SCALE = 1.12;
const SCALE_EASE = 0.12;
const DRAG_EASE = 0.1;
const PEEL_EASE = 0.1;

const APPEAR_EASE = 0.09;
const APPEAR_STAGGER_MS = 140;

export const PEEL_ELEVATION = 0.4;
const PEEL_PULLBACK = 0.16;

interface Item {
  def: StickerDef;
  art: HTMLCanvasElement;
  hit: HTMLDivElement;
  tex: WebGLTexture | null;
  w: number;
  h: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  scale: number;
  dragging: boolean;
  peel: number;
  grabU: number;
  grabV: number;
  anchorU: number;
  anchorV: number;
  offX: number;
  offY: number;
  appear: number;
  appearAt: number;
}

export class WordStickers {
  private host: HTMLElement;
  private items: Item[] = [];
  private W = 1;
  private H = 1;
  private dpr = 1;

  private gl: StickerGL | null = null;
  private useGL = false;

  private raf = 0;
  private running = false;
  private disposed = false;
  private laidOut = false;
  private entranceStarted = false;
  private now = 0;

  private drag: {
    item: Item;
    dx: number;
    dy: number;
    lastX: number;
    lastY: number;
    moved: number;
    pointerId: number;
  } | null = null;

  private ro?: ResizeObserver;
  private cleanup: (() => void)[] = [];
  readonly ok: boolean = true;

  constructor(host: HTMLElement) {
    this.host = host;
    this.dpr = capDpr();
    this.measure();

    const gl = new StickerGL();
    if (gl.available) {
      this.gl = gl;
      this.useGL = true;
      gl.resize(this.W, this.H, this.dpr);
      host.appendChild(gl.canvas);
      this.cleanup.push(watchContextLoss(gl.canvas, () => {
        this.stop();
        gl.lost();
      }));
    }

    for (const def of STICKERS) {
      const fontSizePx = this.stickerFontPx();
      const r = renderSticker({
        word: def.word,
        font: resolveFamily(def.font),
        weight: def.weight,
        fill: def.fill,
        outline: def.outline,
        fontSizePx,
      });

      const art = r.canvas;
      let tex: WebGLTexture | null = null;
      if (this.useGL && this.gl) {
        tex = this.gl.makeTexture(art, r.width, r.height).tex;
      } else {
        Object.assign(art.style, {
          position: "absolute",
          width: `${r.width}px`,
          height: `${r.height}px`,
          left: "0",
          top: "0",
          pointerEvents: "none",
        });
        art.setAttribute("aria-hidden", "true");
        host.appendChild(art);
      }

      const hit = document.createElement("div");
      Object.assign(hit.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: `${r.width}px`,
        height: `${r.height}px`,
        cursor: "grab",
        touchAction: "none",
      });
      hit.setAttribute("aria-hidden", "true");
      host.appendChild(hit);

      const item: Item = {
        def,
        art,
        hit,
        tex,
        w: r.width,
        h: r.height,
        x: def.x * this.W - r.width / 2,
        y: def.y * this.H - r.height / 2,
        tx: 0,
        ty: 0,
        vx: 0,
        vy: 0,
        scale: 1,
        dragging: false,
        peel: 0,
        grabU: 0.5,
        grabV: 0.5,
        anchorU: 0.5,
        anchorV: 0.5,
        offX: 0,
        offY: 0,
        appear: 0,
        appearAt: 0,
      };
      item.tx = item.x;
      item.ty = item.y;
      this.clampInside(item);
      this.placeItem(item);
      this.items.push(item);
      this.bindDrag(item);
    }

    this.ro = new ResizeObserver(() => this.onResize());
    this.ro.observe(host);
  }

  private measure() {
    this.W = this.host.clientWidth || 1;
    this.H = this.host.clientHeight || 1;
  }

  private stickerFontPx() {
    const w = this.W > 40 ? this.W : 640;
    return Math.max(32, Math.min(66, w * 0.088));
  }

  resize() {
    this.onResize();
  }

  private onResize() {
    const prevW = this.W;
    const prevH = this.H;
    this.measure();
    if (this.W < 2 || this.H < 2) return;
    this.gl?.resize(this.W, this.H, this.dpr);
    const sx = this.W / (prevW || 1);
    const sy = this.H / (prevH || 1);
    for (const it of this.items) {
      it.x *= sx;
      it.y *= sy;
      it.tx = it.x;
      it.ty = it.y;
    }
    this.rerenderAll();
  }

  private effScale(it: Item) {
    const a = it.appearAt > 0 ? it.appear : 1;
    return it.scale * a;
  }

  private placeItem(it: Item) {
    const s = this.effScale(it);
    const t = `translate(${it.x}px, ${it.y}px)${s !== 1 ? ` scale(${s})` : ""}`;
    it.hit.style.transform = t;
    if (!this.useGL) it.art.style.transform = t;
  }

  private clampInside(it: Item) {
    it.x = Math.max(0, Math.min(this.W - it.w, it.x));
    it.y = Math.max(0, Math.min(this.H - it.h, it.y));
  }

  private bindDrag(it: Item) {
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      this.host.appendChild(it.hit);
      it.dragging = true;
      it.vx = it.vy = 0;
      it.hit.style.cursor = "grabbing";
      it.hit.style.zIndex = "10";

      const r = this.rect();
      const gx = (e.clientX - r.left - it.x) / it.w;
      const gy = (e.clientY - r.top - it.y) / it.h;
      it.grabU = Math.min(1, Math.max(0, gx));
      it.grabV = Math.min(1, Math.max(0, gy));
      it.anchorU = 1 - it.grabU;
      it.anchorV = 1 - it.grabV;

      this.drag = {
        item: it,
        dx: e.clientX - r.left - it.x,
        dy: e.clientY - r.top - it.y,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: 0,
        pointerId: e.pointerId,
      };
      it.hit.setPointerCapture?.(e.pointerId);
    };
    it.hit.addEventListener("pointerdown", onDown);
    this.cleanup.push(() => it.hit.removeEventListener("pointerdown", onDown));

    const onMove = (e: PointerEvent) => {
      if (!this.drag || this.drag.item !== it) return;
      const r = this.rect();
      it.tx = e.clientX - r.left - this.drag.dx;
      it.ty = e.clientY - r.top - this.drag.dy;
      this.drag.moved += Math.hypot(e.clientX - this.drag.lastX, e.clientY - this.drag.lastY);
      this.drag.lastX = e.clientX;
      this.drag.lastY = e.clientY;
    };
    it.hit.addEventListener("pointermove", onMove);
    this.cleanup.push(() => it.hit.removeEventListener("pointermove", onMove));

    const onUp = (e: PointerEvent) => {
      if (!this.drag || this.drag.item !== it) return;
      it.dragging = false;
      it.hit.style.cursor = "grab";
      it.hit.style.zIndex = "";
      it.vx *= THROW_SCALE;
      it.vy *= THROW_SCALE;
      it.hit.releasePointerCapture?.(e.pointerId);
      this.drag = null;
    };
    it.hit.addEventListener("pointerup", onUp);
    it.hit.addEventListener("pointercancel", onUp);
    this.cleanup.push(() => {
      it.hit.removeEventListener("pointerup", onUp);
      it.hit.removeEventListener("pointercancel", onUp);
    });
  }

  private rect() {
    return this.host.getBoundingClientRect();
  }

  start() {
    if (this.running || this.disposed) return;
    const prevW = this.W;
    this.measure();
    if (!this.laidOut || Math.abs(this.W - prevW) > 2) {
      this.layout();
      this.laidOut = true;
    }
    if (!this.entranceStarted) {
      this.entranceStarted = true;
      const order = [...this.items].sort((a, b) => a.def.x - b.def.x);
      const t0 = performance.now() + 150;
      order.forEach((it, i) => (it.appearAt = t0 + i * APPEAR_STAGGER_MS));
    }
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private layout() {
    if (this.W < 2 || this.H < 2) return;
    this.gl?.resize(this.W, this.H, this.dpr);
    this.rerenderAll();
    for (const it of this.items) {
      it.x = it.def.x * this.W - it.w / 2;
      it.y = it.def.y * this.H - it.h / 2;
      it.tx = it.x;
      it.ty = it.y;
      it.vx = it.vy = 0;
      it.scale = 1;
      this.clampInside(it);
      this.placeItem(it);
    }
    this.drawGL();
  }

  private loop = () => {
    if (!this.running) return;
    this.now = performance.now();

    for (const it of this.items) {
      if (it.appearAt > 0 && this.now >= it.appearAt && it.appear < 1) {
        it.appear += (1 - it.appear) * APPEAR_EASE;
        if (it.appear > 0.999) it.appear = 1;
      }

      const targetScale = it.dragging ? GRAB_SCALE : 1;
      if (Math.abs(targetScale - it.scale) > 0.001) it.scale += (targetScale - it.scale) * SCALE_EASE;

      const peelTarget = it.dragging ? 1 : 0;
      if (Math.abs(peelTarget - it.peel) > 0.001) it.peel += (peelTarget - it.peel) * PEEL_EASE;

      if (it.dragging) {
        const nx = it.x + (it.tx - it.x) * DRAG_EASE;
        const ny = it.y + (it.ty - it.y) * DRAG_EASE;
        it.vx = nx - it.x;
        it.vy = ny - it.y;
        it.x = nx;
        it.y = ny;
        this.placeItem(it);
        continue;
      }

      const appearing = it.appearAt > 0 && it.appear < 1;
      const moving = Math.abs(it.vx) >= MIN_VEL || Math.abs(it.vy) >= MIN_VEL;
      if (!moving && it.peel < 0.001 && Math.abs(it.scale - 1) < 0.001 && !appearing) continue;

      it.x += it.vx;
      it.y += it.vy;
      if (it.x < 0) { it.x = 0; it.vx = -it.vx * BOUNCE; }
      else if (it.x > this.W - it.w) { it.x = this.W - it.w; it.vx = -it.vx * BOUNCE; }
      if (it.y < 0) { it.y = 0; it.vy = -it.vy * BOUNCE; }
      else if (it.y > this.H - it.h) { it.y = this.H - it.h; it.vy = -it.vy * BOUNCE; }
      it.vx *= FRICTION;
      it.vy *= FRICTION;
      this.placeItem(it);
    }

    this.drawGL();
    this.raf = requestAnimationFrame(this.loop);
  };

  private drawGL() {
    if (!this.useGL || !this.gl) return;
    this.gl.beginFrame();
    for (const it of this.items) {
      if (!it.tex) continue;
      this.gl.drawSticker({
        x: it.x,
        y: it.y,
        w: it.w,
        h: it.h,
        scale: this.effScale(it),
        grabU: it.grabU,
        grabV: it.grabV,
        anchorU: it.anchorU,
        anchorV: it.anchorV,
        fraction: it.peel,
        elevation: PEEL_ELEVATION,
        pullback: PEEL_PULLBACK,
        dragOffX: 0,
        dragOffY: 0,
        tex: it.tex,
      });
    }
  }

  renderStill() {
    for (const it of this.items) {
      it.vx = it.vy = 0;
      it.scale = 1;
      it.peel = 0;
      it.appear = 1;
      this.placeItem(it);
    }
    this.entranceStarted = true;
    this.drawGL();
  }

  refreshFonts() {
    this.measure();
    this.gl?.resize(this.W, this.H, this.dpr);
    this.rerenderAll();
    this.drawGL();
  }

  private rerenderAll() {
    const fontSizePx = this.stickerFontPx();
    for (const it of this.items) {
      const r = renderSticker({
        word: it.def.word,
        font: resolveFamily(it.def.font),
        weight: it.def.weight,
        fill: it.def.fill,
        outline: it.def.outline,
        fontSizePx,
      });
      it.w = r.width;
      it.h = r.height;
      it.hit.style.width = `${r.width}px`;
      it.hit.style.height = `${r.height}px`;
      if (this.useGL && this.gl) {
        it.tex = this.gl.makeTexture(r.canvas, r.width, r.height, it.tex).tex;
      } else {
        const ctx = it.art.getContext("2d")!;
        it.art.width = r.canvas.width;
        it.art.height = r.canvas.height;
        it.art.style.width = `${r.width}px`;
        it.art.style.height = `${r.height}px`;
        ctx.clearRect(0, 0, it.art.width, it.art.height);
        ctx.drawImage(r.canvas, 0, 0);
      }
      this.clampInside(it);
      this.placeItem(it);
    }
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.ro?.disconnect();
    for (const it of this.items) {
      it.hit.parentNode?.removeChild(it.hit);
      if (!this.useGL) it.art.parentNode?.removeChild(it.art);
    }
    this.gl?.canvas.parentNode?.removeChild(this.gl.canvas);
    this.gl?.destroy();
    this.gl = null;
    this.items = [];
  }
}
