// Glass type (https://design.how/vault/glass-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (A_TEXT, B_WORDS, C_WORDS, LENS, DISPERSE, SCENE_SECONDS, POINTER_PULL, INK, PAPER, FONT_VAR, FONT_WEIGHT).
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";
import {
  PAPER,
  INK,
  A_TEXT,
  A_FRAMES,
  A_Y,
  A_TEXT_W,
  B_WORDS,
  B_FRAMES,
  B_SWAP_FRAME,
  B_R,
  B_TEXT_W,
  C_WORDS,
  C_FRAMES,
  C_SEGMENTS,
  C_X,
  C_TEXT_W,
  FPS,
  FONT_STACK,
  FONT_WEIGHT,
  LENS,
  B_R_SCALE,
  RIP_DRIFT,
  RING_WOBBLE,
  RING_STROKE,
  RING_THIN,
  RING_BOIL_FPS,
  SCENE_SECONDS,
  DISPERSE,
  POINTER_PULL,
  POINTER_EASE,
  POINTER_IN,
  POINTER_OUT,
  TEX_SS,
} from "./params";

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uU;
uniform vec2 uOff;      // content offset, px (where the word has moved to)
uniform vec2 uCen;      // lens centre, px — normally the frame centre
uniform float uRL;      // lens radius, px
uniform float uStr, uPow, uRip, uWave, uRim0;
uniform float uRipPh;   // ripple phase
uniform float uBall;    // 1 = clip content to the ball + draw its ring
uniform float uRingT;   // stepped boil time
uniform vec3 uInk, uPaper;

// The lens law, factored out so it can be evaluated per colour channel and
// differentiated for the caustics. k scales the pincushion term: dispersion is
// a per-channel change in how hard the glass bends, which is what a real lens
// does — it does not bend all wavelengths equally.
float magAt(float r, float k) {
  float rn = r / uRL;
  float m = 1.0
    + uStr * k * pow(clamp(rn, 0.0, 1.6), uPow)
    + uRip * sin(6.28318 * r / (uWave * uU) - uRipPh)
        * smoothstep(uRim0, 1.0, rn);
  return max(m, 0.35);
}

// Ink at a given magnification — one texture read.
float inkAt(vec2 q, vec2 c, float m) {
  vec2 src = c + q / m - uOff;
  return 1.0 - texture2D(uTex, src / uRes).r;
}

