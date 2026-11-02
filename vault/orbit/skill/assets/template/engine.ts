// Orbit (https://design.how/vault/orbit), engine.ts.
// FIXED. Change the VARIABLE values in params instead (CAST, RING_COLOR, BG, PHRASE, RATE_DRIFT, RATE_WHIP, MAG_RADIUS, MAG_FORCE, THROW_FRICTION, FONT_VAR).
import {
  BG,
  RING_R_MIN,
  RING_R_MAX,
  RING_PERIOD,
  RING_STROKE,
  RING_COLOR,
  SPHERE_R,
  PILL_H_FRONT,
  PILL_H_BACK,
  FADE_FULL,
  FADE_GONE,
  PILL_RADIUS,
  PILL_PAD_X,
  FONT_K,
  ARROW_K,
  ARROW_TILT,
  TIP_GAP,
  CAST,
  TILT_BASE,
  WOBBLE_X_AMP,
  WOBBLE_X_PERIOD,
  WOBBLE_Z_AMP,
  WOBBLE_Z_PERIOD,
  ATTN_RADIUS,
  ATTN_FOCUS,
  ATTN_LIFT,
  ATTN_LOOK,
  ATTN_RATE,
  DOF_FOCUS_Z,
  DOF_MAX,
  DOF_SLAB,
  SWARM_OFF_X,
  SWARM_OFF_Y,
  YOU_NAME,
  YOU_COLOR,
  YOU_PILL_H,
  YOU_EASE,
  YOU_FADE,
  POINTER_NEAR,
  MAG_RADIUS,
  MAG_FORCE,
  MAG_SPEED_GAIN,
  MAG_MASS_BIAS,
  MAG_SPRING,
  MAG_DAMP,
  MAG_MAX_OFF,
  MAG_WAKE,
  MAG_SLIP,
  MAG_SPEED_FULL,
  MAG_SPEED_MIN,
  ARROW_TURN_MAX,
  ARROW_TURN_AT,
  PHRASE,
  RATE_DRIFT,
  RATE_WHIP,
  RATE_HOLD,
  BUILD_AT,
  WHIP_AT,
  WHIP_END,
  SETTLE_END,
  WHIP_E,
  INERTIA_SPRING,
  INERTIA_DAMP,
  LAG_PER_ACCEL,
  LAG_RECOVER,
  DRAG_PER_REV,
  DRAG_TILT,
  DRAG_TILT_MAX,
  THROW_FRICTION,
  THROW_MAX,
  DRAG_YIELD,
  WASH_ALPHA,
  WASH_R,
  WASH_A_COLOR,
  WASH_B_COLOR,
  WASH_A_PERIOD,
  WASH_B_PERIOD,
  WASH_DRIFT,
  SHADOW_BLUR,
  SHADOW_Y,
  SHADOW_ALPHA,
  PILL_SHEEN,
  PILL_SHADE,
} from "./params";

const ARROW_PATH =
  "M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.47a.5.5 0 0 0-.44.74Z";
const TIP_X = 5.5;
const TIP_Y = 3.21;

interface Node {
  name: string;
  color: string;
  bx: number;
  by: number;
  bz: number;
  x: number;
  y: number;
  z: number;
  labelW: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  lag: number;
  attn: number;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

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

const whipE = spline(WHIP_E);

function phraseRate(p: number): number {
  if (p < BUILD_AT) return RATE_DRIFT;
  if (p < WHIP_AT) {
    const k = (p - BUILD_AT) / (WHIP_AT - BUILD_AT);
    return lerp(RATE_DRIFT, RATE_WHIP, whipE(k));
  }
  if (p < WHIP_END) return RATE_WHIP;
  if (p < SETTLE_END) {
    const k = (p - WHIP_END) / (SETTLE_END - WHIP_END);
    return lerp(RATE_WHIP, RATE_HOLD, whipE(k));
  }
  const k = (p - SETTLE_END) / (1 - SETTLE_END);
  return lerp(RATE_HOLD, RATE_DRIFT, smooth(k));
}

function rgbOf(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export class Orbit {
  ok = false;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private nodes: Node[] = [];
  private arrow = new Path2D(ARROW_PATH);
  private fontFamily = "sans-serif";

  private raf = 0;
  private running = false;
  private disposed = false;
  private t0 = 0;

  private W = 0;
  private H = 0;
  private dpr = 1;

  private near = 0;

  private youX = 0.5;
  private youY = 0.5;
  private youTX = 0.5;
  private youTY = 0.5;
  private youAlpha = 0;
  private youLabelW = 0;
  private entering = false;
  private seen = false;
  private youVX = 0;
  private youVY = 0;
  private dirX = 0;
  private dirY = 0;
  private lastT = 0;

  private spin = 0;
  private spinRate = 0;
  private throwRate = 0;
  private lastRate = 0;
  private accel = 0;
  private dragTilt = 0;

  private dragging = false;
  private dragX = 0;
  private dragY = 0;
  private dragVX = 0;
  private yieldFor = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) return;
    this.ok = true;
    this.t0 = performance.now();

    const rand = lcg(20260815);
    const n = CAST.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    this.nodes = CAST.map(([name, color], i) => {
      const y = 1 - ((i + 0.5) / n) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = golden * i + (rand() - 0.5) * 0.9;
      const tiltJitter = (rand() - 0.5) * 0.35;
      const px = Math.cos(a) * r;
      const py = y + tiltJitter * r * 0.3;
      const pz = Math.sin(a) * r;
      const len = Math.hypot(px, py, pz) || 1;
      return {
        name,
        color,
        bx: px / len,
        by: py / len,
        bz: pz / len,
        x: 0,
        y: 0,
        z: 0,
        labelW: 0,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        lag: 0,
        attn: 0,
      };
    });

    this.measureLabels();
    this.resize();
  }

