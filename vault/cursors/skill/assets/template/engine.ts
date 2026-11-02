// Cursors (https://design.how/vault/cursors), engine.ts.
// FIXED. Change the VARIABLE values in params instead (CURSORS, WORD, GROUND, INK, WORD_FONT, FONT_VAR, DESIGN_WIDTH).
import { DESIGN_WIDTH, FONT_VAR, STILL_T } from "./params";

const ARROW_PATH =
  "M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.47a.5.5 0 0 0-.44.74Z";

export interface CursorDef {
  name: string;
  color: string;
}

interface CursorNode {
  root: HTMLDivElement;
  blush: HTMLDivElement;
  color: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  phase: number;
  speed: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

const TWO_PI = Math.PI * 2;

export class FlyingCursors {
  private host: HTMLElement;
  private layer: HTMLElement;
  private scale = 1;
  private still = false;
  private defs: CursorDef[];
  private nodes: CursorNode[] = [];
  private raf = 0;
  private running = false;
  private disposed = false;
  private t = 0;

  private pointer = { x: -9999, y: -9999, active: false };

  private ro?: ResizeObserver;
  private cleanup: (() => void)[] = [];

  constructor(host: HTMLElement, layer: HTMLElement, defs: CursorDef[]) {
    this.host = host;
    this.layer = layer;
    this.defs = defs;
    this.build();
    this.bindEvents();
    this.layout();
    this.step(false);
  }

  private build() {
    for (const def of this.defs) {
      const blush = document.createElement("div");
      const SIZE = 300;
      Object.assign(blush.style, {
        position: "absolute",
        left: `${-SIZE / 2}px`,
        top: `${-SIZE / 2}px`,
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${def.color} 0%, transparent 74%)`,
        opacity: "0.72",
        filter: "blur(26px)",
        pointerEvents: "none",
        willChange: "transform",
        mixBlendMode: "soft-light",
        zIndex: "2",
      });
      this.layer.appendChild(blush);

      const root = document.createElement("div");
      Object.assign(root.style, {
        position: "absolute",
        left: "0",
        top: "0",
        pointerEvents: "none",
        willChange: "transform",
        transformOrigin: "0 0",
        zIndex: "3",
      });
      root.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             style="display:block; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.22))">
          <path d="${ARROW_PATH}" fill="${def.color}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
        <span style="
          position:absolute; left:16px; top:17px; white-space:nowrap;
          padding:1.5px 6px; border-radius:8px; border-top-left-radius:2px;
          font-size:9.5px; font-weight:600; letter-spacing:-0.01em;
          line-height:1.35; color:#fff; background:${def.color};
          box-shadow:0 2px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.22);
          font-family:var(${FONT_VAR});
        "></span>
      `;
      root.querySelector("span")!.textContent = def.name;
      this.layer.appendChild(root);
      this.nodes.push({
        root,
        blush,
        color: def.color,
        cx: 0.5,
        cy: 0.5,
        rx: 0.3,
        ry: 0.3,
        phase: 0,
        speed: 1,
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
      });
    }
  }

  private bindEvents() {
    const onMove = (e: PointerEvent) => {
      const r = this.host.getBoundingClientRect();
      this.pointer.x = (e.clientX - r.left) / this.scale;
      this.pointer.y = (e.clientY - r.top) / this.scale;
      this.pointer.active = true;
    };
    const onLeave = () => {
      this.pointer.active = false;
    };
    this.host.addEventListener("pointermove", onMove);
    this.host.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      this.host.removeEventListener("pointermove", onMove);
      this.host.removeEventListener("pointerleave", onLeave);
    });

    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this.host);
  }

  private layout() {
    this.scale = Math.max(1, this.host.clientWidth / DESIGN_WIDTH);
    const w = this.host.clientWidth / this.scale;
    const h = this.host.clientHeight / this.scale;
    if (!w || !h) return;
    const n = this.nodes.length;
    this.nodes.forEach((node, i) => {
      node.cx = (0.32 + 0.36 * ((i + 0.5) / n)) * w;
      node.cy = (0.34 + 0.32 * (i % 2)) * h;
      node.rx = (0.16 + 0.06 * (i % 2)) * w;
      node.ry = (0.2 + 0.05 * ((i + 1) % 2)) * h;
      node.phase = (i / n) * TWO_PI;
      node.speed = 0.5 + 0.18 * i;
    });
    if (this.still) this.step(false);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.stop();
    this.still = true;
    this.t = STILL_T;
    this.step(false);
  }

  private loop = () => {
    if (!this.running) return;
    this.t += 0.006;
    this.step(true);
    this.raf = requestAnimationFrame(this.loop);
  };

  private step(ease: boolean) {
    for (const node of this.nodes) {
      const a = this.t * node.speed + node.phase;
      let bx = node.cx + Math.cos(a) * node.rx;
      let by = node.cy + Math.sin(a * 1.15) * node.ry;

      if (this.pointer.active) {
        const dx = bx - this.pointer.x;
        const dy = by - this.pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const push = Math.max(0, 1 - dist / 220) * 120;
        bx += (dx / dist) * push;
        by += (dy / dist) * push;
      }

      node.tx = bx;
      node.ty = by;
      node.x = ease ? node.x + (node.tx - node.x) * 0.12 : node.tx;
      node.y = ease ? node.y + (node.ty - node.y) * 0.12 : node.ty;
      const sx = (node.x * this.scale).toFixed(1);
      const sy = (node.y * this.scale).toFixed(1);
      node.root.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${this.scale})`;
      node.blush.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(${this.scale})`;
    }
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.cleanup.forEach((fn) => fn());
    this.ro?.disconnect();
    this.nodes.forEach((n) => {
      n.root.parentNode?.removeChild(n.root);
      n.blush.parentNode?.removeChild(n.blush);
    });
    this.nodes = [];
  }
}
