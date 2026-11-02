// Chromatic glow (https://design.how/vault/chroma-glow), engine.ts.
// FIXED. Change the VARIABLE values in params instead (HERO_CYCLE, CHROMA_PRESETS, split, bloom, spectral).
import { FULL_VERT, BLUR_FRAG, COMPOSITE_FRAG } from "./shaders";
import { makeWordMask } from "./text-mask";
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";

export const FONT_VAR = "--visual-wide";

export type ChromaParams = {
  word: string;
  bloom: number;
  split: number;
  core: number;
  noise: number;
  spectral: number;
  warm: [number, number, number];
  cool: [number, number, number];
  red: [number, number, number];
  bg: [number, number, number];
  invert: boolean;
};

export const CHROMA_DEFAULTS: ChromaParams = {
  word: "boom",
  bloom: 1.62,
  split: 9.0,
  core: 1.06,
  noise: 0.15,
  spectral: 0.6,

  warm: [1.0, 0.66, 0.5],
  cool: [0.42, 0.6, 0.95],
  red: [1.0, 0.42, 0.6],
  bg: [0.11, 0.13, 0.2],
  invert: false,
};

const LEVELS = [
  { scale: 0.5, radius: 1.5 },
  { scale: 0.25, radius: 2.0 },
  { scale: 0.125, radius: 2.5 },
  { scale: 0.0625, radius: 3.0 },
];

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };

export class ChromaGlow {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;

  private blurProg: WebGLProgram | null = null;
  private compProg: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private blurLoc: Record<string, WebGLUniformLocation | null> = {};
  private compLoc: Record<string, WebGLUniformLocation | null> = {};

  private mask: WebGLTexture | null = null;
  private maskW = 1;
  private maskH = 1;
  private levels: { out: Target; tmp: Target }[] = [];

  private raf = 0;
  private running = false;
  private awake = false;
  private startT = 0;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private fontFamily = "sans-serif";
  private unwatch: (() => void) | null = null;
  private params: ChromaParams;

  private builtW = 0;
  private builtH = 0;
  private builtWord = "";
  private builtFont = "";
  private buildScheduled = 0;
  private destroyed = false;
  private painted = false;

  private px = 0;
  private py = 0;
  private tpx = 0;
  private tpy = 0;
  private active = 0;
  private tActive = 0;
  private fx = 0;
  private fy = 0;

  private cycle = false;
  private cycleWords: string[] = [];
  private cyclePalettes: Partial<ChromaParams>[] = [];
  private cycleIdx = 0;
  private cyclePhase: "hold" | "out" | "in" = "hold";
  private cyclePhaseT = 0;
  private holdDur = 1.15;
  private outDur = 0.24;
  private inDur = 0.32;
  private disperse = 0;
  private nextPending = false;
  private lastNow = 0;
  private palFrom: Partial<ChromaParams> | null = null;
  private palTo: Partial<ChromaParams> | null = null;
  private palMix = 1;

  ok = false;

