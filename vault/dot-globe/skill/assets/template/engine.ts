// Dot globe (https://design.how/vault/dot-globe), engine.ts.
// FIXED. Change the VARIABLE values in params instead (DUOS, GROUND, EXPS, WOBBLE, HOLD_S, SWAP_S, HANDOFF, TURN_EVERY_S, GAP, ROUND).
import { project } from "./sphere";
import { GRID, NAMES, lit } from "./glyphs";
import {
  GROUND,
  DUOS,
  type Duo,
  SPAN,
  COUNT,
  RADIUS,
  EXPS,
  SCALES,
  RECEDE,
  GAP,
  ROUND,
  WOBBLE,
  WOBBLE_RATE,
  TILT_MAX,
  TILT_EASE,
  LEAN_MAX,
  FIELD_RATIO,
  LIFT,
  OPEN,
  TURN_EVERY_S,
  TURN_S,
  HOLD_S,
  SWAP_S,
  HANDOFF,
  TRAIL,
  TRAIL_REACH,
  TRAIL_BANDS,
} from "./params";

export interface DotGlobeEngine {
  readonly ok: boolean;
  start(): void;
  stop(): void;
  renderStill(): void;
  resize(): void;
  setPointer(p: { x: number; y: number } | null): void;
  destroy(): void;
}

