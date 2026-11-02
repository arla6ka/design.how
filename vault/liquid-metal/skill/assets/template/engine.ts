// Liquid metal (https://design.how/vault/liquid-metal), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, RAMPS, DEFAULT_RAMP, FONT_CSS, FONT_WEIGHT).
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";
import { METAL_VERT, METAL_FRAG } from "./shaders";
import { makeMetalField } from "./text-mask";
import { RAMPS, DEFAULT_RAMP, WORD, FONT_CSS, type MetalRamp } from "./params";

function rampToFloats(r: MetalRamp): number[] {
  const out: number[] = [];
  for (const s of r.stops) out.push(s[0], s[1], s[2]);
  out.push(r.spark[0], r.spark[1], r.spark[2]);
  return out;
}

export class LiquidMetal {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private quad: WebGLBuffer | null = null;
  private tex: WebGLTexture | null = null;
  private texW = 1;
  private texH = 1;

  private raf = 0;
  private running = false;
  private awake = false;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private fontFamily = `${FONT_CSS}, sans-serif`;
  private word = WORD;
  private rampIdx = DEFAULT_RAMP;
  private curRamp: number[] = rampToFloats(RAMPS[DEFAULT_RAMP]);
  private targetRamp: number[] = rampToFloats(RAMPS[DEFAULT_RAMP]);

  private builtW = 0;
  private builtH = 0;
  private builtFont = "";
  private builtWord = "";
  private buildScheduled = 0;
  private destroyed = false;
  private painted = false;
  private t0 = performance.now();
  private unwatch: () => void = () => {};

  private tx = 0;
  private ty = 0;
  private ttx = 0;
  private tty = 0;

  ok = false;

  constructor(host: HTMLElement, fontFamily?: string) {
    this.host = host;
    if (fontFamily) this.fontFamily = fontFamily;
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
      this.destroyed = true;
    });

    try {
      this.prog = this.build(METAL_VERT, METAL_FRAG);
    } catch {
      this.gl = null;
      return;
    }

    const p = this.prog;
    for (const u of [
      "uField", "uTexel", "uTilt", "uAspect", "uTime",
      "uS0", "uS1", "uS2", "uS3", "uS4", "uSpark",
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

    gl.clearColor(0.045, 0.048, 0.055, 1);

    this.resize();
    void this.buildFieldNow();

    this.canvas.addEventListener("pointermove", this.onMove);
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

  setFont(family: string) {
    if (family === this.fontFamily) return;
    this.fontFamily = family;
    this.scheduleBuild();
  }

  setWord(word: string) {
    if (word === this.word) return;
    this.word = word;
    this.scheduleBuild();
  }

  setRamp(i: number) {
    this.rampIdx = ((i % RAMPS.length) + RAMPS.length) % RAMPS.length;
    this.targetRamp = rampToFloats(RAMPS[this.rampIdx]);
    this.wake();
  }

  private wake() {
    if (this.awake && !this.running) this.start();
    else if (!this.running) this.render();
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.ttx = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
    this.tty = ((e.clientY - r.top) / r.height - 0.5) * 0.9;
    this.wake();
  };

  private onLeave = () => {
    this.ttx = 0;
    this.tty = 0;
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
      this.fontFamily === this.builtFont && this.word === this.builtWord
    ) {
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
    this.buildScheduled = ric ? ric(run, { timeout: 200 }) : window.setTimeout(run, 0);
  }

  private async buildFieldNow() {
    const gl = this.gl;
    if (!gl || this.destroyed) return;
    if (this.buildScheduled) {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cic) cic(this.buildScheduled);
      else window.clearTimeout(this.buildScheduled);
      this.buildScheduled = 0;
    }
    const [mw, mh] = this.maskSize();
    this.builtW = mw;
    this.builtH = mh;
    this.builtFont = this.fontFamily;
    this.builtWord = this.word;
    const blur = Math.max(1.5, mh * 0.012);
    const art = await makeMetalField(this.word, blur, mw, mh, this.fontFamily);
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
    if (!this.running) this.render();
  }

  start() {
    if (!this.ok) return;
    this.awake = true;
    if (this.running) return;
    this.running = true;
    this.resize();
    const loop = () => {
      if (!this.running) return;
      this.frame();
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

  private frame() {
    const k = 0.1;
    this.tx += (this.ttx - this.tx) * k;
    this.ty += (this.tty - this.ty) * k;
    const ck = 0.08;
    for (let i = 0; i < this.curRamp.length; i++) {
      this.curRamp[i] += (this.targetRamp[i] - this.curRamp[i]) * ck;
    }
    this.render();
  }

  private rampSettling(): boolean {
    for (let i = 0; i < this.curRamp.length; i++) {
      if (Math.abs(this.curRamp[i] - this.targetRamp[i]) > 0.002) return true;
    }
    return false;
  }

  renderStill() {
    this.resize();
    void this.buildFieldNow();
    this.render();
  }

  private render() {
    const gl = this.gl;
    if (!gl || this.destroyed || !this.prog || !this.tex) return;

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.loc.uField, 0);
    gl.uniform2f(this.loc.uTexel, 1 / this.texW, 1 / this.texH);
    gl.uniform2f(this.loc.uTilt, this.tx, this.ty);
    gl.uniform1f(this.loc.uAspect, this.w / Math.max(1, this.h));
    gl.uniform1f(this.loc.uTime, (performance.now() - this.t0) / 1000);
    const r = this.curRamp;
    gl.uniform3f(this.loc.uS0, r[0], r[1], r[2]);
    gl.uniform3f(this.loc.uS1, r[3], r[4], r[5]);
    gl.uniform3f(this.loc.uS2, r[6], r[7], r[8]);
    gl.uniform3f(this.loc.uS3, r[9], r[10], r[11]);
    gl.uniform3f(this.loc.uS4, r[12], r[13], r[14]);
    gl.uniform3f(this.loc.uSpark, r[15], r[16], r[17]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!this.painted) {
      this.painted = true;
      this.canvas.style.opacity = "1";
    }

    if (
      !this.awake &&
      !this.rampSettling() &&
      Math.abs(this.tx - this.ttx) < 0.001 &&
      Math.abs(this.ty - this.tty) < 0.001
    ) {
      this.pause();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.buildScheduled) {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (cic) cic(this.buildScheduled);
      else window.clearTimeout(this.buildScheduled);
      this.buildScheduled = 0;
    }
    this.stop();
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerleave", this.onLeave);
    this.unwatch();
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.tex] });
    this.gl = null;
    this.prog = null;
    this.quad = null;
    this.tex = null;
    this.canvas.remove();
  }
}
