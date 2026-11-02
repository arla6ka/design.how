// Word carousel (https://design.how/vault/word-carousel), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, INK_FAR, BG, FONT_FAMILY, SCALE_SMALL, SCALE_TINY, TINY_ALPHA, BLUR_STAMPS_MIN, BLUR_STAMPS_MAX).
import {
  ARRIVE_E,
  BG,
  BLUR_FULL,
  BLUR_HEAD,
  BLUR_MIN,
  BLUR_MIN_SCALE,
  BLUR_STAMPS_MAX,
  BLUR_STAMPS_MIN,
  BLUR_TAIL,
  CAP,
  DEPART_E,
  FONT,
  FONT_FAMILY,
  INK,
  INK_FAR,
  LOOP,
  POP_IN_DELAY,
  SCALE_BIG,
  SCALE_SMALL,
  SCALE_TINY,
  SLOT_C,
  SLOT_L,
  SLOT_R,
  SLOT_T,
  STEPS,
  TINY_ALPHA,
  TRAIL_BIAS,
  OVERSHOOT,
  OVERSHOOT_FROM,
  WINDUP,
  WORDS,
} from "./params";

function spline(pts: [number, number][]): (k: number) => number {
  const n = pts.length;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const dx: number[] = [];
  const s: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    s.push((ys[i + 1] - ys[i]) / dx[i]);
  }
  const m: number[] = [s[0]];
  for (let i = 1; i < n - 1; i++) {
    if (s[i - 1] * s[i] <= 0) m.push(0);
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m.push((w1 + w2) / (w1 / s[i - 1] + w2 / s[i]));
    }
  }
  m.push(s[n - 2]);
  return (k: number) => {
    if (k <= 0) return ys[0];
    if (k >= 1) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && xs[i + 1] < k) i++;
    const h = dx[i];
    const u = (k - xs[i]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      ys[i] * (2 * u3 - 3 * u2 + 1) +
      m[i] * h * (u3 - 2 * u2 + u) +
      ys[i + 1] * (-2 * u3 + 3 * u2) +
      m[i + 1] * h * (u3 - u2)
    );
  };
}

const arriveE = spline(ARRIVE_E);
const departE = spline(DEPART_E);
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const ROLE_X = [SLOT_C, SLOT_R, SLOT_T, SLOT_L];
const ROLE_S = [SCALE_BIG, SCALE_SMALL, SCALE_TINY, SCALE_SMALL];
const ROLE_Z = [3, 1, 0, 2];

interface Pose {
  x: number;
  s: number;
  visible: boolean;
  z: number;
}

export class WordCarousel {
  ok = false;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private running = false;
  private last = 0;
  private t = 0.15;

  private W = 0;
  private H = 0;
  private dpr = 1;
  private fontPx = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) return;
    this.resize();
    this.ok = true;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.fontPx = FONT * this.H;
    if (!this.running) this.draw(this.t);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.t = (this.t + Math.min((now - this.last) / 1000, 0.1)) % LOOP;
      this.last = now;
      this.draw(this.t);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.draw(0.15);
  }

  destroy() {
    this.stop();
  }

  private stepAt(t: number): { p: number; u: number; tIn: number } {
    for (let i = 0; i < 4; i++) {
      const a = STEPS[i] - WINDUP;
      let b = STEPS[(i + 1) % 4] - WINDUP;
      if (b < a) b += LOOP;
      let tt = t;
      if (tt < a) tt += LOOP;
      if (tt >= a && tt < b) return { p: i, u: (tt - a) / (b - a), tIn: tt - a };
    }
    return { p: 0, u: 0, tIn: 0 };
  }

  private pose(wi: number, t: number): Pose {
    const { p, u, tIn } = this.stepAt(t);
    const role = (((wi - p) % 4) + 4) % 4;
    const next = (role + 3) % 4;
    const e = role === 1 ? arriveE(clamp01(u)) : departE(clamp01(u));

    if (role === 3) {
      if (tIn < WINDUP) return { x: SLOT_L, s: SCALE_SMALL, visible: true, z: ROLE_Z[3] };
      if (tIn < WINDUP + POP_IN_DELAY) return { x: SLOT_T, s: SCALE_TINY, visible: false, z: ROLE_Z[2] };
      return { x: SLOT_T, s: SCALE_TINY, visible: true, z: ROLE_Z[2] };
    }

    let over = 0;
    if (role === 1 && u > OVERSHOOT_FROM) {
      const q = (u - OVERSHOOT_FROM) / (1 - OVERSHOOT_FROM);
      over = -OVERSHOOT * Math.sin(q * Math.PI);
    }

    return {
      x: lerp(ROLE_X[role], ROLE_X[next], e) + over,
      s: lerp(ROLE_S[role], ROLE_S[next], e),
      visible: true,
      z: e < 0.5 ? ROLE_Z[role] : ROLE_Z[next],
    };
  }

  private inkAt(s: number): string {
    const k = clamp01((s - SCALE_TINY) / (SCALE_BIG - SCALE_TINY));
    const e = k * k;
    const mix = (a: string, b: string, m: number) => {
      const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
      const c = [0, 1, 2].map((i) => Math.round(lerp(p(a, i), p(b, i), m)));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    };
    return mix(INK_FAR, INK, e);
  }

  private stamp(word: string, x: number, s: number, alpha: number) {
    const ctx = this.ctx!;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.inkAt(s);
    ctx.font = `400 ${this.fontPx * s}px ${FONT_FAMILY}`;
    ctx.fillText(word, x * this.W, this.H / 2 + (CAP * this.H * s) / 2);
  }

  private draw(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const poses = WORDS.map((_, wi) => this.pose(wi, t));
    const was = WORDS.map((_, wi) => this.pose(wi, (t - 0.033 + LOOP) % LOOP));
    const order = [...WORDS.keys()].sort((a, b) => poses[a].z - poses[b].z);

    for (const wi of order) {
      const pose = poses[wi];
      const from = was[wi];
      if (!pose.visible) continue;
      const travelled = from.visible ? Math.abs(pose.x - from.x) : 0;
      const bigEnough = pose.s >= BLUR_MIN_SCALE;

      if (travelled > BLUR_MIN && bigEnough) {
        const head = lerp(1, BLUR_HEAD, clamp01(travelled / BLUR_MIN - 1));

        const speed = clamp01(travelled / BLUR_FULL);
        const stamps = Math.round(
          lerp(BLUR_STAMPS_MIN, BLUR_STAMPS_MAX, speed),
        );

        const trail = TRAIL_BIAS * speed;

        for (let i = 0; i < stamps; i++) {
          const k = i / (stamps - 1);
          const headward = k * k;
          const tailward = 1 - (1 - k) * (1 - k);
          this.stamp(
            WORDS[wi],
            lerp(from.x, pose.x, k),
            lerp(from.s, pose.s, k),
            lerp(BLUR_TAIL, head, lerp(headward, tailward, trail)),
          );
        }
      } else {
        const a =
          pose.s <= SCALE_TINY
            ? TINY_ALPHA
            : lerp(
                TINY_ALPHA,
                1,
                clamp01((pose.s - SCALE_TINY) / (SCALE_SMALL - SCALE_TINY)),
              );
        this.stamp(WORDS[wi], pose.x, pose.s, a);
      }
    }
    ctx.globalAlpha = 1;
  }
}
