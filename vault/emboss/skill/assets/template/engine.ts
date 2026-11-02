// Realistic emboss (https://design.how/vault/emboss), engine.ts.
// FIXED. Change the VARIABLE values in params instead (STYLES, REST_ANGLE, GRUNGE_AMT, BUILTIN_SVGS).
import { EMBOSS_VERT, EMBOSS_FRAG } from "./shaders";
import { makeHeightField } from "./text-mask";
import { BUILTIN_SVGS } from "./content-mask";
import { mediaUrl } from "./runtime/media";
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";

export const FONT_VAR = "--visual-wide";

const FLOWER_SVG = BUILTIN_SVGS.find((s) => s.id === "flower")!.svg;

type Style = {
  word: string;
  svg?: string;
  blurK: number;
  depth: number;
  hi: number;
  sh: number;
  contrast: number;
  bright: number;
  tint: [number, number, number];
  texOff: [number, number];
  texScale: number;
};
export const STYLES: Style[] = [
  { word: "beep", blurK: 0.0025, depth: 1.3, hi: 0.42, sh: 0.46, contrast: 0.3, bright: 1.62,
    tint: [0.95, 0.95, 0.97], texOff: [0.5, 0.55], texScale: 1.1 },
  { word: "", svg: FLOWER_SVG, blurK: 0.0025, depth: 1.1, hi: 0.3, sh: 0.34, contrast: 0.15, bright: 2.15,
    tint: [1.0, 0.85, 0.2], texOff: [0.45, 0.3], texScale: 1.1 },
  { word: "boop", blurK: 0.0025, depth: 1.1, hi: 0.3, sh: 0.34, contrast: 0.25, bright: 2.25,
    tint: [0.6, 0.5, 1.0], texOff: [0.25, 0.6], texScale: 0.9 },
];
const PANEL_X: [number, number][] = [
  [0.02, 0.333],
  [0.347, 0.653],
  [0.667, 0.98],
];

const PLASTER_URL = mediaUrl("/vault/emboss-plaster.webp");
const GRUNGE_URL = mediaUrl("/vault/emboss-grunge.webp");
export const GRUNGE_AMT = 0.38;

export const REST_ANGLE = (73 * Math.PI) / 180;
const LIGHT_Z = 0.5;

export class Emboss {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private quad: WebGLBuffer | null = null;
  private tex: WebGLTexture | null = null;
  private texW = 1;
  private texH = 1;
  private plaster: WebGLTexture | null = null;
  private grunge: WebGLTexture | null = null;

  private raf = 0;
  private running = false;
  private awake = false;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private fontFamily = "sans-serif";
  private unwatch: (() => void) | null = null;

  private builtW = 0;
  private builtH = 0;
  private builtFont = "";
  private buildScheduled = 0;
  private destroyed = false;
  private painted = false;

  private wx = 0.5;
  private wy = 0.5;
  private twx = 0.5;
  private twy = 0.5;
  private hover = -1;

  ok = false;

  constructor(host: HTMLElement) {
    this.host = host;
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
      this.prog = this.build(EMBOSS_VERT, EMBOSS_FRAG);
    } catch {
      this.gl = null;
      return;
    }

    const p = this.prog;
    for (const u of [
      "uField", "uPlaster", "uGrunge", "uTexel", "uLight", "uLightZ", "uWash",
      "uHover", "uDepth", "uHi", "uSh", "uContrast", "uBright", "uGrungeAmt",
      "uTint0", "uTint1", "uTint2", "uTexScale", "uTexOff0", "uTexOff1", "uTexOff2",
      "uReveal", "uAspect",
    ]) {
      this.loc[u] = gl.getUniformLocation(p, u);
    }
    const aPos = gl.getAttribLocation(p, "aPosition");
    const aUV = gl.getAttribLocation(p, "aUV");
    const data = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.useProgram(p);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

    gl.clearColor(1, 1, 1, 1);