  constructor(host: HTMLElement, params?: Partial<ChromaParams>) {
    this.host = host;
    this.params = { ...CHROMA_DEFAULTS, ...params };
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
      this.stop();
      this.ok = false;
    });

    try {
      this.blurProg = this.build(FULL_VERT, BLUR_FRAG);
      this.compProg = this.build(FULL_VERT, COMPOSITE_FRAG);
    } catch {
      this.gl = null;
      return;
    }

    for (const u of ["uTex", "uDir"]) {
      this.blurLoc[u] = gl.getUniformLocation(this.blurProg, u);
    }
    for (const u of [
      "uMask", "uB0", "uB1", "uB2", "uB3", "uSplit", "uBloom", "uWarm", "uCool",
      "uRed", "uCore", "uBg", "uInvert", "uNoise", "uTime", "uAspect", "uResolution",
      "uSpectral", "uCursor", "uCursorOn", "uDisperse",
    ]) {
      this.compLoc[u] = gl.getUniformLocation(this.compProg, u);
    }

    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    gl.clearColor(this.params.bg[0], this.params.bg[1], this.params.bg[2], 1);

    this.resize();
    void this.buildMaskNow();

    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerenter", this.onEnter);
    this.canvas.addEventListener("pointerleave", this.onLeave);
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

  private makeTarget(w: number, h: number): Target {
    const gl = this.gl!;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  private allocLevels() {
    const gl = this.gl;
    if (!gl) return;
    this.freeLevels();
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.levels = LEVELS.map((l) => {
      const w = Math.max(2, Math.round(cw * l.scale));
      const h = Math.max(2, Math.round(ch * l.scale));
      return { out: this.makeTarget(w, h), tmp: this.makeTarget(w, h) };
    });
  }

  private freeLevels() {
    const gl = this.gl;
    if (!gl) return;
    for (const lv of this.levels) {
      gl.deleteFramebuffer(lv.out.fb);
      gl.deleteTexture(lv.out.tex);
      gl.deleteFramebuffer(lv.tmp.fb);
      gl.deleteTexture(lv.tmp.tex);
    }
    this.levels = [];
  }

  setFont(family: string) {
    if (family === this.fontFamily) return;
    this.fontFamily = family;
    this.scheduleBuild();
  }

  setParams(p: Partial<ChromaParams>) {
    const wordChanged = p.word !== undefined && p.word !== this.params.word;
    this.params = { ...this.params, ...p };
    if (wordChanged) this.scheduleBuild();
    else if (!this.running) this.renderOnce();
  }

  enableCycle(words: string[], palettes: Partial<ChromaParams>[]) {
    if (!words.length) return;
    this.cycle = true;
    this.cycleWords = words;
    this.cyclePalettes = palettes;
    this.cycleIdx = 0;
    this.cyclePhase = "hold";
    this.cyclePhaseT = 0;
    this.palMix = 1;
    this.palFrom = palettes[0] ?? null;
    this.palTo = palettes[0] ?? null;
    this.params = { ...this.params, word: words[0], ...(palettes[0] ?? {}) };
    this.scheduleBuild();
  }

  private lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  private lerp3(
    a: [number, number, number], b: [number, number, number], t: number,
  ): [number, number, number] {
    return [this.lerp(a[0], b[0], t), this.lerp(a[1], b[1], t), this.lerp(a[2], b[2], t)];
  }

  private tweenedPalette(): ChromaParams {
    const base = this.params;
    if (!this.palFrom || !this.palTo || this.palMix >= 1) {
      const to = this.palTo ?? {};
      return { ...base, ...to };
    }
    const f = { ...base, ...this.palFrom };
    const g = { ...base, ...this.palTo };
    const t = this.palMix;
    return {
      ...base,
      warm: this.lerp3(f.warm, g.warm, t),
      cool: this.lerp3(f.cool, g.cool, t),
      red: this.lerp3(f.red, g.red, t),
      bg: this.lerp3(f.bg, g.bg, t),
      split: this.lerp(f.split, g.split, t),
      bloom: this.lerp(f.bloom, g.bloom, t),
      core: this.lerp(f.core, g.core, t),
      noise: this.lerp(f.noise, g.noise, t),
      spectral: this.lerp(f.spectral, g.spectral, t),
      invert: t < 0.5 ? f.invert : g.invert,
    };
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.tpx = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.tpy = -(((e.clientY - r.top) / r.height) * 2 - 1);
    this.tActive = 1;
    this.wake();
  };
  private onEnter = () => {
    this.tActive = 1;
    this.wake();
  };
  private onLeave = () => {
    this.tActive = 0;
    this.tpx = 0;
    this.tpy = 0;
    this.wake();
  };

  private wake() {
    if (this.awake && !this.running) this.start();
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
      this.allocLevels();
      this.scheduleBuild();
    } else if (this.levels.length === 0) {
      this.allocLevels();
    }
  }

  private maskSize(): [number, number] {
    const MAX_W = 1400;
    const mw = Math.max(2, Math.min(MAX_W, Math.round(this.w * this.dpr)));
    const mh = Math.max(2, Math.round(mw * (this.h / Math.max(1, this.w))));
    return [mw, mh];
  }

  private scheduleBuild() {
    if (!this.gl || this.destroyed) return;
    const [mw, mh] = this.maskSize();
    if (
      mw === this.builtW && mh === this.builtH &&
      this.params.word === this.builtWord && this.fontFamily === this.builtFont
    ) return;
    if (this.buildScheduled) return;
    const run = () => {
      this.buildScheduled = 0;
      void this.buildMaskNow();
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    this.buildScheduled = ric ? ric(run, { timeout: 200 }) : window.setTimeout(run, 0);
  }

  private async buildMaskNow() {
    const gl = this.gl;
    if (!gl || this.destroyed) return;
    if (this.buildScheduled) {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (cic) cic(this.buildScheduled);
      else window.clearTimeout(this.buildScheduled);
      this.buildScheduled = 0;
    }
    const [mw, mh] = this.maskSize();
    this.builtW = mw;
    this.builtH = mh;
    this.builtWord = this.params.word;
    this.builtFont = this.fontFamily;
    const art = await makeWordMask(this.params.word, mw, mh, this.fontFamily);
    if (!this.gl || this.destroyed) return;
    if (!this.mask) this.mask = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.mask);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    this.maskW = art.width;
    this.maskH = art.height;
    if (!this.running) this.renderOnce();
  }

  start() {
    if (!this.ok) return;
    this.awake = true;
    if (this.running) return;
    this.running = true;
    this.resize();
    if (!this.startT) this.startT = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.awake = false;
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private renderOnce() {
    if (this.raf) return;
    this.raf = requestAnimationFrame((t) => {
      this.raf = 0;
      this.render(t);
    });
  }

  private frame(now: number) {
    const k = 0.08;
    this.px += (this.tpx - this.px) * k;
    this.py += (this.tpy - this.py) * k;
    this.active += (this.tActive - this.active) * 0.06;

    const t = (now - (this.startT || now)) / 1000;
    const T = t * 3.2;
    const ax =
      0.16 * Math.sin(T * 1.15) +
      0.09 * Math.sin(T * 2.6 + 1.0) +
      0.05 * Math.cos(T * 4.1 + 0.4);
    const ay =
      0.13 * Math.cos(T * 0.95 + 2.1) +
      0.07 * Math.sin(T * 2.2 + 0.5) +
      0.04 * Math.cos(T * 3.7 + 1.7);
    this.fx += (ax - this.fx) * 0.2;
    this.fy += (ay - this.fy) * 0.2;

    if (this.cycle) {
      const dt = this.lastNow ? Math.min(0.05, (now - this.lastNow) / 1000) : 1 / 60;
      this.stepCycle(dt);
    }
    this.lastNow = now;

    this.render(now);
  }

  private stepCycle(dt: number) {
    this.cyclePhaseT += dt;
    const easeIn = (x: number) => x * x;
    const easeOut = (x: number) => 1 - (1 - x) * (1 - x);

    if (this.cyclePhase === "hold") {
      this.disperse += (0 - this.disperse) * Math.min(1, dt * 12);
      if (this.cyclePhaseT >= this.holdDur) {
        this.palFrom = this.cyclePalettes[this.cycleIdx] ?? null;
        const nextIdx = (this.cycleIdx + 1) % this.cycleWords.length;
        this.palTo = this.cyclePalettes[nextIdx] ?? this.palFrom;
        this.palMix = 0;
        this.nextPending = true;
        this.cyclePhase = "out";
        this.cyclePhaseT = 0;
      }
    } else if (this.cyclePhase === "out") {
      const k = Math.min(1, this.cyclePhaseT / this.outDur);
      this.disperse = easeIn(k);
      this.palMix = 0.5 * k;
      if (k >= 1) {
        if (this.nextPending) {
          this.nextPending = false;
          this.cycleIdx = (this.cycleIdx + 1) % this.cycleWords.length;
          this.params = { ...this.params, word: this.cycleWords[this.cycleIdx] };
          void this.buildMaskNow();
        }
        this.cyclePhase = "in";
        this.cyclePhaseT = 0;
      }
    } else {
      const k = Math.min(1, this.cyclePhaseT / this.inDur);
      this.disperse = 1 - easeOut(k);
      this.palMix = 0.5 + 0.5 * k;
      if (k >= 1) {
        this.disperse = 0;
        this.palMix = 1;
        this.cyclePhase = "hold";
        this.cyclePhaseT = 0;
      }
    }
  }

  private render(now: number) {
    const gl = this.gl;
    if (!gl || !this.compProg || !this.blurProg) return;
    if (!this.mask || this.levels.length === 0) return;

    const t = (now - this.startT) / 1000;

    gl.useProgram(this.blurProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const aPos = gl.getAttribLocation(this.blurProg, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (let i = 0; i < this.levels.length; i++) {
      const lv = this.levels[i];
      const src = i === 0 ? this.mask : this.levels[i - 1].out.tex;
      const r = LEVELS[i].radius;
      gl.bindFramebuffer(gl.FRAMEBUFFER, lv.tmp.fb);
      gl.viewport(0, 0, lv.tmp.w, lv.tmp.h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform1i(this.blurLoc.uTex, 0);
      gl.uniform2f(this.blurLoc.uDir, r / lv.tmp.w, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lv.out.fb);
      gl.viewport(0, 0, lv.out.w, lv.out.h);
      gl.bindTexture(gl.TEXTURE_2D, lv.tmp.tex);
      gl.uniform2f(this.blurLoc.uDir, 0, r / lv.out.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.compProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const aPos2 = gl.getAttribLocation(this.compProg, "aPosition");
    gl.enableVertexAttribArray(aPos2);
    gl.vertexAttribPointer(aPos2, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.mask);
    gl.uniform1i(this.compLoc.uMask, 0);
    for (let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE1 + i);
      gl.bindTexture(gl.TEXTURE_2D, this.levels[i]?.out.tex ?? this.mask);
      gl.uniform1i(this.compLoc[`uB${i}`], 1 + i);
    }

    const p = this.cycle ? this.tweenedPalette() : this.params;
    const splitUv = p.split / 620;
    const sx = this.fx * 2.4 * splitUv;
    const sy = this.fy * 2.4 * splitUv;
    gl.uniform2f(this.compLoc.uSplit, sx, sy);
    gl.uniform2f(this.compLoc.uCursor, this.px * 0.5 + 0.5, this.py * 0.5 + 0.5);
    gl.uniform1f(this.compLoc.uCursorOn, this.active);
    gl.uniform1f(this.compLoc.uDisperse, this.disperse);

    const bloomPulse = p.bloom * (0.94 + 0.06 * Math.sin(t * 0.7));
    gl.uniform1f(this.compLoc.uBloom, bloomPulse);
    gl.uniform3f(this.compLoc.uWarm, p.warm[0], p.warm[1], p.warm[2]);
    gl.uniform3f(this.compLoc.uCool, p.cool[0], p.cool[1], p.cool[2]);
    gl.uniform3f(this.compLoc.uRed, p.red[0], p.red[1], p.red[2]);
    gl.uniform1f(this.compLoc.uCore, p.core);
    gl.uniform1f(this.compLoc.uSpectral, p.spectral);
    gl.uniform3f(this.compLoc.uBg, p.bg[0], p.bg[1], p.bg[2]);
    gl.uniform1f(this.compLoc.uInvert, p.invert ? 1 : 0);
    gl.uniform1f(this.compLoc.uNoise, p.noise);
    gl.uniform1f(this.compLoc.uTime, t);
    gl.uniform1f(this.compLoc.uAspect, this.w / Math.max(1, this.h));
    gl.uniform2f(this.compLoc.uResolution, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!this.painted) {
      this.painted = true;
      this.canvas.style.opacity = "1";
    }
  }

  renderStill() {
    this.resize();
    void this.buildMaskNow();
    this.startT = performance.now();
    this.render(performance.now());
  }

  destroy() {
    this.destroyed = true;
    if (this.buildScheduled) {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (cic) cic(this.buildScheduled);
      else window.clearTimeout(this.buildScheduled);
      this.buildScheduled = 0;
    }
    this.stop();
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerenter", this.onEnter);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.unwatch?.();
    this.unwatch = null;
    const gl = this.gl;
    if (gl) {
      this.freeLevels();
      disposeGl(gl, { programs: [this.blurProg, this.compProg], buffers: [this.quad], textures: [this.mask] });
    }
    this.gl = null;
    this.mask = null;
    this.canvas.remove();
  }
}
