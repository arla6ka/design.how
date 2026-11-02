// Badge trail (https://design.how/vault/badge-trail), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, COLORS, GROUND, FONT_PX, DROP_MS, MIN_TRAVEL, APPEAR_MS, HOLD_MS, FADE_MS, MAX_LIVE, DESIGN_WIDTH, FONT_VAR).
import {nextWordBag, makeHueWalker} from './badges';
import {
  APPEAR_MS, DROP_MS, FADE_MS, FONT_PX, GAP, HOLD_MS, INTENSITY_FLOOR, MAX_LIVE, MIN_TRAVEL, PAD_X, PAD_Y,
  SPECIAL_EVERY, SPEED_FULL,
} from './params';

export const LIFE_MS = APPEAR_MS + HOLD_MS + FADE_MS;

const SLAM_OFFSET = 5;
const SLAM_OVERSHOOT = 1.03;
const IDLE_WOBBLE = 0.35;
const IDLE_BREATH = 0.01;
const SCRAMBLE_MS = 130;
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*';
const REPEL_PX = 3;
const REPEL_RANGE = 64;
const REPEL_CHASE = 0.16;
const REPEL_DECAY = 0.05;
const GHOST_IDLE_MS = 600;
const GHOST_BLEND_MS = 420;
const GHOST = {fx: 0.00156, fx2: 0.00465, ax: 0.3, ax2: 0.11, fy: 0.00219, fy2: 0.0063, ay: 0.3, ay2: 0.12};

export type Badge = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  born: number;
  dirX: number;
  dirY: number;
  exitRot: number;
  seed: number;
  depth: number;
  special: boolean;
  scram: string;
  offX: number;
  offY: number;
  tgtX: number;
  tgtY: number;
};

export type Motion = {dx: number; dy: number; scale: number; rot: number; opacity: number};

export function badgeMotion(b: Badge, clock: number): Motion {
  const age = clock - b.born;
  let opacity = 1;
  let scale = 1;
  let rot = 0;
  let dx = 0;
  let dy = 0;
  if (age < APPEAR_MS) {
    const t = age / APPEAR_MS;
    const spring = 1 - Math.pow(1 - t, 3);
    opacity = Math.min(1, t * 1.4);
    scale = 0.9 + 0.1 * spring + (SLAM_OVERSHOOT - 1) * Math.sin(Math.PI * t);
    const back = (1 - spring) * SLAM_OFFSET;
    dx = -b.dirX * back;
    dy = -b.dirY * back;
  } else if (age > APPEAR_MS + HOLD_MS) {
    const t = Math.min(1, (age - APPEAR_MS - HOLD_MS) / FADE_MS);
    const e = t * t;
    opacity = 1 - t;
    scale = 1 - 0.2 * e;
    rot = b.exitRot * e;
  }
  if (age >= APPEAR_MS) {
    const idle = opacity;
    const p = clock * 0.004 + b.seed;
    dx += Math.sin(p) * IDLE_WOBBLE * idle;
    dy += Math.cos(p * 1.3 + 0.7) * IDLE_WOBBLE * idle;
    scale += Math.sin(p * 0.9) * IDLE_BREATH * idle;
  }
  return {dx, dy, scale, rot, opacity};
}

function hits(x: number, y: number, w: number, h: number, b: Badge): boolean {
  return x < b.x + b.w + GAP && x + w + GAP > b.x && y < b.y + b.h + GAP && y + h + GAP > b.y;
}

export class BadgeTrail {
  private live: Badge[] = [];
  private raf = 0;
  private running = false;
  private seq = 0;
  private dropCount = 0;
  private rpx = -1;
  private rpy = -1;
  private px = -1;
  private py = -1;
  private prevPx = -1;
  private prevPy = -1;
  private lastDrop = {t: 0, x: 0, y: 0, have: false};
  private leftAt = -Infinity;
  private blendFrom = {x: 0, y: 0};
  private lastNow = 0;
  private readonly nextWord = nextWordBag();
  private readonly nextColor = makeHueWalker(Math.random() * 360);
  scale = 1;

  constructor(
    private readonly host: HTMLElement,
    private readonly charW: number,
    private readonly onFrame: (badges: Badge[], clock: number) => void,
  ) {
    host.addEventListener('pointermove', this.onMove);
    host.addEventListener('pointerdown', this.onMove);
    host.addEventListener('pointerleave', this.onLeave);
    host.addEventListener('pointerup', this.onLeave);
    host.addEventListener('pointercancel', this.onLeave);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastNow = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.stop();
    this.host.removeEventListener('pointermove', this.onMove);
    this.host.removeEventListener('pointerdown', this.onMove);
    this.host.removeEventListener('pointerleave', this.onLeave);
    this.host.removeEventListener('pointerup', this.onLeave);
    this.host.removeEventListener('pointercancel', this.onLeave);
    this.live = [];
  }