    this.resize();
    this.plaster = this.newPlaceholder([128, 128, 128, 255]);
    this.grunge = this.newPlaceholder([128, 128, 128, 255]);
    this.loadTexture(PLASTER_URL, () => this.plaster, false);
    this.loadTexture(GRUNGE_URL, () => this.grunge, false);
    void this.buildFieldNow();

    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerleave", this.onLeave);
    this.ok = true;
  }

  private newPlaceholder(rgba: number[]): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(rgba),
    );
    return t;
  }

  private loadTexture(url: string, target: () => WebGLTexture | null, repeat = false) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const g = this.gl;
      const tex = target();
      if (!g || !tex || this.destroyed) return;
      g.bindTexture(g.TEXTURE_2D, tex);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      const wrap = repeat ? g.REPEAT : g.CLAMP_TO_EDGE;
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, wrap);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, wrap);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
      if (!this.running) this.render(performance.now());
    };
    img.src = url;
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

  setFont(family: string) {
    if (family === this.fontFamily) return;
    this.fontFamily = family;
    this.scheduleBuild();
  }

  private wake() {
    if (this.awake && !this.running) this.start();
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = 1 - (e.clientY - r.top) / r.height;
    this.twx = nx;
    this.twy = ny;
    this.hover = -1;
    for (let i = 0; i < PANEL_X.length; i++) {
      if (nx >= PANEL_X[i][0] && nx <= PANEL_X[i][1]) {
        this.hover = i;
        break;
      }
    }
    this.wake();
  };

  private onLeave = () => {
    this.hover = -1;
    this.wake();
  };

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
      this.scheduleBuild();
    }
  }

  private maskSize(): [number, number] {
    const MAX_W = 1500;
    const mw = Math.max(2, Math.min(MAX_W, Math.round(this.w * this.dpr)));
    const mh = Math.max(2, Math.round(mw * (this.h / Math.max(1, this.w))));
    return [mw, mh];
  }

  private scheduleBuild() {
    if (!this.gl || this.destroyed) return;
    const [mw, mh] = this.maskSize();
    if (mw === this.builtW && mh === this.builtH && this.fontFamily === this.builtFont) {
      return;
    }
    if (this.buildScheduled) return;
    const run = () => {
      this.buildScheduled = 0;
      void this.buildFieldNow();
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    this.buildScheduled = ric
      ? ric(run, { timeout: 200 })
      : window.setTimeout(run, 0);
  }

  private async buildFieldNow() {
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
    this.builtFont = this.fontFamily;
    const panels = STYLES.map((s) => ({ word: s.word, svg: s.svg ?? null }));
    const blurs = STYLES.map((s) => Math.max(1.0, mh * s.blurK));
    const art = await makeHeightField(panels, blurs, mw, mh, this.fontFamily);
    if (!this.gl || this.destroyed) return;
    if (!this.tex) this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    this.texW = art.width;
    this.texH = art.height;
    if (!this.running) this.render(performance.now());
  }

  start() {
    if (!this.ok) return;
    this.awake = true;
    if (this.running) return;
    this.running = true;
    this.resize();
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.awake = false;
    this.pause();
  }

  private pause() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame(now: number) {
    const k = 0.1;
    this.wx += (this.twx - this.wx) * k;
    this.wy += (this.twy - this.wy) * k;
    this.render(now);
  }

  renderStill() {
    this.resize();
    void this.buildFieldNow();
    this.render(performance.now());
  }

  private render(now: number) {
    const gl = this.gl;
    if (!gl || !this.prog) return;
    if (!this.tex) return;
    const reveal = 1;
    void now;

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.loc.uField, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.plaster);
    gl.uniform1i(this.loc.uPlaster, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.grunge);
    gl.uniform1i(this.loc.uGrunge, 2);
    gl.uniform1f(this.loc.uGrungeAmt, GRUNGE_AMT);
    gl.uniform2f(this.loc.uTexel, 1 / this.texW, 1 / this.texH);
    gl.uniform2f(this.loc.uLight, Math.cos(REST_ANGLE), Math.sin(REST_ANGLE));
    gl.uniform1f(this.loc.uLightZ, LIGHT_Z);
    gl.uniform2f(this.loc.uWash, this.wx, this.wy);
    gl.uniform1f(this.loc.uHover, this.hover);
    const S = STYLES;
    gl.uniform3f(this.loc.uDepth, S[0].depth, S[1].depth, S[2].depth);
    gl.uniform3f(this.loc.uHi, S[0].hi, S[1].hi, S[2].hi);
    gl.uniform3f(this.loc.uSh, S[0].sh, S[1].sh, S[2].sh);
    gl.uniform3f(this.loc.uContrast, S[0].contrast, S[1].contrast, S[2].contrast);
    gl.uniform3f(this.loc.uBright, S[0].bright, S[1].bright, S[2].bright);
    gl.uniform3f(this.loc.uTint0, S[0].tint[0], S[0].tint[1], S[0].tint[2]);
    gl.uniform3f(this.loc.uTint1, S[1].tint[0], S[1].tint[1], S[1].tint[2]);
    gl.uniform3f(this.loc.uTint2, S[2].tint[0], S[2].tint[1], S[2].tint[2]);
    gl.uniform3f(this.loc.uTexScale, S[0].texScale, S[1].texScale, S[2].texScale);
    gl.uniform2f(this.loc.uTexOff0, S[0].texOff[0], S[0].texOff[1]);
    gl.uniform2f(this.loc.uTexOff1, S[1].texOff[0], S[1].texOff[1]);
    gl.uniform2f(this.loc.uTexOff2, S[2].texOff[0], S[2].texOff[1]);
    gl.uniform1f(this.loc.uReveal, reveal);
    gl.uniform1f(this.loc.uAspect, this.w / Math.max(1, this.h));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!this.painted) {
      this.painted = true;
      this.canvas.style.opacity = "1";
    }

    if (
      reveal >= 1 &&
      this.hover < 0 &&
      Math.abs(this.wx - this.twx) < 0.001 &&
      Math.abs(this.wy - this.twy) < 0.001
    ) {
      this.pause();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.buildScheduled) {
      const cic = (window as unknown as {
        cancelIdleCallback?: (id: number) => void;
      }).cancelIdleCallback;
      if (cic) cic(this.buildScheduled);
      else window.clearTimeout(this.buildScheduled);
      this.buildScheduled = 0;
    }
    this.stop();
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.unwatch?.();
    this.unwatch = null;
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.tex, this.plaster, this.grunge] });
    this.gl = null;
    this.tex = this.plaster = this.grunge = null;
    this.canvas.remove();
  }
}
