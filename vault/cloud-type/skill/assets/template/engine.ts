// Cloud type (https://design.how/vault/cloud-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (GROUND, GLYPHS, PLAY_RATE, DRIFT_PER_FRAME, ENTRY.thr, EXIT.thr, DITHER, WIND, FONT_VAR, FONT_WEIGHT).
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";
import {
  CAP,
  DITHER,
  FONT_WEIGHT,
  FRAMES,
  GLYPHS,
  GROUND_RGB,
  LEVELS,
  LEVEL_RES,
  LOOP_MS,
  SCENE_H,
  SCENE_W,
  STILL_FRAME,
  STROKE_THICKEN,
  WIND,
  approach,
  frameAt,
  glyphState,
  levelMix,
  levelPad,
  thresholdAt,
  type Wind,
} from "./params";

const VERT_QUAD = `#version 300 es
precision highp float;
layout(location = 0) in vec2 q;
uniform vec2 uCentre;    // scene px
uniform vec2 uHalf;      // half extent of the drawn quad, scene px (already scaled)
uniform vec2 uScene;     // scene size
out vec2 vRel;           // scene px from the glyph centre, unscaled
uniform float uScale;
void main() {
  vec2 p = uCentre + q * uHalf;
  vRel = (q * uHalf) / uScale;
  vec2 ndc = vec2(p.x / uScene.x * 2.0 - 1.0, 1.0 - p.y / uScene.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

const FRAG_FIELD = `#version 300 es
precision highp float;
in vec2 vRel;
uniform sampler2D uAtlas;
uniform vec4 uCellA; // uv origin xy, uv size zw
uniform vec2 uExtA;  // half extent of cell A in scene px
uniform vec4 uCellB;
uniform vec2 uExtB;
uniform float uMix;
uniform float uAmp;
uniform vec2 uTexel;  // one atlas texel in uv
out vec4 o;
float cell(vec4 c, vec2 ext) {
  vec2 n = vRel / (2.0 * ext) + 0.5;
  if (n.x < 0.0 || n.x > 1.0 || n.y < 0.0 || n.y > 1.0) return 0.0;
  // Keep the bilinear footprint inside the cell.
  vec2 uv = c.xy + uTexel * 0.5 + n * (c.zw - uTexel);
  return texture(uAtlas, uv).r;
}
void main() {
  float v = mix(cell(uCellA, uExtA), cell(uCellB, uExtB), uMix) * uAmp;
  o = vec4(v * 0.5, 0.0, 0.0, 1.0);
}`;

const VERT_FULL = `#version 300 es
precision highp float;
layout(location = 0) in vec2 q;
out vec2 vUv;
void main() {
  vUv = q * 0.5 + 0.5;
  gl_Position = vec4(q, 0.0, 1.0);
}`;

const FRAG_FINAL = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
uniform sampler2D uField;
uniform float uThr;
uniform float uSigma;
uniform float uBias;
uniform uint uFrame;
uniform vec2 uScene;
uniform vec2 uDevice;   // device px of the canvas
uniform vec3 uGround;
uniform float uReach;
out vec4 o;
uint lowbias32(uint x) {
  x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x;
}
float rnd(uvec3 p) {
  return float(lowbias32(p.x ^ lowbias32(p.y ^ lowbias32(p.z)))) / 4294967296.0;
}
float erfApprox(float x) {
  float s = sign(x); float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return s * y;
}
void main() {
  // The field was drawn with scene y down mapped to ndc y up, so its rows
  // already run the way the screen does: sample straight.
  vec2 uv = vUv;
  float v = texture(uField, uv).r * 2.0;
  // Gradient per scene pixel: the field is sampled once per device pixel.
  vec2 pxPerScene = uDevice / uScene;
  float gx = dFdx(v) * pxPerScene.x;
  float gy = dFdy(v) * pxPerScene.y;
  float g = max(length(vec2(gx, gy)), 1e-4);
  float d = (uThr - v) / g;              // + outside the cut
  // The grain lives only where the cut actually passes nearby. A flat
  // stretch of field that sits near the threshold without crossing it is
  // not an edge, so look R scene px around: if every tap is on this side of
  // the cut, decide plainly.
  vec2 stepUv = vec2(uReach) / uScene;
  float lo = v; float hi = v;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398163;
    float s = texture(uField, uv + vec2(cos(a), sin(a)) * stepUv).r * 2.0;
    lo = min(lo, s); hi = max(hi, s);
  }
  bool crossing = lo <= uThr && hi >= uThr;
  float z = -(d + uBias) / (uSigma * 1.41421356);
  float p = crossing ? 0.5 * (1.0 + erfApprox(z)) : (v > uThr ? 1.0 : 0.0);
  vec2 sp = vec2(uv.x, 1.0 - uv.y) * uScene; // scene px, y down
  float r = rnd(uvec3(uint(floor(sp.x)), uint(floor(sp.y)), uFrame));
  float on = r < p ? 1.0 : 0.0;
  o = vec4(mix(uGround, vec3(1.0), on), 1.0);
}`;