export function createDotGlobe(host: HTMLElement, canvas: HTMLCanvasElement): DotGlobeEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const noop = () => {};
    return { ok: false, start: noop, stop: noop, renderStill: noop, resize: noop, setPointer: noop, destroy: noop };
  }

  let w = 0;
  let h = 0;

  let tilt = 0;
  let tiltTarget = 0;
  let lean = 0;
  let leanTarget = 0;
  let ptr: { x: number; y: number } | null = null;
  let last = 0;
  let clock = 0;

  const resize = () => {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const roundQuad = (q: number[], k: number) => {
    let min = Infinity;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const d = Math.hypot(q[j * 2] - q[i * 2], q[j * 2 + 1] - q[i * 2 + 1]);
      if (d < min) min = d;
    }
    const r = min * k;
    if (r < 0.4) {
      ctx.moveTo(q[0], q[1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(q[i * 2], q[i * 2 + 1]);
      ctx.closePath();
      return;
    }

    for (let i = 0; i < 4; i++) {
      const p = (i + 3) % 4;
      const n = (i + 1) % 4;
      const cx = q[i * 2];
      const cy = q[i * 2 + 1];

      const toP = edgePoint(cx, cy, q[p * 2], q[p * 2 + 1], r);
      const toN = edgePoint(cx, cy, q[n * 2], q[n * 2 + 1], r);

      if (i === 0) ctx.moveTo(toP[0], toP[1]);
      else ctx.lineTo(toP[0], toP[1]);
      ctx.quadraticCurveTo(cx, cy, toN[0], toN[1]);
    }
    ctx.closePath();
  };

  const draw = () => {
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    const r = h * RADIUS;
    const FIELD = h * FIELD_RATIO;

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    for (let g = 0; g < COUNT; g++) {
      const base = DUOS[g % DUOS.length];
      const back = RECEDE[g % RECEDE.length];
      const duo: Duo = back
        ? {
            off: mix(base.off, GROUND, back),
            offNear: mix(base.offNear, GROUND, back),
            on: mix(base.on, GROUND, back),
            hot: mix(base.hot, GROUND, back),
          }
        : base;
      const cx = (w * (g + 0.5)) / COUNT;

      const leanG = ptr
        ? Math.max(-1, Math.min(1, (ptr.x - cx) / (w / COUNT))) * LEAN_MAX
        : 0;

      const slot = Math.floor(clock / TURN_EVERY_S);
      const intoSlot = clock % TURN_EVERY_S;
      const mine = slot % COUNT === g;
      const t = mine && intoSlot < TURN_S ? intoSlot / TURN_S : 0;
      const turn = t > 0 ? t * t * (3 - 2 * t) : 0;
      const shifted = clock - TURN_S * 0.5;
      const turnsDone =
        shifted < 0
          ? 0
          : Math.floor((Math.floor(shifted / TURN_EVERY_S) - g + COUNT) / COUNT);

      const spinG =
        Math.sin(clock * WOBBLE_RATE) * WOBBLE +
        lean * leanG +
        turn * Math.PI * 2;
      const tiltG = tilt + Math.sin(clock * 0.41) * WOBBLE * 0.28;

      const rg = r * SCALES[g % SCALES.length];

      const tiles = project({
        n: GRID,
        span: SPAN,
        r: rg,
        cx,
        cy: h / 2,
        spin: spinG,
        tilt: tiltG,
        gap: GAP,
        exp: EXPS[g % EXPS.length],
      });

      const cycle = HOLD_S + SWAP_S;
      const local = clock - g * SWAP_S * HANDOFF;
      const step = Math.floor(local / cycle);
      const raw = step - g + turnsDone;
      const idx = ((raw % NAMES.length) + NAMES.length) % NAMES.length;
      const into = (((local % cycle) + cycle) % cycle) - HOLD_S;
      const from = NAMES[idx];
      const to = NAMES[(idx + 1) % NAMES.length];
      const turning = turn > 0;
      const wave = turning ? 0 : into <= 0 ? 0 : into / SWAP_S;
      const mark = from;

      const isOn = (t: (typeof tiles)[number]) => {
        if (wave <= 0) return lit(mark, t.col, t.row);
        if (wave >= 1) return lit(to, t.col, t.row);
        const ang = Math.acos(Math.max(-1, Math.min(1, t.uz)));
        const d = ang / (Math.PI * 0.5);
        return d < wave ? lit(to, t.col, t.row) : lit(from, t.col, t.row);
      };

      const front = (t: (typeof tiles)[number]) => {
        if (wave <= 0 || wave >= 1) return 0;
        const ang = Math.acos(Math.max(-1, Math.min(1, t.uz)));
        const d = ang / (Math.PI * 0.5);
        const age = wave - d;
        if (age < 0 || age > TRAIL) return 0;
        const k = 1 - age / TRAIL;
        return k * k;
      };

      const push = (t: (typeof tiles)[number]) => {
        if (!ptr || lean <= 0.002) return 0;
        const dx = t.quad[0] - ptr.x;
        const dy = t.quad[1] - ptr.y;
        const d = Math.hypot(dx, dy);
        if (d > FIELD) return 0;
        const k = 1 - d / FIELD;
        return k * k * lean;
      };

      const cell = (2 * SPAN * rg) / GRID;
      const moved = tiles.map((t) => {
        const p = push(t);
        if (p <= 0.01 || !ptr) return t;
        const dx = t.quad[0] - ptr.x;
        const dy = t.quad[1] - ptr.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = p * OPEN * cell;
        const ox = (dx / d) * k;
        const oy = (dy / d) * k;
        const q = t.quad.slice();
        for (let i = 0; i < 4; i++) {
          q[i * 2] += ox;
          q[i * 2 + 1] += oy;
        }
        return { ...t, quad: q };
      });

      ctx.beginPath();
      for (const t of moved) {
        if (isOn(t)) continue;
        roundQuad(t.quad, ROUND);
      }
      ctx.fillStyle = duo.off;
      ctx.fill();

      ctx.beginPath();
      for (const t of moved) {
        if (isOn(t)) continue;
        if (t.z < 0.55) continue;
        roundQuad(t.quad, ROUND);
      }
      ctx.fillStyle = duo.offNear;
      ctx.fill();

      if (wave > 0 && wave < 1) {
        for (let b = 0; b < TRAIL_BANDS; b++) {
          const lo = b / TRAIL_BANDS;
          const hi = (b + 1) / TRAIL_BANDS;
          ctx.beginPath();
          let any = false;
          for (const t of moved) {
            if (isOn(t)) continue;
            const f = front(t);
            if (f <= lo || f > hi) continue;
            roundQuad(t.quad, ROUND);
            any = true;
          }
          if (!any) continue;
          ctx.fillStyle = mix(duo.offNear, duo.on, hi * TRAIL_REACH);
          ctx.fill();
        }
      }

      for (const t of moved) {
        if (!isOn(t)) continue;
        const p = Math.max(push(t), front(t));
        ctx.beginPath();
        if (p > 0.01) {
          const q = scaleQuad(t.quad, 1 + p * LIFT);
          roundQuad(q, ROUND);
        } else {
          roundQuad(t.quad, ROUND);
        }
        ctx.fillStyle = p > 0.01 ? duo.hot : duo.on;
        ctx.fill();
      }
    }
  };

  let raf = 0;
  let running = false;
  let disposed = false;

  const frame = (now: number) => {
    raf = 0;
    if (!running || disposed) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    clock += dt;
    tilt += (tiltTarget - tilt) * TILT_EASE;
    lean += (leanTarget - lean) * (TILT_EASE * 0.7);
    draw();
    raf = requestAnimationFrame(frame);
  };

  resize();
  draw();

  return {
    ok: true,
    start() {
      if (running || disposed) return;
      running = true;
      last = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    renderStill() {
      if (disposed) return;
      clock = 0;
      tilt = 0;
      lean = 0;
      draw();
    },
    resize() {
      if (disposed) return;
      resize();
      draw();
    },
    setPointer(p) {
      if (!p) {
        tiltTarget = 0;
        leanTarget = 0;
        return;
      }
      const v = h ? p.y / h - 0.5 : 0;
      tiltTarget = Math.max(-1, Math.min(1, v * 2)) * TILT_MAX;
      ptr = p;
      leanTarget = 1;
    },
    destroy() {
      disposed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

const RGB = new Map<string, [number, number, number]>();
const MIXED = new Map<string, string>();

function rgb(hex: string): [number, number, number] {
  const hit = RGB.get(hex);
  if (hit) return hit;
  const n = parseInt(hex.slice(1), 16);
  const v: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  RGB.set(hex, v);
  return v;
}

function mix(a: string, b: string, k: number): string {
  const key = `${a}${b}${k.toFixed(3)}`;
  const hit = MIXED.get(key);
  if (hit) return hit;
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  const out = `rgb(${r},${g},${bl})`;
  MIXED.set(key, out);
  return out;
}

function scaleQuad(q: number[], k: number): number[] {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < 4; i++) {
    cx += q[i * 2];
    cy += q[i * 2 + 1];
  }
  cx /= 4;
  cy /= 4;
  const out: number[] = new Array(8);
  for (let i = 0; i < 4; i++) {
    out[i * 2] = cx + (q[i * 2] - cx) * k;
    out[i * 2 + 1] = cy + (q[i * 2 + 1] - cy) * k;
  }
  return out;
}

function edgePoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  d: number,
): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(d / len, 0.5);
  return [ax + dx * t, ay + dy * t];
}
