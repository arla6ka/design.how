// Code trail (https://design.how/vault/code-trail), engine.ts.
// FIXED. Change the VARIABLE values in params instead (GROUND, FONT_VAR, ROWS, CHASE, MIN_TRAVEL_RATIO, FRAGMENTS, PAIRS).
import { FRAGMENTS, drawMatching, makeBag, type Fragment } from "./fragments";
import { PAIRS, UNDERLINE_EVERY, makeStepper } from "./palette";
import { CHASE, MIN_TRAVEL_RATIO, ROWS } from "./params";

export { ROWS };

export interface Vec {
  x: number;
  y: number;
}

export interface Badge {
  text: string;
  bg: string;
  fg: string;
  underline: boolean;
  comment: boolean;
  hot: boolean;
}

export interface Row {
  id: number;
  badges: Badge[];
  anchorIndex: number;
  pos: Vec;
  slot: number;
}

export const FONT_RATIO = 1 / 42;

export const LINE_RATIO = 1.24;

export const PAD_RATIO = 0.12;

export const STEP_RATIO = 1.4;

export const MAX_BADGES = 3;

export function chaseRate(): number {
  return CHASE;
}

export function badgeCount(index: number, total: number): number {
  void total;
  if (index === 0) return 1;
  if (index === 1) return 2;
  return MAX_BADGES;
}

export function presence(index: number, total: number): number {
  const t = total <= 1 ? 0 : index / (total - 1);
  const START = 0.62;
  const fade = 1 - Math.max(0, (t - START) / (1 - START)) ** 1.6;
  return Math.max(0, Math.min(1, fade));
}

const HOT_EVERY = 19;
const HOT_COLORS = [
  { bg: "#0B0B0B", fg: "#F5F5F5" },
  { bg: "#FFFFFF", fg: "#111111" },
];

export function makeRowFactory() {
  const nextFragment = makeBag(FRAGMENTS);
  const nextPair = makeStepper(PAIRS.length);
  let id = 0;
  let sinceUnderline = 0;
  let sinceHot = 0;

  const paint = (text: string, comment: boolean): Badge => {
    const pair = PAIRS[nextPair()];
    sinceUnderline++;
    sinceHot++;
    const underline =
      pair.underline === true || sinceUnderline >= UNDERLINE_EVERY;
    if (underline) sinceUnderline = 0;
    const hot = sinceHot >= HOT_EVERY;
    if (hot) sinceHot = 0;
    const shock = HOT_COLORS[id % HOT_COLORS.length];
    return {
      text,
      bg: hot ? shock.bg : pair.bg,
      fg: hot ? shock.fg : pair.fg,
      underline,
      comment,
      hot,
    };
  };

  return function buildRow(): Row {
    const badges: Badge[] = [];
    let need: Fragment["in"] = "free";
    for (let i = 0; i < MAX_BADGES; i++) {
      const f: Fragment =
        i === 0 ? nextFragment() : drawMatching(nextFragment, need);
      badges.push(paint(f.text, f.comment === true));
      need = f.out === "end" ? "free" : f.out;
      if (f.comment) break;
    }

    return {
      id: id++,
      badges,
      anchorIndex: badges.length,
      pos: { x: 0, y: 0 },
      slot: 0,
    };
  };
}

export class Drift {
  private at: Vec = { x: 0, y: 0 };
  private dir: Vec = { x: 1, y: 0 };
  private target: Vec = { x: 0, y: 0 };
  private started = false;

  private speed = 0.34;
  private turn = 0.0042;

  constructor(
    private w: number,
    private h: number,
  ) {}

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  reseed(at: Vec) {
    this.at = { ...at };
    this.started = true;
    this.retarget();
  }

  private retarget() {
    const m = 0.2;
    this.target = {
      x: (m + Math.random() * (1 - m * 2)) * this.w,
      y: (m + Math.random() * (1 - m * 2)) * this.h,
    };
  }

  step(dt: number): Vec {
    if (!this.started) {
      this.at = { x: this.w * 0.5, y: this.h * 0.5 };
      this.started = true;
      this.retarget();
    }

    const bx = this.target.x - this.at.x;
    const by = this.target.y - this.at.y;
    const bl = Math.hypot(bx, by) || 1;
    const fit = Math.min(1, Math.min(this.w / 528, this.h / 243)) || 1;
    const k = Math.min(1, (this.turn / fit) * dt);
    this.dir.x += (bx / bl - this.dir.x) * k;
    this.dir.y += (by / bl - this.dir.y) * k;
    const dl = Math.hypot(this.dir.x, this.dir.y) || 1;
    this.dir.x /= dl;
    this.dir.y /= dl;

    const speed = this.speed * fit;
    this.at.x += this.dir.x * speed * dt;
    this.at.y += this.dir.y * speed * dt;

    if (bl < Math.min(this.w, this.h) * 0.22) this.retarget();

    const pad = 0.2;
    const near =
      this.at.x < this.w * pad ||
      this.at.x > this.w * (1 - pad) ||
      this.at.y < this.h * pad ||
      this.at.y > this.h * (1 - pad);
    if (near) this.target = { x: this.w * 0.5, y: this.h * 0.5 };

    this.at.x = Math.max(0, Math.min(this.w, this.at.x));
    this.at.y = Math.max(0, Math.min(this.h, this.at.y));

    return { ...this.at };
  }
}

