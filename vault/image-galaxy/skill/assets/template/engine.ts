// Image galaxy (https://design.how/vault/image-galaxy), engine.ts.
// FIXED. Change the VARIABLE values in params instead (IMAGES, COUNT_DESKTOP, COUNT_MOBILE, IMAGE_SIZE, IMAGE_SIZE_MOBILE, DESIGN_WIDTH, CONFIG, Z_POOL, SPEED_POOL, GROUND).
import { CONFIG, SPEED_POOL, Z_POOL } from "./params";

const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

export interface GalaxyParticle {
  x: number;
  y: number;
  speed: number;
  z: number;
  opacity: number;
}

export function buildParticles(n: number): GalaxyParticle[] {
  const cols = Math.max(3, Math.round(Math.sqrt(n) * 1.4));
  const left = 8;
  const span = 100 - left * 2;
  const step = cols > 1 ? span / (cols - 1) : 0;
  const rows = Math.ceil(n / cols);

  const slots = Array.from({ length: n }, (_, i) => i).sort(
    () => 0.5 - Math.random(),
  );

  return Array.from({ length: n }, (_, i) => {
    const z = Z_POOL[i % Z_POOL.length];
    const opacity = z < 0 ? Math.max(0.6, 1 + z / 400) : 1;

    const slot = slots[i];
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = left + col * step + (Math.random() - 0.5) * step * 0.5;
    const y = ((row + 0.5) / rows) * 100 + (Math.random() - 0.5) * (100 / rows) * 0.6;

    return {
      x: Math.max(2, Math.min(96, x)),
      y: ((y % 100) + 100) % 100,
      speed: SPEED_POOL[i % SPEED_POOL.length],
      z,
      opacity,
    };
  });
}

interface Node {
  el: HTMLElement;
  overlay: HTMLElement | null;
  speed: number;
  z: number;
  extra: number;
  height: number;
  top: number;
  position: number;
  currentScale: number;
  isBefore: boolean;
  isAfter: boolean;
}

export class ImageGalaxy {
  private container: HTMLElement;
  private nodes: Node[] = [];
  private defs: GalaxyParticle[];

  private scroll = { current: 0, target: 0, last: 0 };
  private directionSign = 1;
  private direction: "up" | "down" = "down";
  private containerHeight = 0;
  private containerOffsetHeight = 0;

  private raf = 0;
  private running = false;
  private disposed = false;
  private still = false;
  private lastTime = 0;

  constructor(
    container: HTMLElement,
    images: HTMLElement[],
    overlays: (HTMLElement | null)[],
    defs?: GalaxyParticle[],
  ) {
    this.container = container;
    this.defs = defs ?? buildParticles(images.length);
    this.nodes = images.map((el, i) => ({
      el,
      overlay: overlays[i] ?? null,
      speed: 1,
      z: 0,
      extra: 0,
      height: 0,
      top: 0,
      position: 0,
      currentScale: 1,
      isBefore: false,
      isAfter: false,
    }));
    this.layout();
  }

  layout() {
    const rect = this.container.getBoundingClientRect();
    const k = rect.height / (this.container.clientHeight || 1) || 1;
    const small = window.innerWidth < 700;
    this.nodes.forEach((node, i) => {
      const d = this.defs[i];
      if (!d) {
        node.el.style.display = "none";
        return;
      }
      if (node.overlay) node.overlay.style.opacity = `${1 - d.opacity}`;
      const left = small ? (i % 4) * 25 + (d.x % 20) : d.x;
      node.el.style.left = `${left}%`;
      node.el.style.top = `${d.y}%`;
      node.speed = d.speed;
      node.z = d.z;
      node.el.style.transform = "translate3d(0, 0px, 0)";
      const box = node.el.getBoundingClientRect();
      node.extra = 0;
      node.height = box.height / k;
      node.top = (box.top - rect.top) / k;
      node.position = 0;
      node.currentScale = 1;
    });
    this.containerHeight = this.container.clientHeight;
    this.containerOffsetHeight = this.containerHeight * 0.1;
    this.scroll = { current: 0, target: 0, last: 0 };
    if (this.still) this.update(0, 1);
  }

  addScroll(velocity: number, direction: number) {
    const v = Math.max(-60, Math.min(60, velocity));
    this.scroll.target += v * CONFIG.scrollMultiplier;
    this.direction = direction > 0 ? "down" : "up";
    if (direction !== 0) this.directionSign = Math.sign(direction);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastTime = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min(2, (now - this.lastTime) / 16.667) : 1;
    this.lastTime = now;
    this.update(dt);
    this.raf = requestAnimationFrame(this.tick);
  };

  renderStill() {
    this.stop();
    this.still = true;
    this.update(0, 1);
  }

  private update(dt: number, scaleEase = CONFIG.scaleEase) {
    this.scroll.target += CONFIG.speed * dt * this.directionSign;
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, CONFIG.ease);
    this.direction = this.scroll.current < this.scroll.last ? "down" : "up";

    for (const t of this.nodes) {
      t.position = -this.scroll.current * t.speed - t.extra;
      const bottom = t.position + t.top + t.height;
      t.isBefore = bottom < -this.containerOffsetHeight;
      t.isAfter = bottom > this.containerHeight + this.containerOffsetHeight;

      if (this.direction === "up" && t.isBefore) {
        t.extra = t.extra - this.containerHeight - this.containerOffsetHeight;
        t.isBefore = false;
        t.isAfter = false;
      }
      if (this.direction === "down" && t.isAfter) {
        t.extra = t.extra + this.containerHeight;
        t.isBefore = false;
        t.isAfter = false;
      }

      const top = t.position + t.top;
      const f = Math.max(0, Math.min(1, top / this.containerHeight));
      const targetScale = CONFIG.scaleMin + f * (CONFIG.scaleMax - CONFIG.scaleMin);
      t.currentScale = lerp(t.currentScale, targetScale, scaleEase);

      t.el.style.transform = `translate3d(0, ${t.position}px, ${t.z}px) scale(${t.currentScale})`;
    }

    this.scroll.last = this.scroll.current;
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.nodes = [];
  }
}
