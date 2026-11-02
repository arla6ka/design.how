import {
  OUTRO,
  OUTRO_HOLD,
  HOVER_WARM,
  HOVER_SPREAD,
  HOVER_BLOOM,
  HOVER_IN,
  HOVER_OUT,
  WINDOW_SMOOTH,
  BANDS,
  BG_BOTTOM,
  BG_HORIZON,
  BG_TOP,
  BLOOM_ALPHA,
  BLOOM_LAYERS,
  BLOOM_DROP,
  BLOOM_R,
  BLOOM_REST,
  BRIDGE_AT,
  CONTENT_MID,
  CUTS,
  D,
  FACE_RIM,
  FACE_RIM_ALPHA,
  REST_FROM,
  REST_FULL,
  REST_OFF,
  REST_SPAN,
  REST_TIPP,
  SETTLE_BRIDGE,
  FACE_TOP,
  FACE_MID,
  FACE_BOTTOM,
  FACE_HILITE_AT,
  FPS,
  FRAMES,
  IGNITE_AT,
  OFF,
  OUTLINE,
  RAMP,
  RECTS,
  REF_W,
  SPAN,
  TIP_BAND_FROM,
  TIP_BAND_FULL,
  TIPP,
  V_POLY,
  VP_DEPTH,
  WCY,
  WORD_H,
  WORD_W,
  WW,
} from "./params";

function at(table: number[], u: number): number {
  const last = table.length - 1;
  if (u <= 0) return table[0];
  if (u >= last) return table[last];
  const i = Math.floor(u);
  if (CUTS.has(i)) return table[i];
  return table[i] + (table[i + 1] - table[i]) * (u - i);
}

function bridged(u: number): number {
  if (SETTLE_BRIDGE <= 0) return u;
  if (u < BRIDGE_AT) return u;
  const span = 1 + SETTLE_BRIDGE;
  if (u < BRIDGE_AT + span) {
    const k = (u - BRIDGE_AT) / span;
    return BRIDGE_AT + (1 - (1 - k) ** 3);
  }
  return u - SETTLE_BRIDGE;
}

function atFrom(table: number[], base: number, u: number): number {
  return at(table, u - base < 0 ? 0 : u - base);
}