  setFont(family: string) {
    this.fontFamily = family;
    this.measureLabels();
    if (!this.running && !this.disposed) this.renderStill();
  }

  private measureLabels() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.font = `600 100px ${this.fontFamily}`;
    for (const node of this.nodes) node.labelW = ctx.measureText(node.name).width;
    this.youLabelW = ctx.measureText(YOU_NAME).width;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = rect.width;
    this.H = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    if (!this.running) this.renderStill();
  }

  setPointer(p: { x: number; y: number } | null) {
    if (!p) {
      this.near = 0;
      this.youAlpha = 0;
      return;
    }
    const S = this.H || 1;
    const outX = Math.max(0, -p.x, p.x - 1) * (this.W || 1);
    const outY = Math.max(0, -p.y, p.y - 1) * S;
    const outside = Math.hypot(outX, outY) / S;
    this.near = 1 - smooth(clamp01(outside / POINTER_NEAR));
    this.youTX = p.x;
    this.youTY = p.y;
    if (!this.seen) {
      this.youX = p.x;
      this.youY = p.y;
      this.youVX = 0;
      this.youVY = 0;
      this.entering = true;
      this.seen = true;
    }
  }

  dragStart(p: { x: number; y: number }) {
    this.dragging = true;
    this.dragX = p.x;
    this.dragY = p.y;
    this.dragVX = 0;
  }

  dragMove(p: { x: number; y: number }, dt: number) {
    if (!this.dragging) return;
    const dx = p.x - this.dragX;
    const dy = p.y - this.dragY;
    this.dragX = p.x;
    this.dragY = p.y;
    const want = clamp01(dt) > 0 ? dx / DRAG_PER_REV / Math.max(dt, 1 / 240) : 0;
    this.dragVX += (Math.max(-THROW_MAX, Math.min(THROW_MAX, want)) - this.dragVX) * 0.35;
    this.dragTilt = Math.max(
      -DRAG_TILT_MAX,
      Math.min(DRAG_TILT_MAX, this.dragTilt + dy * DRAG_TILT),
    );
  }

  dragEnd() {
    if (!this.dragging) return;
    this.dragging = false;
    this.throwRate = Math.max(-THROW_MAX, Math.min(THROW_MAX, this.dragVX));
    this.spinRate = this.throwRate;
    this.yieldFor = DRAG_YIELD;
  }

  start() {
    if (this.running || this.disposed || !this.ok) return;
    this.running = true;
    this.lastT = (performance.now() - this.t0) / 1000;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.draw(2.6);
  }

  destroy() {
    this.disposed = true;
    this.stop();
  }

  private loop = () => {
    if (!this.running) return;
    const t = (performance.now() - this.t0) / 1000;
    const dt = Math.min(Math.max(t - this.lastT, 1 / 240), 1 / 20);
    this.lastT = t;

    if (!this.dragging && this.dragTilt !== 0) {
      this.dragTilt += (0 - this.dragTilt) * (1 - Math.exp(-dt * 0.6));
      if (Math.abs(this.dragTilt) < 1e-4) this.dragTilt = 0;
    }

    const pxPrev = this.youX;
    const pyPrev = this.youY;
    const chase = 1 - Math.exp(-dt * YOU_EASE * 60);
    const fade = 1 - Math.exp(-dt * YOU_FADE * 60);
    this.youX += (this.youTX - this.youX) * chase;
    this.youY += (this.youTY - this.youY) * chase;
    this.youAlpha += (this.near - this.youAlpha) * fade;

    void pxPrev;
    void pyPrev;
    if (this.entering) {
      this.entering = false;
      this.youVX = 0;
      this.youVY = 0;
    } else {
      const S = this.H || 1;
      const gapX = ((this.youTX - this.youX) * (this.W || 1)) / S;
      const gapY = this.youTY - this.youY;
      const k = YOU_EASE * 60;
      const vSmooth = 1 - Math.exp(-dt * 9);
      const gl = Math.hypot(gapX, gapY);
      const gk = gl > 0.5 ? 0.5 / gl : 1;
      this.youVX += (gapX * gk * k - this.youVX) * vSmooth;
      this.youVY += (gapY * gk * k - this.youVY) * vSmooth;
    }

    this.spinStep(dt, t);
    this.step(dt);
    this.draw(t);
    this.raf = requestAnimationFrame(this.loop);
  };

  private rotate(t: number) {
    const spin = this.spin;
    const tiltX =
      TILT_BASE +
      WOBBLE_X_AMP * Math.sin((t / WOBBLE_X_PERIOD) * Math.PI * 2) +
      this.dragTilt;
    const rotZ = WOBBLE_Z_AMP * Math.sin((t / WOBBLE_Z_PERIOD) * Math.PI * 2);
    const sx = Math.sin(tiltX), cxn = Math.cos(tiltX);
    const sz = Math.sin(rotZ), czn = Math.cos(rotZ);

    for (const node of this.nodes) {
      const own = spin - node.lag;
      const so = Math.sin(own);
      const co = Math.cos(own);
      const x1 = node.bx * co + node.bz * so;
      const y1 = node.by;
      const z1 = -node.bx * so + node.bz * co;
      const x2 = x1;
      const y2 = y1 * cxn - z1 * sx;
      const z2 = y1 * sx + z1 * cxn;
      node.x = x2 * czn - y2 * sz;
      node.y = x2 * sz + y2 * czn;
      node.z = z2;
    }
  }

  private spinStep(dt: number, t: number) {
    const p = ((t / PHRASE) % 1 + 1) % 1;
    const yieldK = this.dragging ? 0 : clamp01(1 - this.yieldFor / DRAG_YIELD);
    const target = phraseRate(p) * yieldK;

    if (this.dragging) {
      this.spinRate = this.dragVX;
      this.throwRate = this.dragVX;
    } else {
      this.throwRate += (0 - this.throwRate) * clamp01(THROW_FRICTION * dt);
      const err = target + this.throwRate - this.spinRate;
      this.spinRate += err * clamp01(INERTIA_SPRING * dt);
      this.spinRate -= (this.spinRate - target - this.throwRate) *
        clamp01(INERTIA_DAMP * dt) * 0.35;
      if (this.yieldFor > 0) this.yieldFor = Math.max(0, this.yieldFor - dt);
    }

    const raw = (this.spinRate - this.lastRate) / dt;
    this.lastRate = this.spinRate;
    this.accel += (raw - this.accel) * clamp01(dt * 8);

    this.spin += this.spinRate * Math.PI * 2 * dt;
    if (this.spin > Math.PI * 2) this.spin -= Math.PI * 2;
    if (this.spin < 0) this.spin += Math.PI * 2;
  }

  private step(dt: number) {
    if (!this.W || !this.H) return;
    const S = this.H;
    const off = PILL_H_FRONT * S;
    const sx0 = this.W / 2 + SWARM_OFF_X * off;
    const sy0 = this.H / 2 + SWARM_OFF_Y * off;
    const R = SPHERE_R * S;

    const pxF = (this.youX * this.W) / S;
    const pyF = (this.youY * this.H) / S;
    const speed = Math.hypot(this.youVX, this.youVY);
    const wake =
      this.youAlpha *
      (MAG_SPEED_MIN +
        (1 - MAG_SPEED_MIN) * smooth(clamp01(speed / MAG_SPEED_FULL)));
    const dirLen = speed > 1e-4 ? speed : 0;
    const tx = dirLen ? this.youVX / dirLen : 0;
    const ty = dirLen ? this.youVY / dirLen : 0;
    const dirK = 1 - Math.exp(-dt * 6);
    this.dirX += (tx * clamp01(speed / (MAG_SPEED_FULL * 0.5)) - this.dirX) * dirK;
    this.dirY += (ty * clamp01(speed / (MAG_SPEED_FULL * 0.5)) - this.dirY) * dirK;
    const dirTrust = Math.min(1, Math.hypot(this.dirX, this.dirY));
    const hx = dirTrust > 1e-4 ? this.dirX / Math.hypot(this.dirX, this.dirY) : 0;
    const hy = dirTrust > 1e-4 ? this.dirY / Math.hypot(this.dirX, this.dirY) : 0;

    for (const node of this.nodes) {
      const depthK = (node.z + 1) * 0.5;
      const lagTarget = -this.accel * LAG_PER_ACCEL * depthK;
      node.lag += (lagTarget - node.lag) * clamp01(LAG_RECOVER * dt);

      const rx = (sx0 + node.x * R) / S;
      const ry = (sy0 + node.y * R) / S;
      const dx = rx + node.ox - pxF;
      const dy = ry + node.oy - pyF;
      const d = Math.hypot(dx, dy);

      const want = this.youAlpha * (1 - smooth(clamp01(d / ATTN_RADIUS)));
      node.attn += (want - node.attn) * clamp01(ATTN_RATE * dt);

      let ax = 0;
      let ay = 0;
      if (wake > 0.001 && d < MAG_RADIUS) {
        const f = smooth(1 - d / MAG_RADIUS) ** 2;
        const ux = d > 1e-4 ? dx / d : 0.7;
        const uy = d > 1e-4 ? dy / d : 0.7;
        const w = MAG_WAKE * dirTrust;
        const mx = ux * (1 - w) + hx * w;
        const my = uy * (1 - w) + hy * w;
        const side = (Math.sign(hx * uy - hy * ux) || 1) * MAG_SLIP * dirTrust;
        const bx = mx - my * side;
        const by = my + mx * side;
        const bl = Math.hypot(bx, by) || 1;
        const mass = 1 + (MAG_MASS_BIAS - 1) * (node.z + 1) * 0.5;
        const gain = 1 + MAG_SPEED_GAIN * clamp01(speed / MAG_SPEED_FULL);
        const a = (f * MAG_FORCE * wake * gain) / mass;
        ax = (bx / bl) * a;
        ay = (by / bl) * a;
      }

      ax -= MAG_SPRING * node.ox + MAG_DAMP * node.vx;
      ay -= MAG_SPRING * node.oy + MAG_DAMP * node.vy;

      node.vx += ax * dt;
      node.vy += ay * dt;
      node.ox += node.vx * dt;
      node.oy += node.vy * dt;

      const ol = Math.hypot(node.ox, node.oy);
      if (ol > MAG_MAX_OFF) {
        const s = MAG_MAX_OFF / ol;
        node.ox *= s;
        node.oy *= s;
        const vr = node.vx * (node.ox / ol) + node.vy * (node.oy / ol);
        if (vr > 0) {
          node.vx -= vr * (node.ox / ol);
          node.vy -= vr * (node.oy / ol);
        }
      }
    }
  }

  private draw(t: number) {
    const ctx = this.ctx;
    if (!ctx || !this.W || !this.H) return;
    const { W, H } = this;
    const S = H;
    const cx = W / 2;
    const cy = H / 2;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    this.wash(cx, cy, S, t, WASH_A_COLOR, WASH_A_PERIOD, 0);
    this.wash(cx, cy, S, t, WASH_B_COLOR, WASH_B_PERIOD, 2.1);

    const off = PILL_H_FRONT * S;
    const sx0 = cx + SWARM_OFF_X * off;
    const sy0 = cy + SWARM_OFF_Y * off;

    const breath = 0.5 - 0.5 * Math.cos((t / RING_PERIOD) * Math.PI * 2);
    const ringR = (RING_R_MIN + (RING_R_MAX - RING_R_MIN) * breath) * S;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = RING_COLOR;
    ctx.lineWidth = Math.max(1.25, RING_STROKE * S);
    ctx.stroke();

    this.rotate(t);

    const order = [...this.nodes].sort((a, b) => a.z - b.z);

    const R = SPHERE_R * S;
    let filtered = false;
    let lastBlur = -1;
    for (const node of order) {
      const depthAlpha = smooth(
        clamp01((node.z - FADE_GONE) / (FADE_FULL - FADE_GONE)),
      );
      const alpha = depthAlpha + (1 - depthAlpha) * 0.8 * node.attn;
      if (alpha < 0.02) continue;

      const h =
        (PILL_H_BACK + (PILL_H_FRONT - PILL_H_BACK) * (node.z + 1) * 0.5) *
        S *
        (1 + ATTN_LIFT * node.attn);
      const px = sx0 + node.x * R + node.ox * S;
      const py = sy0 + node.y * R + node.oy * S;

      const vs = Math.hypot(node.vx, node.vy);
      let turn = 0;
      if (vs > 1e-3) {
        let d = Math.atan2(node.vy, node.vx) - ARROW_TILT;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        turn = Math.max(-1, Math.min(1, d / Math.PI)) *
          ARROW_TURN_MAX *
          smooth(clamp01(vs / ARROW_TURN_AT));
      }
      if (node.attn > 0.01) {
        let la = Math.atan2(this.youY * H - py, this.youX * W - px) - ARROW_TILT;
        la = Math.atan2(Math.sin(la), Math.cos(la));
        turn += Math.max(-1, Math.min(1, la / Math.PI)) * ATTN_LOOK * node.attn;
      }

      const defocus = Math.max(0, Math.abs(node.z - DOF_FOCUS_Z) - DOF_SLAB);
      const rawBlur =
        (defocus / (1 + DOF_FOCUS_Z - DOF_SLAB)) * DOF_MAX * S *
        (1 - ATTN_FOCUS * node.attn);
      const step = Math.round(rawBlur / 0.5) * 0.5;
      const blurPx = step;
      if (step >= 0.5) {
        if (step !== lastBlur) {
          ctx.filter = `blur(${step}px)`;
          lastBlur = step;
        }
        filtered = true;
      } else if (filtered) {
        ctx.filter = "none";
        lastBlur = 0;
        filtered = false;
      }

      ctx.globalAlpha = alpha;
      this.element(
        px,
        py,
        h,
        node.color,
        node.name,
        node.labelW,
        1 - clamp01(blurPx / 2),
        turn,
      );
    }
    ctx.globalAlpha = 1;
    if (filtered) ctx.filter = "none";

    const inside =
      this.youX > -0.02 && this.youX < 1.02 && this.youY > -0.02 && this.youY < 1.02;
    if (inside && this.youAlpha > 0.01) {
      ctx.globalAlpha = this.youAlpha;
      this.element(
        this.youX * W,
        this.youY * H,
        YOU_PILL_H * S,
        YOU_COLOR,
        YOU_NAME,
        this.youLabelW,
      );
      ctx.globalAlpha = 1;
    }
  }

  private wash(
    cx: number,
    cy: number,
    S: number,
    t: number,
    color: string,
    period: number,
    phase: number,
  ) {
    const ctx = this.ctx!;
    const a = (t / period) * Math.PI * 2 + phase;
    const px = cx + Math.cos(a) * WASH_DRIFT * S;
    const py = cy + Math.sin(a * 1.37 + phase) * WASH_DRIFT * S * 0.7;
    const r = WASH_R * S;
    const rgb = rgbOf(color);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(${rgb},${WASH_ALPHA})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  private element(
    px: number,
    py: number,
    h: number,
    color: string,
    name: string,
    labelW: number,
    depth = 1,
    turn = 0,
  ) {
    const ctx = this.ctx!;
    const fontPx = FONT_K * h;
    const textW = (fontPx / 100) * labelW;
    const pw = textW + 2 * PILL_PAD_X * h;
    const x0 = px + TIP_GAP * h;
    const y0 = py + TIP_GAP * h;
    const rad = PILL_RADIUS * h;

    ctx.save();
    if (depth > 0.75) {
      ctx.shadowColor = `rgba(0,0,0,${SHADOW_ALPHA * depth})`;
      ctx.shadowBlur = SHADOW_BLUR * h;
      ctx.shadowOffsetY = SHADOW_Y * h;
    }

    ctx.fillStyle = color;
    const ah = ARROW_K * h;
    const k = ah / 24;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ARROW_TILT + turn);
    ctx.scale(k, k);
    ctx.translate(-TIP_X, -TIP_Y);
    ctx.fill(this.arrow);
    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(x0, y0, pw, h, rad);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0, y0, pw, h, rad);
    ctx.clip();
    const shade = ctx.createLinearGradient(0, y0, 0, y0 + h);
    shade.addColorStop(0, `rgba(255,255,255,${PILL_SHEEN})`);
    shade.addColorStop(0.45, "rgba(255,255,255,0)");
    shade.addColorStop(1, `rgba(0,0,0,${PILL_SHADE})`);
    ctx.fillStyle = shade;
    ctx.fillRect(x0, y0, pw, h);
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = `600 ${fontPx}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, x0 + pw / 2, y0 + h * 0.54);
  }
}