export interface Metrics {
  font: number;
  line: number;
  pad: number;
}

export class CodeTrail {
  private w = 0;
  private h = 0;
  private line = 18;
  private step = 26;
  private readonly buildRow = makeRowFactory();
  private readonly drift: Drift;
  private rows: Row[] = [];
  private head: Vec = { x: 0, y: 0 };
  private lastPush: Vec = { x: 0, y: 0 };
  private pointerInside = false;
  private raf = 0;
  private last = 0;
  private running = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly elements: Map<number, HTMLElement>,
    private readonly onRows: (rows: Row[]) => void,
    private readonly onMetrics: (m: Metrics) => void,
  ) {
    this.drift = new Drift(host.clientWidth, host.clientHeight);
    this.resize();
    host.addEventListener("pointermove", this.onPointer);
    host.addEventListener("pointerleave", this.onLeave);
  }

  resize() {
    this.w = this.host.clientWidth;
    this.h = this.host.clientHeight;
    const font = Math.max(10, this.w * FONT_RATIO);
    this.line = font * LINE_RATIO;
    this.step = this.line * STEP_RATIO;
    this.drift.resize(this.w, this.h);
    this.onMetrics({ font, line: this.line, pad: font * PAD_RATIO });
  }

  seed(still = false) {
    const seed: Row[] = [];
    for (let i = 0; i < ROWS; i++) {
      const r = this.buildRow();
      r.slot = i;
      r.pos = still
        ? { x: this.w * 0.72 - i * this.step, y: this.h * 0.16 + i * this.line }
        : { x: this.w * 0.62 - i * this.step, y: this.h * 0.28 + i * this.line };
      seed.push(r);
    }
    this.rows = seed;
    this.head = { x: this.w * 0.62, y: this.h * 0.28 };
    this.lastPush = { ...this.head };
    this.onRows(seed);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.stop();
    this.seed(true);
  }

  destroy() {
    this.stop();
    this.host.removeEventListener("pointermove", this.onPointer);
    this.host.removeEventListener("pointerleave", this.onLeave);
    this.rows = [];
  }

  paint() {
    for (const r of this.rows) {
      const el = this.elements.get(r.id);
      if (!el) continue;
      el.style.transform = `translate3d(${r.pos.x.toFixed(2)}px, ${r.pos.y.toFixed(2)}px, 0)`;
      const pr = presence(r.slot, ROWS);
      el.style.opacity = pr.toFixed(3);
      el.style.filter = `saturate(${(0.5 + pr * 0.5).toFixed(3)})`;
      el.style.zIndex = String(ROWS - r.slot);
    }
  }

  private push() {
    const born = this.buildRow();
    born.pos = { ...this.head };
    born.slot = 0;
    const next: Row[] = [born];
    for (const r of this.rows) {
      if (r.slot + 1 >= ROWS) continue;
      r.slot += 1;
      next.push(r);
    }
    this.rows = next;
    this.onRows(next);
  }

  private frame = (now: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    if (!this.pointerInside) this.head = this.drift.step(dt);

    const list = this.rows;
    const k = chaseRate();
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      const tx = i === 0 ? this.head.x : list[i - 1].pos.x - this.step;
      const ty = i === 0 ? this.head.y : list[i - 1].pos.y + this.line;
      r.pos.x += (tx - r.pos.x) * k;
      r.pos.y += (ty - r.pos.y) * k;
    }
    this.paint();

    const travelled = Math.hypot(this.head.x - this.lastPush.x, this.head.y - this.lastPush.y);
    if (travelled >= this.w * MIN_TRAVEL_RATIO) {
      this.lastPush = { ...this.head };
      this.push();
    }
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  private onPointer = (e: PointerEvent) => {
    if (!this.running) return;
    const rect = this.host.getBoundingClientRect();
    this.pointerInside = true;
    this.head = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  private onLeave = () => {
    this.pointerInside = false;
    this.drift.reseed(this.head);
  };
}
