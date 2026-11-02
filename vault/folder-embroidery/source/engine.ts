import { EMB_VERT, EMB_FRAG } from "./shaders";
import { makeScene } from "./scene";
import { FABRIC } from "./patches";
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";
import { mediaUrl } from "./runtime/media";

export const REST_ANGLE = (73 * Math.PI) / 180;
export const LIGHT_Z = 0.55;
const WEAVE_URL = mediaUrl("/vault/embroidery-weave.webp");
export const WEAVE_SCALE = 15;

export class Embroidery {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private quad: WebGLBuffer | null = null;
  private artTex: WebGLTexture | null = null;
  private fieldTex: WebGLTexture | null = null;
  private weave: WebGLTexture | null = null;
  private texW = 1;
  private texH = 1;

  private raf = 0;
  private running = false;
  private awake = false;

  private w = 0;
  private h = 0;
  private dpr = 1;
  private fontFamily = "var(--visual-wide), sans-serif";

  private builtW = 0;
  private builtH = 0;
  private builtFont = "";
  private buildScheduled = 0;
  private destroyed = false;
  private painted = false;
  private unwatch: () => void = () => {};

  private hover = 0;
  private hoverTarget = 0;
  private wx = 0.5;
  private wy = 0.55;
  private twx = 0.5;
  private twy = 0.55;
  private press = 0;
  private pressVel = 0;
  private pressKick = 0;
  private px = 0.5;
  private py = 0.5;

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
      this.prog = this.build(EMB_VERT, EMB_FRAG);
    } catch {
      this.gl = null;
      return;
    }

    const p = this.prog;
    for (const u of [
      "uArt", "uField", "uWeave", "uTexel", "uLight", "uLightZ", "uWash", "uHover",
      "uPress", "uPressPos", "uAspect", "uFabric", "uDepth", "uWeaveScale",
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

    gl.clearColor(FABRIC[0] * 0.8, FABRIC[1] * 0.8, FABRIC[2] * 0.8, 1);

    this.resize();
    this.weave = this.newPlaceholder([150, 150, 150, 255]);
    this.loadWeave();
    void this.buildSceneNow();

    this.canvas.addEventListener("pointermove", this.onMove);
    this.ok = true;
  }

  private newPlaceholder(rgba: number[]): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
    return t;
  }

  private loadWeave() {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const g = this.gl;
      if (!g || !this.weave || this.destroyed) return;
      g.bindTexture(g.TEXTURE_2D, this.weave);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
      if (!this.running) this.render();
    };
    img.src = WEAVE_URL;
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

  setPatch(_i: number) {
    void _i;
  }

  setHover(v: number) {
    this.hoverTarget = Math.max(0, Math.min(1, v));
    this.wake();
  }

  pressTap(x = 0.5, y = 0.5) {
    this.px = x;
    this.py = 1 - y;
    this.pressKick = 1;
    this.wake();
  }

  private wake() {
    if (this.awake && !this.running) this.start();
    else if (!this.running) this.render();
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.twx = (e.clientX - r.left) / r.width;
    this.twy = 1 - (e.clientY - r.top) / r.height;
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
    if (mw === this.builtW && mh === this.builtH && this.fontFamily === this.builtFont) return;
    if (this.buildScheduled) return;
    const run = () => {
      this.buildScheduled = 0;
      void this.buildSceneNow();
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    this.buildScheduled = ric ? ric(run, { timeout: 200 }) : window.setTimeout(run, 0);
  }

  private uploadCanvas(tex: WebGLTexture, canvas: HTMLCanvasElement) {
    const gl = this.gl!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  private uploadPixels(tex: WebGLTexture, px: { data: Uint8Array; width: number; height: number }) {
    const gl = this.gl!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, px.width, px.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, px.data);
  }

  private async buildSceneNow() {
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
    const scene = await makeScene(mw, mh, this.fontFamily);
    if (!this.gl || this.destroyed) return;
    if (!this.artTex) this.artTex = gl.createTexture();
    if (!this.fieldTex) this.fieldTex = gl.createTexture();
    this.uploadCanvas(this.artTex, scene.art);
    this.uploadPixels(this.fieldTex, scene.field);
    this.texW = scene.field.width;
    this.texH = scene.field.height;
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
    const k = 0.12;
    this.hover += (this.hoverTarget - this.hover) * k;
    this.wx += (this.twx - this.wx) * k;
    this.wy += (this.twy - this.wy) * k;
    this.pressKick *= 0.8;
    if (this.pressKick < 0.002) this.pressKick = 0;
    this.pressVel += (this.pressKick - this.press) * 0.28;
    this.pressVel *= 0.6;
    this.press += this.pressVel;
    this.render();
  }

  renderStill() {
    this.resize();
    void this.buildSceneNow();
    this.render();
  }

  private render() {
    const gl = this.gl;
    if (!gl || this.destroyed || !this.prog || !this.artTex || !this.fieldTex) return;

    const ang = REST_ANGLE + (this.wx - 0.5) * 1.4 * this.hover;
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.artTex);
    gl.uniform1i(this.loc.uArt, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.uniform1i(this.loc.uField, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.weave);
    gl.uniform1i(this.loc.uWeave, 2);
    gl.uniform1f(this.loc.uWeaveScale, WEAVE_SCALE);
    gl.uniform2f(this.loc.uTexel, 1 / this.texW, 1 / this.texH);
    gl.uniform2f(this.loc.uLight, Math.cos(ang), Math.sin(ang));
    gl.uniform1f(this.loc.uLightZ, LIGHT_Z);
    gl.uniform2f(this.loc.uWash, this.wx, this.wy);
    gl.uniform1f(this.loc.uHover, this.hover);
    gl.uniform1f(this.loc.uPress, Math.max(0, Math.min(1, this.press)));
    gl.uniform2f(this.loc.uPressPos, this.px, this.py);
    gl.uniform1f(this.loc.uAspect, this.w / Math.max(1, this.h));
    gl.uniform3f(this.loc.uFabric, FABRIC[0], FABRIC[1], FABRIC[2]);
    gl.uniform1f(this.loc.uDepth, 1.15);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!this.painted) {
      this.painted = true;
      this.canvas.style.opacity = "1";
    }

    if (
      Math.abs(this.hover - this.hoverTarget) < 0.002 &&
      this.hoverTarget < 0.002 &&
      Math.abs(this.wx - this.twx) < 0.001 &&
      Math.abs(this.wy - this.twy) < 0.001 &&
      this.pressKick === 0 &&
      Math.abs(this.press) < 0.002 &&
      Math.abs(this.pressVel) < 0.002
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
    this.unwatch();
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.artTex, this.fieldTex, this.weave] });
    this.gl = null;
    this.prog = null;
    this.quad = null;
    this.artTex = this.fieldTex = this.weave = null;
    this.canvas.remove();
  }
}