void main() {
  vec2 px = vUv * uRes;
  vec2 c = uCen;
  vec2 q = px - c;
  float r = length(q);
  float rn = r / uRL;

  // CHROMATIC ABERRATION. The channels refract by slightly different amounts,
  // scaled by rn so the fringe lives at the rim where the distortion already
  // peaks and the centre — where the type has to stay readable — stays neutral.
  float d = ${f(DISPERSE)} * clamp(rn, 0.0, 1.0);
  float mR = magAt(r, 1.0 + d);
  float mG = magAt(r, 1.0);
  float mB = magAt(r, 1.0 - d);

  vec3 ink = vec3(inkAt(q, c, mR), inkAt(q, c, mG), inkAt(q, c, mB));

  if (uBall > 0.5) {
    float th = atan(q.y, q.x);
    float wob =
        ${RING_WOBBLE.map(([k, a, s]) => `${f(a)} * sin(${k}.0 * th + ${f(s)} * uRingT)`).join(" + ")};
    float Rw = uRL * (1.0 + wob);
    // content lives only inside the glass
    float insideM = 1.0 - smoothstep(Rw - 1.5, Rw + 0.5, r);
    ink *= insideM;
    // the horizon itself: an ink ring whose weight breathes around the circle
    float w = ${f(RING_STROKE)} * uU * (${f(RING_THIN)} + (1.0 - ${f(RING_THIN)}) * (0.5 + 0.5 * sin(2.0 * th + 0.9 * uRingT)));
    float ring = 1.0 - smoothstep(w * 0.45, w, abs(r - Rw));
    ink = max(ink, vec3(ring));
  }

  vec3 col = mix(uPaper, uInk, clamp(ink, 0.0, 1.0));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

type SceneId = 0 | 1 | 2;

const hex = (s: string): [number, number, number] => [
  parseInt(s.slice(1, 3), 16) / 255,
  parseInt(s.slice(3, 5), 16) / 255,
  parseInt(s.slice(5, 7), 16) / 255,
];

function tableAt(tab: number[], f: number, lo = 0, hi = tab.length - 1) {
  const x = Math.min(Math.max(f, lo), hi);
  const i = Math.floor(x);
  const j = Math.min(i + 1, hi);
  return tab[i] + (tab[j] - tab[i]) * (x - i);
}

export class GlassType {
  ok = false;

  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private tex: WebGLTexture | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};

  private src: HTMLCanvasElement;
  private srcCtx: CanvasRenderingContext2D | null;
  private fontFamily = FONT_STACK;
  private texKey = "";

  private raf = 0;
  private running = false;
  private disposed = false;
  private unwatch: () => void = () => {};

  private scene: SceneId = 0;
  private sceneT0 = 0;
  private ptrX = 0.5;
  private ptrY = 0.5;
  private lensX = 0.5;
  private lensY = 0.5;
  private hover = 0;
  private hoverTo = 0;
  private lastNow = 0;
  private W = 0;
  private H = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.src = document.createElement("canvas");
    this.srcCtx = this.src.getContext("2d");
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    if (!gl || !this.srcCtx) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(canvas, () => {
      this.stop();
      this.disposed = true;
    });

    const compile = (type: number, s: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("[glass-type]", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const v = compile(gl.VERTEX_SHADER, VERT);
    const f = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return;
    this.prog = p;

    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    for (const n of [
      "uTex", "uRes", "uU", "uOff", "uRL", "uStr", "uPow", "uRip", "uWave",
      "uRim0", "uRipPh", "uBall", "uRingT", "uInk", "uPaper", "uCen",
    ]) this.u[n] = gl.getUniformLocation(p, n);

    this.tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.ok = true;
    this.sceneT0 = performance.now();
    this.resize();
  }

  setFont(family: string) {
    this.fontFamily = `${family}, ${FONT_STACK}`;
    this.texKey = "";
    if (!this.running && !this.disposed) this.renderStill();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.dpr = capDpr();
    this.W = Math.round(rect.width * this.dpr);
    this.H = Math.round(rect.height * this.dpr);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.src.width = this.W * TEX_SS;
    this.src.height = this.H * TEX_SS;
    this.texKey = "";
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || this.disposed || !this.ok) return;
    this.running = true;
    this.sceneT0 = performance.now() - this.pausedAt;
    this.raf = requestAnimationFrame(this.loop);
  }

  setPointer(p: { x: number; y: number } | null) {
    if (!p) {
      this.hoverTo = 0;
      return;
    }
    this.ptrX = p.x;
    this.ptrY = p.y;
    if (this.hoverTo === 0 && this.hover < 0.01) {
      this.lensX = p.x;
      this.lensY = p.y;
    }
    this.hoverTo = 1;
  }

  private pausedAt = 0;
  stop() {
    if (this.running) this.pausedAt = performance.now() - this.sceneT0;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.pausedAt > 0) {
      const frames = [A_FRAMES, B_FRAMES, C_FRAMES][this.scene];
      this.drawScene(this.scene, this.pausedAt % ((frames / FPS) * 1000));
      return;
    }
    this.drawScene(0, (A_FRAMES / 2 / FPS) * 1000);
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.unwatch();
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.tex] });
    this.gl = null;
    this.prog = null;
    this.quad = null;
    this.tex = null;
    this.srcCtx = null;
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(Math.max((now - this.lastNow) / 1000, 1 / 240), 0.1);
    this.lastNow = now;
    const hr = this.hoverTo > this.hover ? POINTER_IN : POINTER_OUT;
    this.hover += (this.hoverTo - this.hover) * (1 - Math.exp(-dt / hr));
    const k = 1 - Math.exp(-dt * POINTER_EASE);
    this.lensX += (this.ptrX - this.lensX) * k;
    this.lensY += (this.ptrY - this.lensY) * k;
    const el = now - this.sceneT0;
    const frames = [A_FRAMES, B_FRAMES, C_FRAMES][this.scene];
    const loopMs = (frames / FPS) * 1000;
    if (el >= SCENE_SECONDS * 1000 && el % loopMs < 40) {
      this.scene = ((this.scene + 1) % 3) as SceneId;
      this.sceneT0 = performance.now();
      this.drawScene(this.scene, 0);
    } else {
      this.drawScene(this.scene, el % loopMs);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private setContent(text: string, widthU: number, U: number) {
    const key = `${text}|${widthU.toFixed(3)}|${U.toFixed(1)}|${this.fontFamily}`;
    if (key === this.texKey) return;
    this.texKey = key;
    const ctx = this.srcCtx!;
    const S = TEX_SS;
    const W = this.W * S;
    const H = this.H * S;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${FONT_WEIGHT} 100px ${this.fontFamily}`;
    const w100 = ctx.measureText(text).width || 1;
    const size = (widthU * U * S * 100) / w100;
    ctx.font = `${FONT_WEIGHT} ${size}px ${this.fontFamily}`;
    ctx.fillText(text, W / 2, H / 2);

    const gl = this.gl!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.src);
  }

  private drawScene(scene: SceneId, ms: number) {
    const gl = this.gl;
    if (!gl || this.disposed || !this.prog || !this.W) return;
    const { W, H } = this;
    const U = Math.min(H, W / (16 / 9));
    const f = (ms / 1000) * FPS;
    const t = ms / 1000;

    let offX = 0;
    let offY = 0;
    let rl = 1;
    let ball = 0;
    const lens = [LENS.a, LENS.b, LENS.c][scene];

    if (scene === 0) {
      this.setContent(A_TEXT, A_TEXT_W, U);
      offY = -(tableAt(A_Y, f) - 0.5) * U;
      rl = lens.rl * U;
    } else if (scene === 1) {
      const word = B_WORDS[f >= B_SWAP_FRAME ? 1 : 0];
      this.setContent(word, B_TEXT_W, U);
      rl = tableAt(B_R, f) * B_R_SCALE * U * (lens.rl / 0.49);
      ball = 1;
    } else {
      const seg = C_SEGMENTS.findIndex(([a, b]) => f >= a && f <= b + 1);
      const s = seg < 0 ? 2 : seg;
      this.setContent(C_WORDS[s], C_TEXT_W, U);
      offX = tableAt(C_X, f, C_SEGMENTS[s][0], C_SEGMENTS[s][1]) * U;
      rl = lens.rl * U;
    }

    gl.viewport(0, 0, W, H);
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(this.prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform2f(this.u.uRes, W, H);
    gl.uniform1f(this.u.uU, U);
    gl.uniform2f(this.u.uOff, offX, offY);
    const pull = this.hover * POINTER_PULL;
    gl.uniform2f(
      this.u.uCen,
      W * (0.5 + (this.lensX - 0.5) * pull),
      H * (0.5 - (this.lensY - 0.5) * pull),
    );
    gl.uniform1f(this.u.uRL, rl);
    gl.uniform1f(this.u.uStr, lens.str);
    gl.uniform1f(this.u.uPow, lens.pow);
    gl.uniform1f(this.u.uRip, lens.rip);
    gl.uniform1f(this.u.uWave, lens.wave);
    gl.uniform1f(this.u.uRim0, lens.rim0);
    gl.uniform1f(this.u.uRipPh, t * RIP_DRIFT);
    gl.uniform1f(this.u.uBall, ball);
    gl.uniform1f(this.u.uRingT, Math.floor(t * RING_BOIL_FPS) / RING_BOIL_FPS);
    gl.uniform3fv(this.u.uInk, hex(INK));
    gl.uniform3fv(this.u.uPaper, hex(PAPER));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
