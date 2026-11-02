// Word stickers (https://design.how/vault/word-stickers), gl-sticker.ts.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
import { PEEL_VERT, PEEL_FRAG, PEEL_FRAG_FALLBACK } from "./peel-shaders";
import { disposeGl } from "./runtime/dispose";

const SEG = 24;

export interface GLStickerHandle {
  tex: WebGLTexture;
  texW: number;
  texH: number;
}

export class StickerGL {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private posBuf: WebGLBuffer;
  private uvBuf: WebGLBuffer;
  private idxBuf: WebGLBuffer;
  private idxCount = 0;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private aPos = 0;
  private aUV = 0;
  private dpr = 1;
  private W = 1;
  private H = 1;
  private ok = false;
  private textures = new Set<WebGLTexture>();

  constructor() {
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    });
    const gl = this.canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
    if (!gl) {
      this.gl = null as unknown as WebGLRenderingContext;
      this.prog = null as unknown as WebGLProgram;
      this.posBuf = this.uvBuf = this.idxBuf = null as unknown as WebGLBuffer;
      return;
    }
    this.gl = gl;
    const hasDeriv = !!gl.getExtension("OES_standard_derivatives");
    this.prog = this.build(PEEL_VERT, hasDeriv ? PEEL_FRAG : PEEL_FRAG_FALLBACK);
    this.aPos = gl.getAttribLocation(this.prog, "aPosition");
    this.aUV = gl.getAttribLocation(this.prog, "aUV");
    for (const u of [
      "uGrabUV", "uAnchorUV", "uFraction", "uElevation", "uPullback",
      "uAspect", "uDragOffset", "uProj", "uTex", "uAlphaCutoff",
    ]) {
      this.loc[u] = gl.getUniformLocation(this.prog, u);
    }
    const mesh = this.buildMesh();
    this.posBuf = mesh.posBuf;
    this.uvBuf = mesh.uvBuf;
    this.idxBuf = mesh.idxBuf;
    this.idxCount = mesh.count;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.ok = true;
  }

  get available() {
    return this.ok;
  }

  private build(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const c = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
      }
      return sh;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, c(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, c(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || "program link failed");
    }
    return p;
  }

  private buildMesh() {
    const gl = this.gl;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let y = 0; y <= SEG; y++) {
      for (let x = 0; x <= SEG; x++) {
        const u = x / SEG;
        const v = y / SEG;
        pos.push(u - 0.5, v - 0.5);
        uv.push(u, 1 - v);
      }
    }
    const row = SEG + 1;
    for (let y = 0; y < SEG; y++) {
      for (let x = 0; x < SEG; x++) {
        const a = y * row + x;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    }
    const mk = (data: Float32Array | Uint16Array, target: number) => {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(target, buf);
      gl.bufferData(target, data, gl.STATIC_DRAW);
      return buf;
    };
    return {
      posBuf: mk(new Float32Array(pos), gl.ARRAY_BUFFER),
      uvBuf: mk(new Float32Array(uv), gl.ARRAY_BUFFER),
      idxBuf: mk(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER),
      count: idx.length,
    };
  }

  makeTexture(art: HTMLCanvasElement, cssW: number, cssH: number, replaces?: WebGLTexture | null): GLStickerHandle {
    const gl = this.gl;
    if (replaces) { gl.deleteTexture(replaces); this.textures.delete(replaces); }
    const tex = gl.createTexture()!;
    this.textures.add(tex);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    return { tex, texW: cssW, texH: cssH };
  }

  resize(w: number, h: number, dpr: number) {
    this.W = w;
    this.H = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    if (this.ok) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  beginFrame() {
    if (!this.ok) return;
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf);
    gl.enableVertexAttribArray(this.aUV);
    gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
  }

  drawSticker(p: {
    x: number; y: number; w: number; h: number; scale: number;
    grabU: number; grabV: number; anchorU: number; anchorV: number;
    fraction: number; elevation: number; pullback: number;
    dragOffX: number; dragOffY: number; tex: WebGLTexture;
  }) {
    if (!this.ok) return;
    const gl = this.gl;
    const w = p.w * p.scale;
    const h = p.h * p.scale;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const sx = w / this.W * 2;
    const sy = h / this.H * 2;
    const tx = (cx / this.W) * 2 - 1;
    const ty = 1 - (cy / this.H) * 2;
    const zk = 0.6;
    const m = new Float32Array([
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, 1, -zk / Math.max(this.W, this.H),
      tx, ty, 0, 1,
    ]);
    gl.uniformMatrix4fv(this.loc.uProj, false, m);
    gl.uniform2f(this.loc.uGrabUV, p.grabU, p.grabV);
    gl.uniform2f(this.loc.uAnchorUV, p.anchorU, p.anchorV);
    gl.uniform1f(this.loc.uFraction, p.fraction);
    gl.uniform1f(this.loc.uElevation, p.elevation);
    gl.uniform1f(this.loc.uPullback, p.pullback);
    gl.uniform1f(this.loc.uAspect, w / Math.max(1, h));
    gl.uniform2f(this.loc.uDragOffset, p.dragOffX, p.dragOffY);
    gl.uniform1f(this.loc.uAlphaCutoff, 0.02);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, p.tex);
    gl.uniform1i(this.loc.uTex, 0);
    gl.drawElements(gl.TRIANGLES, this.idxCount, gl.UNSIGNED_SHORT, 0);
  }

  destroy() {
    if (!this.ok) return;
    this.ok = false;
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.posBuf, this.uvBuf, this.idxBuf], textures: [...this.textures] });
    this.textures.clear();
  }

  lost() {
    this.ok = false;
  }
}