interface Cell {
  u: number;
  v: number;
  uw: number;
  vh: number;
  ex: number;
  ey: number;
}

export class CloudType {
  private gl: WebGL2RenderingContext | null;
  private progField: WebGLProgram | null = null;
  private progFinal: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private atlas: WebGLTexture | null = null;
  private field: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private cells: Cell[][] = [];
  private atlasSize: [number, number] = [1, 1];
  private uField: Record<string, WebGLUniformLocation | null> = {};
  private uFinal: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private ready = false;
  private wind: Wind = { x: 0, y: 0, a: 0 };
  private windOn = false;
  private windTarget = { x: 0, y: 0 };
  private lastNow = 0;
  private unwatch: () => void = () => {};
  private lost = false;

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private family: string = "sans-serif",
  ) {
    this.gl = canvas.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false, depth: false, stencil: false });
    this.ok = !!this.gl;
    if (!this.gl) return;
    this.unwatch = watchContextLoss(canvas, () => {
      this.stop();
      this.lost = true;
    });
    this.setup();
    this.buildAtlas();
    this.resize();
  }

  private program(vs: string, fs: string): WebGLProgram | null {
    const gl = this.gl!;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = mk(gl.VERTEX_SHADER, vs);
    const f = mk(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  private setup() {
    const gl = this.gl!;
    this.progField = this.program(VERT_QUAD, FRAG_FIELD);
    this.progFinal = this.program(VERT_FULL, FRAG_FINAL);
    if (!this.progField || !this.progFinal) return;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    for (const n of ["uCentre", "uHalf", "uScene", "uScale", "uAtlas", "uCellA", "uExtA", "uCellB", "uExtB", "uMix", "uTexel", "uAmp"]) this.uField[n] = gl.getUniformLocation(this.progField, n);
    for (const n of ["uField", "uThr", "uSigma", "uBias", "uFrame", "uScene", "uDevice", "uGround", "uReach"]) this.uFinal[n] = gl.getUniformLocation(this.progFinal, n);
    this.field = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.field);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, SCENE_W, SCENE_H, 0, gl.RED, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.field, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ready = true;
  }

  private font(px: number): string {
    return `${FONT_WEIGHT} ${px}px ${this.family}`;
  }

  private rasterGlyph(k: number, res: number, pad: number): { data: Float32Array; w: number; h: number } {
    const g = GLYPHS[k];
    const cw = Math.ceil((g.w + 2 * pad) * res);
    const ch = Math.ceil((g.h + 2 * pad) * res);
    const big = 600;
    const c = document.createElement("canvas");
    c.width = big;
    c.height = big;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const fontPx = (CAP / 0.72) * 2;
    ctx.font = this.font(fontPx);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineJoin = "round";
    ctx.lineWidth = STROKE_THICKEN * 2;
    ctx.fillText(g.ch, 100, 420);
    ctx.strokeText(g.ch, 100, 420);
    const px = ctx.getImageData(0, 0, big, big).data;
    let x0 = big;
    let x1 = -1;
    let y0 = big;
    let y1 = -1;
    for (let y = 0; y < big; y++) {
      for (let x = 0; x < big; x++) {
        if (px[(y * big + x) * 4 + 3] < 128) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    const cell = document.createElement("canvas");
    cell.width = cw;
    cell.height = ch;
    const cc = cell.getContext("2d", { willReadFrequently: true })!;
    cc.imageSmoothingEnabled = true;
    cc.imageSmoothingQuality = "high";
    if (x1 >= x0 && y1 >= y0) {
      cc.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad * res, pad * res, g.w * res, g.h * res);
    }
    const d = cc.getImageData(0, 0, cw, ch).data;
    const out = new Float32Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) out[i] = d[i * 4 + 3] / 255;
    return { data: out, w: cw, h: ch };
  }

  private boxes(sizes: number[], src: Float32Array, w: number, h: number): Float32Array {
    let cur = src;
    for (const s of sizes) {
      const r = Math.max(0, (s - 1) / 2) | 0;
      if (r === 0) continue;
      const tmp = new Float32Array(w * h);
      const out = new Float32Array(w * h);
      const iarr = 1 / (r + r + 1);
      for (let y = 0; y < h; y++) {
        const row = y * w;
        let acc = 0;
        for (let j = -r; j <= r; j++) acc += cur[row + Math.min(w - 1, Math.max(0, j))];
        for (let x = 0; x < w; x++) {
          tmp[row + x] = acc * iarr;
          const add = cur[row + Math.min(w - 1, x + r + 1)];
          const sub = cur[row + Math.max(0, x - r)];
          acc += add - sub;
        }
      }
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let j = -r; j <= r; j++) acc += tmp[Math.min(h - 1, Math.max(0, j)) * w + x];
        for (let y = 0; y < h; y++) {
          out[y * w + x] = acc * iarr;
          const add = tmp[Math.min(h - 1, y + r + 1) * w + x];
          const sub = tmp[Math.max(0, y - r) * w + x];
          acc += add - sub;
        }
      }
      cur = out;
    }
    return cur;
  }

  buildAtlas() {
    const gl = this.gl;
    if (!gl || !this.ready) return;
    const ATLAS_W = 2048;
    const GUTTER = 4;
    type Piece = { k: number; i: number; data: Float32Array; w: number; h: number; pad: number; res: number };
    const pieces: Piece[] = [];
    for (let i = 0; i < LEVELS.length; i++) {
      const res = LEVEL_RES[i];
      const pad = levelPad(i);
      for (let k = 0; k < GLYPHS.length; k++) {
        const r = this.rasterGlyph(k, res, pad);
        const blurred = LEVELS[i] > 0 ? this.gauss(r.data, r.w, r.h, LEVELS[i] * res) : r.data;
        pieces.push({ k, i, data: blurred, w: r.w, h: r.h, pad, res });
      }
    }
    pieces.sort((a, b) => b.h - a.h);
    let x = 0;
    let y = 0;
    let shelf = 0;
    const placed: { p: Piece; x: number; y: number }[] = [];
    for (const p of pieces) {
      if (x + p.w + GUTTER > ATLAS_W) {
        x = 0;
        y += shelf + GUTTER;
        shelf = 0;
      }
      placed.push({ p, x, y });
      x += p.w + GUTTER;
      shelf = Math.max(shelf, p.h);
    }
    const ATLAS_H = y + shelf + GUTTER;
    this.atlasSize = [ATLAS_W, ATLAS_H];
    const buf = new Uint8Array(ATLAS_W * ATLAS_H);
    this.cells = GLYPHS.map(() => []);
    for (const { p, x: px, y: py } of placed) {
      for (let yy = 0; yy < p.h; yy++) {
        for (let xx = 0; xx < p.w; xx++) {
          buf[(py + yy) * ATLAS_W + px + xx] = Math.round(Math.min(1, Math.max(0, p.data[yy * p.w + xx])) * 255);
        }
      }
      const g = GLYPHS[p.k];
      this.cells[p.k][p.i] = {
        u: px / ATLAS_W,
        v: py / ATLAS_H,
        uw: p.w / ATLAS_W,
        vh: p.h / ATLAS_H,
        ex: g.w / 2 + p.pad,
        ey: g.h / 2 + p.pad,
      };
    }
    if (this.atlas) gl.deleteTexture(this.atlas);
    this.atlas = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, ATLAS_W, ATLAS_H, 0, gl.RED, gl.UNSIGNED_BYTE, buf);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  private gauss(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
    const wl = Math.floor(Math.sqrt((12 * sigma * sigma) / 3 + 1));
    const wlo = wl % 2 === 0 ? wl - 1 : wl;
    const wu = wlo + 2;
    const m = Math.round((12 * sigma * sigma - 3 * wlo * wlo - 12 * wlo - 9) / (-4 * wlo - 4));
    const sizes = [0, 1, 2].map((i) => (i < m ? wlo : wu));
    return this.boxes(sizes, src, w, h);
  }

  refreshFont(family?: string) {
    if (family) this.family = family;
    this.buildAtlas();
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const box = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    const dpr = capDpr();
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    if (!this.running) this.renderStill();
  }

  setWind(x: number, y: number) {
    if (!this.windOn && this.wind.a < 0.01) {
      this.wind.x = x;
      this.wind.y = y;
    }
    this.windTarget.x = x;
    this.windTarget.y = y;
    this.windOn = true;
  }

  clearWind() {
    this.windOn = false;
  }

  private stepWind(dtMs: number) {
    const target = this.windOn ? 1 : 0;
    this.wind.a += (target - this.wind.a) * approach(dtMs, WIND.presenceMs);
    if (Math.abs(this.wind.a - target) < 0.002) this.wind.a = target;
    const f = approach(dtMs, WIND.followMs);
    this.wind.x += (this.windTarget.x - this.wind.x) * f;
    this.wind.y += (this.windTarget.y - this.wind.y) * f;
  }

  render(frame: number) {
    const gl = this.gl;
    if (!gl || this.lost || !this.ready || !this.atlas || !this.progField || !this.progFinal) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, SCENE_W, SCENE_H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.progField);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.uniform1i(this.uField.uAtlas, 0);
    gl.uniform2f(this.uField.uScene, SCENE_W, SCENE_H);
    gl.uniform2f(this.uField.uTexel, 1 / this.atlasSize[0], 1 / this.atlasSize[1]);
    for (let k = 0; k < GLYPHS.length; k++) {
      const g = GLYPHS[k];
      const s = glyphState(g, frame, this.wind.a > 0 ? this.wind : null);
      if (s.amp <= 0.001) continue;
      const mixv = levelMix(s.sig);
      const A = this.cells[k][mixv.a];
      const B = this.cells[k][mixv.b];
      if (!A || !B) continue;
      const ex = Math.max(A.ex, B.ex) * s.sc;
      const ey = Math.max(A.ey, B.ey) * s.sc;
      gl.uniform2f(this.uField.uCentre, g.x0 + g.w / 2 + s.dx, g.y0 + g.h / 2 + s.dy);
      gl.uniform2f(this.uField.uHalf, ex, ey);
      gl.uniform1f(this.uField.uScale, s.sc);
      gl.uniform4f(this.uField.uCellA, A.u, A.v, A.uw, A.vh);
      gl.uniform2f(this.uField.uExtA, A.ex, A.ey);
      gl.uniform4f(this.uField.uCellB, B.u, B.v, B.uw, B.vh);
      gl.uniform2f(this.uField.uExtB, B.ex, B.ey);
      gl.uniform1f(this.uField.uMix, mixv.t);
      gl.uniform1f(this.uField.uAmp, s.amp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.progFinal);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.field);
    gl.uniform1i(this.uFinal.uField, 0);
    gl.uniform1f(this.uFinal.uThr, thresholdAt(frame));
    gl.uniform1f(this.uFinal.uSigma, DITHER.sigma);
    gl.uniform1f(this.uFinal.uBias, DITHER.bias);
    gl.uniform1ui(this.uFinal.uFrame, Math.floor(frame) >>> 0);
    gl.uniform2f(this.uFinal.uScene, SCENE_W, SCENE_H);
    gl.uniform2f(this.uFinal.uDevice, this.canvas.width, this.canvas.height);
    gl.uniform3f(this.uFinal.uGround, GROUND_RGB[0], GROUND_RGB[1], GROUND_RGB[2]);
    gl.uniform1f(this.uFinal.uReach, DITHER.reach);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  start() {
    if (this.running || !this.ok || this.lost) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastNow = this.t0;
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(100, Math.max(0, now - this.lastNow));
      this.lastNow = now;
      if (this.windOn || this.wind.a > 0) this.stepWind(dt);
      const t = (this.elapsed + (now - this.t0)) % LOOP_MS;
      this.render(frameAt(t));
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.running) this.elapsed = (this.elapsed + (performance.now() - this.t0)) % LOOP_MS;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.render(STILL_FRAME);
  }

  destroy() {
    this.stop();
    this.unwatch();
    disposeGl(this.gl, {
      programs: [this.progField, this.progFinal],
      buffers: [this.quad],
      textures: [this.atlas, this.field],
      framebuffers: [this.fbo],
    });
    this.gl = null;
    this.atlas = this.field = null;
    this.fbo = null;
    this.quad = null;
    this.progField = this.progFinal = null;
  }
}

export const FRAME_COUNT = FRAMES;