function window3(table: number[], base: number, u: number): number {
  if (WINDOW_SMOOTH <= 0) return atFrom(table, base, u);
  const r = WINDOW_SMOOTH;
  const steps = 5;
  let sum = 0;
  let wsum = 0;
  for (let i = -steps; i <= steps; i++) {
    const o = (i / steps) * r;
    const w = 1 - Math.abs(i) / (steps + 1);
    sum += atFrom(table, base, u + o) * w;
    wsum += w;
  }
  return sum / wsum;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function outroK(u: number): number {
  if (OUTRO <= 0) return 0;
  const start = FRAMES - 1;
  if (u <= start) return 0;
  return smooth(clamp01((u - start) / OUTRO));
}

function outroGeo(u: number): number {
  const k = outroK(u);
  if (k <= OUTRO_HOLD) return 0;
  return smooth((k - OUTRO_HOLD) / (1 - OUTRO_HOLD));
}

export class SunsetSlam {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;

  private word: Path2D;
  private lut: string[] = [];
  private lastKey = "";
  private hover = 0;
  private hoverTo = 0;
  private lastNow = 0;

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    this.word = this.buildWord();
    this.buildLut();
    if (this.ok) this.resize();
  }

  private buildWord(): Path2D {
    const p = new Path2D();
    if (V_POLY.length > 1) {
      p.moveTo(V_POLY[0][0], V_POLY[0][1]);
      for (let i = 1; i < V_POLY.length; i++) p.lineTo(V_POLY[i][0], V_POLY[i][1]);
      p.closePath();
    }
    for (const [x, y, w, h] of RECTS) p.rect(x, y, w, h);
    return p;
  }

  private buildLut() {
    const raw: [number, number, number][] = [];
    for (let i = 0; i < 256; i++) {
      const u = i / 255;
      let k = RAMP.length - 2;
      for (let j = 0; j < RAMP.length - 1; j++) {
        if (u <= RAMP[j + 1][0]) { k = j; break; }
      }
      const [p0, c0] = RAMP[k];
      const [p1, c1] = RAMP[k + 1];
      const t = p1 > p0 ? (u - p0) / (p1 - p0) : 0;
      const e = t * t * (3 - 2 * t);
      raw.push([
        c0[0] + (c1[0] - c0[0]) * e,
        c0[1] + (c1[1] - c0[1]) * e,
        c0[2] + (c1[2] - c0[2]) * e,
      ]);
    }
    const R = 7;
    let src = raw;
    for (let pass = 0; pass < 2; pass++) {
      const out: [number, number, number][] = [];
      for (let i = 0; i < 256; i++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let o = -R; o <= R; o++) {
          const j = Math.max(0, Math.min(255, i + o));
          r += src[j][0]; g += src[j][1]; b += src[j][2]; n++;
        }
        out.push([r / n, g / n, b / n]);
      }
      src = out;
    }
    for (let i = 0; i < 256; i++) {
      this.lut[i] = `rgb(${Math.round(src[i][0])},${Math.round(src[i][1])},${Math.round(src[i][2])})`;
    }
  }

  private ramp(u: number): string {
    const q = BANDS > 0 ? Math.round(u * BANDS) / BANDS : u;
    const i = Math.max(0, Math.min(255, Math.round(q * 255)));
    return this.lut[i];
  }

  private rampRGB(u: number): [number, number, number] {
    const s = this.lut[Math.max(0, Math.min(255, Math.round(u * 255)))];
    const m = s.match(/\d+/g)!;
    return [+m[0], +m[1], +m[2]];
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.lastKey = "";
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastKey = "";
    this.lastNow = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(Math.max((now - this.lastNow) / 1000, 1 / 240), 0.1);
      this.lastNow = now;
      const rate = this.hoverTo > this.hover ? HOVER_IN : HOVER_OUT;
      this.hover += (this.hoverTo - this.hover) * (1 - Math.exp(-dt / rate));
      const span = FRAMES + SETTLE_BRIDGE + OUTRO;
      this.draw(bridged((((now - this.t0) / 1000) * FPS) % span));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  setHover(on: boolean) {
    this.hoverTo = on ? 1 : 0;
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(60);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  private draw(u: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const ok = outroK(u);
    const og = outroGeo(u);

    const ww = lerp(at(WW, u), WW[0], og);
    const wcy = lerp(at(WCY, u), WCY[0], og);
    const depth = at(D, u) * (1 - ok);
    let off = window3(OFF, IGNITE_AT, u);
    let span = window3(SPAN, IGNITE_AT, u);
    let tipp = window3(TIPP, IGNITE_AT, u);
    const ignited = u >= IGNITE_AT;

    if (u > REST_FROM) {
      const k = smooth(clamp01((u - REST_FROM) / (REST_FULL - REST_FROM)));
      off += (REST_OFF - off) * k;
      span += (REST_SPAN - span) * k;
      tipp += (REST_TIPP - tipp) * k;
    }

    const hv = this.hover;
    if (hv > 0.001) {
      off += HOVER_WARM * hv;
      span += HOVER_SPREAD * hv * Math.sign(span || 1);
      tipp += HOVER_WARM * hv;
    }

    const key = `${ww.toFixed(1)}|${wcy.toFixed(1)}|${depth.toFixed(1)}|${off.toFixed(4)}|${span.toFixed(4)}|${tipp.toFixed(4)}|${ignited}|${hv.toFixed(3)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, BG_TOP);
    sky.addColorStop(BG_HORIZON, BG_BOTTOM);
    sky.addColorStop(1, BG_TOP);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const sc = W / REF_W;
    ctx.translate(0, H / 2 - CONTENT_MID * sc);
    ctx.scale(sc, sc);

    const ws = ww / WORD_W;
    const wh = WORD_H * ws;
    const wx = REF_W / 2 - ww / 2;
    const wy = wcy - wh / 2;
    const baseline = wy + wh;
    const vpDist = VP_DEPTH * wh;
    const strokeW = 2 * OUTLINE * WORD_H;

    const copy = (f: number) => {
      const q = 1 - f;
      ctx.save();
      ctx.translate(REF_W / 2, baseline + vpDist);
      ctx.scale(q, q);
      ctx.translate(-REF_W / 2, -(baseline + vpDist));
      ctx.translate(wx, wy);
      ctx.scale(ws, ws);
    };

    {
      const peak = 322;
      const k = clamp01(depth / peak);
      const a =
        (BLOOM_REST + (BLOOM_ALPHA - BLOOM_REST) * smooth(k)) *
        (1 + (HOVER_BLOOM - 1) * hv) *
        (1 - ok);
      const cx = REF_W / 2;
      const cy = baseline + BLOOM_DROP * wh;
      const base = BLOOM_R * ww * (0.75 + 0.45 * k);
      for (const [rMul, aMul, pos] of BLOOM_LAYERS) {
        const r = base * rMul;
        const la = a * aMul;
        if (la < 0.004) continue;
        const [br, bg, bb] = this.rampRGB(pos);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${br},${bg},${bb},${la.toFixed(3)})`);
        g.addColorStop(0.45, `rgba(${br},${bg},${bb},${(la * 0.35).toFixed(3)})`);
        g.addColorStop(1, `rgba(${br},${bg},${bb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(-REF_W, -REF_W, REF_W * 3, REF_W * 3);
      }
    }

    if (ignited && depth > 1) {
      const n = Math.min(260, Math.max(12, Math.ceil(depth)));
      ctx.lineJoin = "miter";
      ctx.lineWidth = strokeW;
      for (let i = n; i >= 0; i--) {
        const dd = (depth * i) / n;
        copy(dd / vpDist);
        const df = dd / depth;
        let p = off + span * df;
        if (df > TIP_BAND_FROM) {
          const t = Math.min(1, (df - TIP_BAND_FROM) / (TIP_BAND_FULL - TIP_BAND_FROM));
          p += (tipp - p) * t;
        }
        const col = this.ramp(p);
        ctx.fillStyle = col;
        ctx.strokeStyle = col;
        ctx.fill(this.word);
        ctx.stroke(this.word);
        ctx.restore();
      }
    }

    copy(0);
    const faceG = ctx.createLinearGradient(0, 0, 0, WORD_H);
    faceG.addColorStop(0, FACE_MID);
    faceG.addColorStop(FACE_HILITE_AT, FACE_TOP);
    faceG.addColorStop(1, FACE_BOTTOM);
    ctx.fillStyle = faceG;
    ctx.fill(this.word);
    if (ignited) {
      const [rr, rg, rb] = this.rampRGB(Math.min(1, off + span * 0.55));
      const grad = ctx.createLinearGradient(0, WORD_H * (1 - FACE_RIM), 0, WORD_H);
      const rimA = FACE_RIM_ALPHA * (1 - ok);
      grad.addColorStop(0, `rgba(${rr},${rg},${rb},0)`);
      grad.addColorStop(1, `rgba(${rr},${rg},${rb},${rimA.toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fill(this.word);
    }
    ctx.restore();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
