// Wild type (https://design.how/vault/wild-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, ACCENTS, BG, INK, OBLIQUE, REST_WIDTH_FRAC, GRAIN_ALPHA, FONT_CSS).
import { MESH, TYPE_POSE, TYPE_START } from "./motion";
import { traceWord, type TracedGlyph, type TracedWord } from "./trace";
import {
  ACCENTS, AFTER_K, AFTER_MAX, BG, BG_GLOW, BLANK_TICKS, CORNER_DEG,
  FONT_WEIGHT, FPS, GRAIN_ALPHA, GRAIN_TILE, HOLD_TICKS, INK, LAG_TICKS,
  LOOP_TICKS, MESH_XS, MESH_YS, MIRROR_ALTERNATE, OBLIQUE, OUT_SPEED,
  PULL_DAMP, PULL_GAIN, PULL_K, PULL_SIGMA, REF_CUT_TICK,
  REF_HALF_WIDTH, REST_WIDTH_FRAC, THIN, THIN_MAX, TRACE_EM, TRACE_MIN_AREA,
  TRACE_TOL, TYPE_TICKS, WARP_TICKS, WORDS,
} from "./params";

const GX = MESH_XS.length;
const GY = MESH_YS.length;
const NCP = GX * GY;
const CORNER_COS = Math.cos((CORNER_DEG * Math.PI) / 180);

function crTaps(t: number, knots: number[]): { idx: number[]; w: number[] } {
  const n = knots.length;
  const h = knots[1] - knots[0];
  const j = Math.min(n - 2, Math.max(0, Math.floor((t - knots[0]) / h)));
  const u = (t - knots[j]) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return {
    idx: [j - 1, j, j + 1, j + 2],
    w: [
      0.5 * (-u3 + 2 * u2 - u),
      0.5 * (3 * u3 - 5 * u2 + 2),
      0.5 * (-3 * u3 + 4 * u2 + u),
      0.5 * (u3 - u2),
    ],
  };
}

function foldTap(i: number, n: number): { idx: number[]; w: number[] } {
  if (i < 0) return { idx: [0, 1], w: [2, -1] };
  if (i > n - 1) return { idx: [n - 1, n - 2], w: [2, -1] };
  return { idx: [i], w: [1] };
}

interface PreRing {
  hole: boolean;
  rest: Float64Array;
  basis: Float64Array;
  restPerimeter: number;
  corner: Uint8Array;
}
interface PreGlyph {
  glyph: TracedGlyph;
  rings: PreRing[];
  track: string;
}
interface Prepared {
  word: TracedWord;
  glyphs: PreGlyph[];
}

const TRACKS = ["w", "i", "l", "d"];
function trackFor(k: number, n: number): string {
  if (n <= 1) return "w";
  return TRACKS[Math.min(3, Math.round((k / (n - 1)) * 3))];
}

function perimeter(p: ArrayLike<number>): number {
  let s = 0;
  const n = p.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    s += Math.hypot(p[j * 2] - p[i * 2], p[j * 2 + 1] - p[i * 2 + 1]);
  }
  return s;
}

function corners(p: ArrayLike<number>): Uint8Array {
  const n = p.length / 2;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const a = (i - 1 + n) % n;
    const b = (i + 1) % n;
    const ux = p[i * 2] - p[a * 2], uy = p[i * 2 + 1] - p[a * 2 + 1];
    const vx = p[b * 2] - p[i * 2], vy = p[b * 2 + 1] - p[i * 2 + 1];
    const lu = Math.hypot(ux, uy) || 1e-9;
    const lv = Math.hypot(vx, vy) || 1e-9;
    const cos = (ux * vx + uy * vy) / (lu * lv);
    if (cos < CORNER_COS) out[i] = 1;
  }
  return out;
}

export class WildType {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private cw = 0;
  private ch = 0;
  private lastSig = "";
  private family: string;

  private prepared = new Map<string, Prepared>();
  private wordIdx = 0;
  private loopNo = 0;
  private lastLoopTick = 0;
  private carried = 0;

  private ptr = { x: 0, y: 0, active: false };
  private pullOff = new Float64Array(NCP * 2);
  private pullVel = new Float64Array(NCP * 2);
  private restCtrl = new Float64Array(NCP * 2);
  private scratchCtrl = new Float64Array(NCP * 2);
  private lagCtrl = new Float64Array(NCP * 2);