  private local(e: PointerEvent): [number, number] {
    const r = this.host.getBoundingClientRect();
    return [(e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale];
  }

  private onMove = (e: PointerEvent) => { [this.rpx, this.rpy] = this.local(e); };

  private onLeave = () => {
    if (this.px >= 0) this.blendFrom = {x: this.px, y: this.py};
    this.rpx = this.rpy = -1;
    this.leftAt = performance.now();
  };

  private ghost(t: number, w: number, h: number): [number, number] {
    const g = GHOST;
    return [
      w * 0.5 + (Math.sin(t * g.fx) * g.ax + Math.sin(t * g.fx2 + 2.3) * g.ax2) * w,
      h * 0.5 + (Math.sin(t * g.fy + 1.7) * g.ay + Math.cos(t * g.fy2 + 0.6) * g.ay2) * h,
    ];
  }

  private tick = (now: number) => {
    this.raf = this.running ? requestAnimationFrame(this.tick) : 0;
    const dtFrames = this.lastNow ? Math.min(4, (now - this.lastNow) / 16.6667) : 1;
    this.lastNow = now;
    const w = this.host.clientWidth / this.scale;
    const h = this.host.clientHeight / this.scale;

    if (this.rpx >= 0) {
      this.px = this.rpx;
      this.py = this.rpy;
    } else if (now - this.leftAt >= GHOST_IDLE_MS) {
      const [gx, gy] = this.ghost(now, w, h);
      const k = Math.min(1, (now - this.leftAt - GHOST_IDLE_MS) / GHOST_BLEND_MS);
      const blending = isFinite(this.leftAt) && k < 1;
      this.px = blending ? this.blendFrom.x + (gx - this.blendFrom.x) * k : gx;
      this.py = blending ? this.blendFrom.y + (gy - this.blendFrom.y) * k : gy;
    } else {
      this.px = this.py = -1;
    }

    const live = this.live;
    for (let i = live.length - 1; i >= 0; i--) if (now - live[i].born >= LIFE_MS) live.splice(i, 1);
    if (this.px >= 0 && live.length < MAX_LIVE) this.drop(now, w, h);
    this.prevPx = this.px;
    this.prevPy = this.py;

    const n = live.length;
    const chaseK = 1 - Math.pow(1 - REPEL_CHASE, dtFrames);
    const decayK = 1 - Math.pow(1 - REPEL_DECAY, dtFrames);
    for (let i = 0; i < n; i++) {
      const b = live[i];
      b.depth = n > 1 ? 1 - i / (n - 1) : 0;
      b.offX += (b.tgtX - b.offX) * chaseK;
      b.offY += (b.tgtY - b.offY) * chaseK;
      b.tgtX *= 1 - decayK;
      b.tgtY *= 1 - decayK;
      const age = now - b.born;
      if (age < SCRAMBLE_MS && b.text.length > 1) {
        const locked = Math.floor((age / SCRAMBLE_MS) * b.text.length);
        let s = '';
        for (let c = 0; c < b.text.length; c++) s += c < locked ? b.text[c] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        b.scram = s;
      } else b.scram = b.text;
    }
    this.onFrame(live.slice(), now);
  };

  private drop(now: number, w: number, h: number) {
    const {px, py} = this;
    const last = this.lastDrop;
    const travelled = last.have ? Math.hypot(px - last.x, py - last.y) : Infinity;
    if (now - last.t < DROP_MS || travelled < MIN_TRAVEL) return;
    const text = this.nextWord();
    const bw = Math.round(text.length * this.charW) + PAD_X * 2;
    const bh = FONT_PX + PAD_Y * 2;
    const x = Math.max(0, Math.min(w - bw, px - bw / 2));
    const y = Math.max(0, Math.min(h - bh, py - bh / 2));
    if (this.live.some(b => hits(x, y, bw, bh, b))) return;

    const vx = this.prevPx >= 0 ? px - this.prevPx : 0;
    const vy = this.prevPy >= 0 ? py - this.prevPy : 0;
    const speed = Math.hypot(vx, vy);
    let dx = vx;
    let dy = this.prevPy >= 0 ? vy : -1;
    const dm = Math.hypot(dx, dy) || 1;
    dx /= dm;
    dy /= dm;
    const intensity = INTENSITY_FLOOR + (1 - INTENSITY_FLOOR) * Math.max(0, Math.min(1, speed / SPEED_FULL));

    const cx = x + bw / 2;
    const cy = y + bh / 2;
    for (const b of this.live) {
      const ox = b.x + b.w / 2 - cx;
      const oy = b.y + b.h / 2 - cy;
      const d = Math.hypot(ox, oy) || 1;
      if (d >= REPEL_RANGE) continue;
      const push = REPEL_PX * (1 - d / REPEL_RANGE);
      b.tgtX += (ox / d) * push;
      b.tgtY += (oy / d) * push;
    }

    this.live.push({
      id: this.seq++, x, y, w: bw, h: bh, text, color: this.nextColor(intensity), born: now, dirX: dx, dirY: dy,
      exitRot: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 5), seed: Math.random() * 1000, depth: 0,
      special: this.dropCount % SPECIAL_EVERY === SPECIAL_EVERY - 1, scram: text, offX: 0, offY: 0, tgtX: 0, tgtY: 0,
    });
    this.dropCount++;
    this.lastDrop = {t: now, x: px, y: py, have: true};
  }
}
