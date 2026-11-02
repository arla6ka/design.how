import { FULL_VERT, TRAIL_FRAG, BRICK_FRAG } from "./shaders";
import { SIZE, blocks, bricks, scene, toon } from "./scene";
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";

type Style = {
  make: (real: HTMLCanvasElement) => HTMLCanvasElement;
  bg: [number, number, number];
  glow: [number, number, number];
  zoom?: number;
};
export const STYLES: Style[] = [
  { make: (real) => bricks(real), bg: [253, 246, 216], glow: [255, 222, 80] },
  { make: (real) => blocks(real), bg: [231, 244, 224], glow: [126, 211, 90] },
  { make: (real) => toon(real), bg: [240, 238, 240], glow: [226, 78, 78] },
];
export const STYLE_HOLD = 2.8;
export const STYLE_FADE = 0.28;

export type BrickFrameState = {
  tiltX: number;
  tiltY: number;
  glowX: number;
  glowY: number;
  glowI: number;
  bg: string;
  glowColor: string;
};

const TRAIL_RES = 220;
export const TRAIL_SIZE = 0.13;
export const TRAIL_SIZE_AUTO = 0.2;

const REAL_ZOOM = 1;
const REAL_SHIFT: [number, number] = [0, 0];

export class BrickReveal {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private display: WebGLProgram | null = null;
  private trail: WebGLProgram | null = null;
  private dLoc: Record<string, WebGLUniformLocation | null> = {};
  private tLoc: Record<string, WebGLUniformLocation | null> = {};
  private quad: WebGLBuffer | null = null;

  private styleTex: (WebGLTexture | null)[] = STYLES.map(() => null);
  private realTex: WebGLTexture | null = null;
  private blackTex: WebGLTexture | null = null;
  private styleAR = 1;
  private styleIdx = 0;
  private styleClock = 0;
  private styleMix = 0;

  private rtA: { fb: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private rtB: { fb: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private hasTrail = false;

  private raf = 0;
  private running = false;
  private visible = false;
  private painted = false;
  private destroyed = false;
  private last = 0;
  private time = 0;
  private idle = 3;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private px = 0.5;
  private py = 0.5;
  private tpx = 0.5;
  private tpy = 0.5;
  private active = 0;
  private autoActive = 0;
  private revealSize = TRAIL_SIZE;
  private parx = 0;
  private pary = 0;
  private tiltX = 0;
  private tiltY = 0;
  private glowX = 0.5;
  private glowY = 0.5;
  private glowI = 0;
  private onFrame?: (s: BrickFrameState) => void;
  private unwatch: (() => void) | null = null;
  onReady?: () => void;

  ok = false;

  constructor(host: HTMLElement, onFrame?: (s: BrickFrameState) => void) {
    this.host = host;
    this.onFrame = onFrame;
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      opacity: "0",
    });
    host.appendChild(this.canvas);

    const gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(this.canvas, () => {
      this.pause();
      this.ok = false;
    });
    gl.clearColor(0.06, 0.06, 0.07, 1);

    try {
      this.display = this.build(FULL_VERT, BRICK_FRAG);
      this.trail = this.build(FULL_VERT, TRAIL_FRAG);
    } catch {
      this.gl = null;
      return;
    }

    for (const u of ["uStyleA", "uStyleB", "uStyleMix", "uZoomA", "uZoomB", "uReal", "uTrail", "uCover", "uRealShift", "uRealZoom", "uParallax"]) {
      this.dLoc[u] = gl.getUniformLocation(this.display, u);
    }
    for (const u of ["uResolution", "uMap", "uPointer", "uActive", "uDt", "uTime", "uSize"]) {
      this.tLoc[u] = gl.getUniformLocation(this.trail, u);
    }

    const aPosD = gl.getAttribLocation(this.display, "aPosition");
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPosD);
    gl.vertexAttribPointer(aPosD, 2, gl.FLOAT, false, 0, 0);

    this.setupTrail();

    const ph = this.placeholder([40, 40, 45, 255]);
    this.styleTex = STYLES.map(() => ph);
    this.realTex = ph;
    this.blackTex = this.placeholder([0, 0, 0, 255]);
    const real = scene();
    this.realTex = this.upload(real);
    this.styleTex = STYLES.map((style) => this.upload(style.make(real)));
    this.styleAR = 1;
    void SIZE;

    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerenter", this.onEnter);
    this.canvas.addEventListener("pointerleave", this.onLeave);