  private inkA: HTMLCanvasElement | null = null;
  private inkB: HTMLCanvasElement | null = null;
  private grain: CanvasPattern | null = null;
  private warped: Float64Array = new Float64Array(0);

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement, family?: string) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    this.family = family ?? "sans-serif";
    for (let r = 0; r < GY; r++)
      for (let c = 0; c < GX; c++) {
        this.restCtrl[r * GX + c] = MESH_XS[c];
        this.restCtrl[NCP + r * GX + c] = MESH_YS[r];
      }
    if (this.ok) {
      this.buildGrain();
      this.resize();
    }
  }

  private buildGrain() {
    const g = document.createElement("canvas");
    g.width = GRAIN_TILE;
    g.height = GRAIN_TILE;
    const gc = g.getContext("2d");
    if (!gc) return;
    const img = gc.createImageData(GRAIN_TILE, GRAIN_TILE);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gc.putImageData(img, 0, 0);
    this.grain = this.ctx?.createPattern(g, "repeat") ?? null;
  }

  private prepare(word: string): Prepared | null {
    const hit = this.prepared.get(word);
    if (hit) return hit;
    const traced = traceWord(word, this.family, FONT_WEIGHT, OBLIQUE, TRACE_EM, TRACE_TOL, TRACE_MIN_AREA);
    if (!traced) return null;
    const glyphs: PreGlyph[] = traced.glyphs.map((glyph, k) => ({
      glyph,
      track: trackFor(k, traced.glyphs.length),
      rings: glyph.rings.map((r) => {
        const n = r.pts.length / 2;
        const basis = new Float64Array(n * NCP);
        for (let i = 0; i < n; i++) {
          const tx = crTaps(r.pts[i * 2], MESH_XS);
          const ty = crTaps(r.pts[i * 2 + 1], MESH_YS);
          for (let a = 0; a < 4; a++) {
            const fx = foldTap(tx.idx[a], GX);
            for (let b = 0; b < 4; b++) {
              const fy = foldTap(ty.idx[b], GY);
              const w = tx.w[a] * ty.w[b];
              for (let p = 0; p < fx.idx.length; p++)
                for (let q = 0; q < fy.idx.length; q++)
                  basis[i * NCP + fy.idx[q] * GX + fx.idx[p]] += w * fx.w[p] * fy.w[q];
            }
          }
        }
        return {
          hole: r.hole,
          rest: r.pts,
          basis,
          restPerimeter: perimeter(r.pts),
          corner: corners(r.pts),
        };
      }),
    }));
    const out = { word: traced, glyphs };
    this.prepared.set(word, out);
    return out;
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = r.width;
    this.ch = r.height;
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    for (const key of ["inkA", "inkB"] as const) {
      const l = this[key] ?? document.createElement("canvas");
      l.width = c.width;
      l.height = c.height;
      this[key] = l;
    }
    this.lastSig = "";
    if (!this.running) this.renderStill();
  }

  setPointer(x: number | null, y: number | null) {
    if (x == null || y == null) {
      this.ptr.active = false;
      return;
    }
    const half = (this.cw * REST_WIDTH_FRAC) / 2;
    this.ptr.x = (x - this.cw / 2) / half;
    this.ptr.y = (y - this.ch / 2) / half;
    this.ptr.active = true;
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.carried;
    this.lastSig = "";
    const tick = (now: number) => {
      if (!this.running) return;
      const tau = (((now - this.t0) / 1000) * FPS) % LOOP_TICKS;
      if (tau < this.lastLoopTick) {
        this.loopNo++;
        this.wordIdx = (this.wordIdx + 1) % WORDS.length;
      }
      this.lastLoopTick = tau;
      this.draw(tau);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.carried = performance.now() - this.t0;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    for (const l of [this.inkA, this.inkB]) if (l) l.width = l.height = 0;
    this.inkA = this.inkB = null;
    this.prepared.clear();
    this.grain = null;
    this.ctx = null;
  }

  renderStill() {
    this.lastSig = "";
    this.wordIdx = 0;
    this.draw(BLANK_TICKS + TYPE_TICKS + WARP_TICKS);
  }

  private sampleMesh(u: number, mirror: boolean, out: Float64Array) {
    const last = MESH.length - 1;
    const uu = Math.min(Math.max(u, 0), last);
    const j = Math.min(last - 1, Math.floor(uu));
    const f = uu - j;
    const r0 = MESH[Math.max(0, j - 1)];
    const r1 = MESH[j];
    const r2 = MESH[Math.min(last, j + 1)];
    const r3 = MESH[Math.min(last, j + 2)];
    const f2 = f * f;
    const f3 = f2 * f;
    const w0 = 0.5 * (-f3 + 2 * f2 - f);
    const w1 = 0.5 * (3 * f3 - 5 * f2 + 2);
    const w2 = 0.5 * (-3 * f3 + 4 * f2 + f);
    const w3 = 0.5 * (f3 - f2);
    for (let i = 0; i < NCP * 2; i++) out[i] = w0 * r0[i] + w1 * r1[i] + w2 * r2[i] + w3 * r3[i];
    if (mirror) {
      const tmp = Float64Array.from(out);
      for (let r = 0; r < GY; r++)
        for (let c = 0; c < GX; c++) {
          const src = r * GX + (GX - 1 - c);
          const dst = r * GX + c;
          out[dst] = -tmp[src];
          out[NCP + dst] = tmp[NCP + src];
        }
    }
  }

  private stepPull(active: boolean): boolean {
    let moving = false;
    for (let j = 0; j < NCP; j++) {
      const rx = this.restCtrl[j];
      const ry = this.restCtrl[NCP + j];
      let tx = 0;
      let ty = 0;
      if (active) {
        const dx = this.ptr.x - rx;
        const dy = this.ptr.y - ry;
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * PULL_SIGMA * PULL_SIGMA));
        tx = dx * g * PULL_GAIN;
        ty = dy * g * PULL_GAIN;
      }
      for (const [k, t] of [[j, tx], [NCP + j, ty]] as const) {
        this.pullVel[k] += (t - this.pullOff[k]) * PULL_K;
        this.pullVel[k] *= PULL_DAMP;
        this.pullOff[k] += this.pullVel[k];
        if (Math.abs(this.pullVel[k]) > 1e-4 || Math.abs(this.pullOff[k]) > 1e-4) moving = true;
      }
    }
    return moving;
  }

  private draw(tau: number) {
    const ctx = this.ctx;
    if (!ctx || !this.inkA || !this.inkB) return;
    const t = Math.floor(tau);
    const typeEnd = BLANK_TICKS + TYPE_TICKS;
    const warpEnd = typeEnd + WARP_TICKS;
    const holdEnd = warpEnd + HOLD_TICKS;
    const inWarp = tau >= typeEnd && tau < warpEnd;
    const typingIn = t >= BLANK_TICKS && t < typeEnd;
    const typingOut = t >= holdEnd;
    const mirror = MIRROR_ALTERNATE && this.loopNo % 2 === 1;

    const settling = this.stepPull(inWarp && this.ptr.active);

    let sig: string;
    if (t < BLANK_TICKS) sig = `b${t}`;
    else if (typingIn) sig = `y${t}`;
    else if (inWarp) sig = "warp";
    else if (typingOut) sig = `o${t}`;
    else sig = settling ? "settle" : "rest";
    if (sig !== "warp" && sig !== "settle" && sig === this.lastSig) return;
    this.lastSig = sig;

    const word = WORDS[this.wordIdx];
    const accent = ACCENTS[this.wordIdx % ACCENTS.length];
    const prep = this.prepare(word);
    const W = this.canvas.width;
    const H = this.canvas.height;
    const half = ((this.cw * REST_WIDTH_FRAC) / 2) * this.dpr;
    const ox = W / 2;
    const oy = H / 2;

    let stretch = 0;
    let vel = 0;
    let ctrl: Float64Array | null = null;
    let lag: Float64Array | null = null;
    if (inWarp) {
      const u = tau - typeEnd;
      this.sampleMesh(u, mirror, this.scratchCtrl);
      this.sampleMesh(u - LAG_TICKS, mirror, this.lagCtrl);
      ctrl = this.scratchCtrl;
      lag = this.lagCtrl;
      for (let j = 0; j < NCP; j++) {
        ctrl[j] += this.pullOff[j];
        ctrl[NCP + j] += this.pullOff[NCP + j];
        lag[j] += this.pullOff[j];
        lag[NCP + j] += this.pullOff[NCP + j];
        stretch += Math.hypot(ctrl[j] - this.restCtrl[j], ctrl[NCP + j] - this.restCtrl[NCP + j]);
        vel += Math.hypot(ctrl[j] - lag[j], ctrl[NCP + j] - lag[NCP + j]) / LAG_TICKS;
      }
      stretch /= NCP;
      vel /= NCP;
    } else if (settling) {
      ctrl = this.scratchCtrl;
      for (let j = 0; j < NCP * 2; j++) ctrl[j] = this.restCtrl[j] + this.pullOff[j];
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = mix(BG, accent, Math.min(1, stretch / 2.2) * BG_GLOW);
    ctx.fillRect(0, 0, W, H);

    if (!prep || t < BLANK_TICKS) {
      this.finish(ctx, W, H);
      return;
    }

    const cur = this.inkA;
    const prev = this.inkB;
    const ic = cur.getContext("2d");
    if (!ic) return;
    ic.setTransform(1, 0, 0, 1, 0, 0);
    ic.clearRect(0, 0, W, H);
    ic.globalAlpha = 1;

    const poseFor = (track: string): number[] | null => {
      const tr = TYPE_POSE[track];
      if (!tr) return null;
      if (typingIn) return tr[t + REF_CUT_TICK - TYPE_START] ?? null;
      if (typingOut) {
        const e = t - holdEnd;
        const idx = TYPE_TICKS - 1 - Math.floor(e * OUT_SPEED);
        return idx >= 0 ? (tr[idx] ?? null) : null;
      }
      return null;
    };
    const typing = typingIn || typingOut;

    if (lag) {
      ic.fillStyle = accent;
      for (const g of prep.glyphs) {
        const p = new Path2D();
        for (const r of g.rings) this.addRing(p, r, lag, null, half, ox, oy, stretch);
        ic.fill(p, "evenodd");
      }
    }

    ic.fillStyle = INK;
    for (const g of prep.glyphs) {
      let pose: number[] | null = null;
      if (typing) {
        pose = poseFor(g.track);
        if (!pose) continue;
      }
      const p = new Path2D();
      let s = 0;
      for (const r of g.rings) s += this.addRing(p, r, ctrl, pose, half, ox, oy, stretch, g.glyph);
      const st = g.rings.length ? s / g.rings.length : 1;
      ic.globalAlpha = 1 - Math.min(THIN_MAX, Math.max(0, (st - 1) * THIN));
      ic.fill(p, "evenodd");
    }
    ic.globalAlpha = 1;

    if (inWarp) {
      const a = Math.min(AFTER_MAX, vel * AFTER_K);
      if (a > 0.02) {
        ctx.globalAlpha = a;
        ctx.drawImage(prev, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(cur, 0, 0);
    this.inkA = prev;
    this.inkB = cur;

    this.finish(ctx, W, H);
  }

  private finish(ctx: CanvasRenderingContext2D, W: number, H: number) {
    if (!this.grain) return;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = GRAIN_ALPHA;
    ctx.fillStyle = this.grain;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private addRing(
    path: Path2D,
    ring: PreRing,
    ctrl: Float64Array | null,
    pose: number[] | null,
    half: number,
    ox: number,
    oy: number,
    stretch: number,
    glyph?: TracedGlyph,
  ): number {
    const { rest, basis, corner } = ring;
    const n = rest.length / 2;
    if (this.warped.length < n * 2) this.warped = new Float64Array(n * 2);
    const out = this.warped;

    let dx = 0, dy = 0, co = 1, si = 0, sx = 1, sh = 0, cx = 0, cy = 0;
    if (pose && glyph) {
      dx = pose[0] / REF_HALF_WIDTH;
      dy = pose[1] / REF_HALF_WIDTH;
      co = Math.cos(pose[2]);
      si = Math.sin(pose[2]);
      sx = pose[3];
      sh = pose[4];
      cx = glyph.cx;
      cy = glyph.cy;
    }
    for (let i = 0; i < n; i++) {
      let x: number;
      let y: number;
      if (ctrl) {
        const o = i * NCP;
        let ax = 0, ay = 0;
        for (let j = 0; j < NCP; j++) {
          const b = basis[o + j];
          if (b === 0) continue;
          ax += ctrl[j] * b;
          ay += ctrl[NCP + j] * b;
        }
        x = ax;
        y = ay;
      } else if (pose) {
        const u = (rest[i * 2] - cx) * sx + (rest[i * 2 + 1] - cy) * sh;
        const v = rest[i * 2 + 1] - cy;
        x = co * u - si * v + cx + dx;
        y = si * u + co * v + cy + dy;
      } else {
        x = rest[i * 2];
        y = rest[i * 2 + 1];
      }
      out[i * 2] = ox + x * half;
      out[i * 2 + 1] = oy + y * half;
    }
    if (ctrl && stretch > 0.35) {
      for (let i = 0; i < n; i++) {
        const p0 = (i - 1 + n) % n, p1 = i, p2 = (i + 1) % n, p3 = (i + 2) % n;
        const c1 = corner[p1], c2 = corner[p2];
        const b1x = c1 ? out[p1 * 2] : out[p1 * 2] + (out[p2 * 2] - out[p0 * 2]) / 6;
        const b1y = c1 ? out[p1 * 2 + 1] : out[p1 * 2 + 1] + (out[p2 * 2 + 1] - out[p0 * 2 + 1]) / 6;
        const b2x = c2 ? out[p2 * 2] : out[p2 * 2] - (out[p3 * 2] - out[p1 * 2]) / 6;
        const b2y = c2 ? out[p2 * 2 + 1] : out[p2 * 2 + 1] - (out[p3 * 2 + 1] - out[p1 * 2 + 1]) / 6;
        if (i === 0) path.moveTo(out[0], out[1]);
        path.bezierCurveTo(b1x, b1y, b2x, b2y, out[p2 * 2], out[p2 * 2 + 1]);
      }
    } else {
      for (let i = 0; i < n; i++) {
        if (i === 0) path.moveTo(out[0], out[1]);
        else path.lineTo(out[i * 2], out[i * 2 + 1]);
      }
      path.closePath();
    }
    return ctrl ? perimeter(out.subarray(0, n * 2)) / (ring.restPerimeter * half) : 1;
  }
}

function mix(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hex(h: string): number[] {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