    this.resize();
    this.ok = true;
  }

  private build(vs: string, fs: string): WebGLProgram {
    const gl = this.gl!;
    const c = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "compile failed");
      }
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, c(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, c(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "link failed");
    }
    return prog;
  }

  private placeholder(rgba: number[]): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
    return t;
  }

  private setupTrail() {
    const gl = this.gl!;
    const ext = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    const type = ext ? ext.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
    const make = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TRAIL_RES, TRAIL_RES, 0, gl.RGBA, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return ok ? { fb, tex } : null;
    };
    const a = make();
    const b = make();
    if (a && b) {
      this.rtA = a;
      this.rtB = b;
      this.hasTrail = true;
      for (const rt of [a, b]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fb);
        gl.viewport(0, 0, TRAIL_RES, TRAIL_RES);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0.06, 0.06, 0.07, 1);
    }
  }

  private upload(art: HTMLCanvasElement): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      return tex;
    }
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.tpx = (e.clientX - r.left) / r.width;
    this.tpy = 1 - (e.clientY - r.top) / r.height;
    this.active = 1;
    this.wake();
  };
  private onEnter = () => {
    this.active = 1;
    this.wake();
  };
  private onLeave = () => {
    this.active = 0;
  };

  private wake() {
    if (this.visible && !this.running) this.startLoop();
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    this.dpr = capDpr();
    this.w = r.width;
    this.h = r.height;
    const cw = Math.max(1, Math.round(this.w * this.dpr));
    const ch = Math.max(1, Math.round(this.h * this.dpr));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      this.gl?.viewport(0, 0, cw, ch);
      if (!this.running) this.renderOnce();
    }
  }

  private coverScale(imgAR: number): [number, number] {
    const cardAR = this.w / Math.max(1, this.h);
    if (cardAR > imgAR) return [1, imgAR / cardAR];
    return [cardAR / imgAR, 1];
  }

  start() {
    this.setVisible(true);
  }

  stop() {
    this.setVisible(false);
  }

  private setVisible(v: boolean) {
    if (!this.ok) return;
    this.visible = v;
    if (v) {
      this.resize();
      this.startLoop();
    } else {
      this.pause();
    }
  }

  private startLoop() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.resize();
    this.last = 0;
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private pause() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.resize();
    this.renderDisplay();
  }

  private renderOnce() {
    if (this.running) return;
    requestAnimationFrame(() => this.renderDisplay());
  }

  private frame(now: number) {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
    this.last = now;
    this.time += dt;
    this.idle = this.active ? 0 : this.idle + dt;

    this.styleClock += dt;
    if (this.styleClock < STYLE_HOLD) {
      this.styleMix = 0;
    } else if (this.styleClock < STYLE_HOLD + STYLE_FADE) {
      const t = (this.styleClock - STYLE_HOLD) / STYLE_FADE;
      this.styleMix = t * t * t * (t * (t * 6 - 15) + 10);
    } else {
      this.styleIdx = (this.styleIdx + 1) % STYLES.length;
      this.styleClock = 0;
      this.styleMix = 0;
    }

    const auto = Math.min(1, Math.max(0, this.idle - 0.4) / 0.9);
    const T = this.time;
    const FX = 0.5;
    const FY = 0.66;
    const ax =
      FX +
      0.16 * Math.sin(T * 1.15) +
      0.09 * Math.sin(T * 2.6 + 1.0) +
      0.05 * Math.cos(T * 4.1 + 0.4);
    const ay =
      FY +
      0.13 * Math.cos(T * 0.95 + 2.1) +
      0.07 * Math.sin(T * 2.2 + 0.5) +
      0.04 * Math.cos(T * 3.7 + 1.7);
    const cx = this.active ? this.tpx : this.tpx * (1 - auto) + ax * auto;
    const cy = this.active ? this.tpy : this.tpy * (1 - auto) + ay * auto;
    const rev = Math.max(this.active, auto);
    this.revealSize = TRAIL_SIZE + (TRAIL_SIZE_AUTO - TRAIL_SIZE) * (auto * (1 - this.active));

    this.px += (cx - this.px) * 0.4;
    this.py += (cy - this.py) * 0.4;
    this.autoActive = rev;

    const P = 0.02 + (0.07 - 0.02) * (auto * (1 - this.active));
    const targX = -(this.px - 0.5) * 2.0 * P * Math.max(rev, this.active);
    const targY = (this.py - 0.5) * 2.0 * P * Math.max(rev, this.active);
    this.parx += (targX - this.parx) * 0.045;
    this.pary += (targY - this.pary) * 0.045;

    const MAXDEG = 7.0 + 5.0 * (auto * (1 - this.active));
    const targRY = (this.px - 0.5) * 2.0 * MAXDEG;
    const targRX = (this.py - 0.5) * 2.0 * MAXDEG;
    this.tiltY += (targRY - this.tiltY) * 0.06;
    this.tiltX += (targRX - this.tiltX) * 0.06;

    const gTargX = this.px;
    const gTargY = 1.0 - this.py;
    this.glowX += (gTargX - this.glowX) * 0.08;
    this.glowY += (gTargY - this.glowY) * 0.08;
    const gTargI = 0.28 + 0.72 * rev + 0.4 * this.active;
    this.glowI += (gTargI - this.glowI) * 0.09;

    const cur = STYLES[this.styleIdx];
    const nxt = STYLES[(this.styleIdx + 1) % STYLES.length];
    const rgb = (a: [number, number, number], b: [number, number, number]) => {
      const m = this.styleMix;
      const r = Math.round(a[0] + (b[0] - a[0]) * m);
      const g = Math.round(a[1] + (b[1] - a[1]) * m);
      const bl = Math.round(a[2] + (b[2] - a[2]) * m);
      return `rgb(${r}, ${g}, ${bl})`;
    };

    this.onFrame?.({
      tiltX: this.tiltX,
      tiltY: this.tiltY,
      glowX: this.glowX,
      glowY: this.glowY,
      glowI: this.glowI,
      bg: rgb(cur.bg, nxt.bg),
      glowColor: rgb(cur.glow, nxt.glow),
    });

    if (this.hasTrail) this.stepTrail(dt);
    this.renderDisplay();
  }

  private stepTrail(dt: number) {
    const gl = this.gl!;
    if (!this.rtA || !this.rtB) return;
    gl.useProgram(this.trail);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rtB.fb);
    gl.viewport(0, 0, TRAIL_RES, TRAIL_RES);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rtA.tex);
    gl.uniform1i(this.tLoc.uMap, 0);
    gl.uniform2f(this.tLoc.uResolution, TRAIL_RES, TRAIL_RES);
    gl.uniform2f(this.tLoc.uPointer, this.px, this.py);
    gl.uniform1f(this.tLoc.uActive, this.autoActive);
    gl.uniform1f(this.tLoc.uDt, dt);
    gl.uniform1f(this.tLoc.uTime, this.time);
    gl.uniform1f(this.tLoc.uSize, this.revealSize);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const t = this.rtA;
    this.rtA = this.rtB;
    this.rtB = t;
  }

  private renderDisplay() {
    const gl = this.gl;
    if (!gl || !this.display) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.display);
    const texA = this.styleTex[this.styleIdx] ?? this.blackTex;
    const texB = this.styleTex[(this.styleIdx + 1) % STYLES.length] ?? texA;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(this.dLoc.uStyleA, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1i(this.dLoc.uStyleB, 1);
    gl.uniform1f(this.dLoc.uStyleMix, this.styleMix);
    gl.uniform1f(this.dLoc.uZoomA, STYLES[this.styleIdx].zoom ?? 1);
    gl.uniform1f(this.dLoc.uZoomB, STYLES[(this.styleIdx + 1) % STYLES.length].zoom ?? 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.realTex);
    gl.uniform1i(this.dLoc.uReal, 2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.hasTrail && this.rtA ? this.rtA.tex : this.blackTex);
    gl.uniform1i(this.dLoc.uTrail, 3);
    const [cx, cy] = this.coverScale(this.styleAR);
    gl.uniform2f(this.dLoc.uCover, cx, cy);
    gl.uniform2f(this.dLoc.uRealShift, REAL_SHIFT[0], REAL_SHIFT[1]);
    gl.uniform1f(this.dLoc.uRealZoom, REAL_ZOOM);
    gl.uniform2f(this.dLoc.uParallax, this.parx, this.pary);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!this.painted) {
      this.painted = true;
      this.canvas.style.opacity = "1";
    }
  }

  destroy() {
    this.destroyed = true;
    this.visible = false;
    this.pause();
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerenter", this.onEnter);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.unwatch?.();
    this.unwatch = null;
    const textures = new Set<WebGLTexture | null>([...this.styleTex, this.realTex, this.blackTex, this.rtA?.tex ?? null, this.rtB?.tex ?? null]);
    disposeGl(this.gl, {
      programs: [this.display, this.trail],
      buffers: [this.quad],
      textures: [...textures],
      framebuffers: [this.rtA?.fb, this.rtB?.fb],
    });
    this.gl = null;
    this.canvas.remove();
  }
}
