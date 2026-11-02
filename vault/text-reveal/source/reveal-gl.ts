import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";

const VERT =  `
  attribute vec2 aPosition;
  attribute vec2 aUV;
  varying vec2 vUV;
  void main(){
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAG =  `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2  uTexel;    // 1/textureSize, blur tap spacing
  uniform float uProgress; // 0 hidden, 1 revealed
  uniform float uMaxBlur;  // starting blur radius (texels)
  uniform vec3  uEdge;     // glow-band color riding the reveal front
  uniform float uTime;     // seconds, drifts the dissolve field
  uniform float uAspect;   // card w/h so the bias stays proportional
  uniform float uSeed;     // per-cycle noise offset
  uniform vec2  uParTL;    // parallax offset for the TOP-LEFT corner region
  uniform vec2  uParBR;    // parallax offset for the BOTTOM-RIGHT corner region
  uniform vec2  uCursor;   // cursor in UV space (far off-screen when no pointer)
  uniform float uHover;    // 0..1 hover strength (eases in/out)
  uniform float uReverse;  // 0 = reveal sweeps ↘, 1 = clear sweeps ↖ (reverse exit)
  varying vec2 vUV;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  vec4 blurTex(vec2 uv, float radius){
    if (radius < 0.35) return texture2D(uTex, uv);
    vec2 r1 = uTexel * radius;
    vec2 r2 = uTexel * radius * 2.0;
    vec4 sum = texture2D(uTex, uv) * 1.0;
    float wsum = 1.0;
    for (int i = 0; i < 8; i++){
      float a = float(i) * 0.785398;
      vec2 dir = vec2(cos(a), sin(a));
      sum += texture2D(uTex, uv + dir * r1) * 0.75; wsum += 0.75;
      sum += texture2D(uTex, uv + dir * r2) * 0.5;  wsum += 0.5;
    }
    return sum / wsum;
  }

  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++){
      v += amp * noise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  void main(){
    // PER-CORNER parallax: the top-left and bottom-right blocks lean INDEPENDENTLY. Blend
    // between the two offsets by the pixel's diagonal region (uv.x+uv.y: low = top-left,
    // high = bottom-right) with a soft midline so there's no seam across the plate.
    float region = smoothstep(0.35, 0.65, (vUV.x + vUV.y) * 0.5);
    vec2 par = mix(uParTL, uParBR, region);
    vec2 baseUV = vUV + par;

    if (uProgress >= 0.999) { gl_FragColor = texture2D(uTex, baseUV); return; }

    float p = uProgress * 1.3;

    vec2 sd = vec2(uSeed * 1.7, uSeed * -1.3);
    vec2 rc = (vUV - 0.5) * vec2(uAspect, 1.0);

    // (1) DIAGONAL DIRECTIONAL base, STAGED so the two corner blocks reveal ONE BY ONE:
    // the base is the top-left → bottom-right diagonal, but pushed to strong contrast so the
    // top-left region sits low (reveals first) and the bottom-right sits high (reveals after
    // the top has essentially finished). A per-cycle waver keeps the front organic.
    float diag = (vUV.x + vUV.y) * 0.5;                 // 0 top-left .. 1 bottom-right
    diag = smoothstep(0.18, 0.82, diag);               // steepen → separate the two corners
    // REVERSE EXIT: while clearing, flip the diagonal so the front sweeps bottom-right → top-
    // left (the top-left block, which arrived first, is the last to leave — a clean handoff).
    diag = mix(diag, 1.0 - diag, uReverse);
    diag += (fbm(vUV * 1.3 + sd) - 0.5) * 0.08;        // gently waver the front line

    // domain-warped fbm for wispy tendrils on the front
    vec2 warp = vec2(fbm(vUV * 3.2 + sd + uTime * 0.05 + 11.0),
                     fbm(vUV * 3.2 - sd - uTime * 0.04 - 7.0)) - 0.5;
    float turb = fbm(vUV * 5.5 + warp * 1.7 + sd + uTime * 0.06);

    // (3) INK STIPPLE: a fine high-frequency speckle mixed into the front, so the leading
    // edge breaks into grain (ink drying) rather than smooth fog.
    float stipple = noise(vUV * vec2(uAspect, 1.0) * 46.0 + sd * 3.0);

    // Lean HARD on the diagonal so the staging reads clearly; turb + stipple only texture the
    // front, they don't reorder which corner comes first.
    float mask = mix(diag, turb, 0.28);      // directional base dominates
    mask = mix(mask, stipple, 0.14);         // grainy front

    // (2) HOVER WIPES INTO FOCUS: near the cursor, locally push the mask below the front so
    // that region resolves sooner — moving the pointer wipes text clear under it.
    vec2 cur = (vUV - uCursor) * vec2(uAspect, 1.0);
    float near = 1.0 - smoothstep(0.0, 0.32, length(cur));
    mask -= near * uHover * 0.28;

    // Tighter feather band than the blur-reveal card so the staged front stays crisp and the
    // two corners don't bleed into each other — top-left resolves, then bottom-right.
    float reveal = smoothstep(p + 0.22, p - 0.22, mask);
    if (reveal <= 0.0) discard;

    float blurAmt = smoothstep(p - 0.34, p + 0.22, mask);

    // Front motion: unresolved regions drift toward center + up and scale a touch, decaying
    // to zero as they resolve — emerging letters settle into place, not fade in stationary.
    vec2 drift = (-rc * 0.010 + vec2(0.0, 0.006)) * blurAmt;
    float grow = 1.0 + 0.03 * blurAmt;
    vec2 suv = (baseUV - 0.5) / grow + 0.5 + drift;

    float radius = blurAmt * uMaxBlur;
    vec4 tex = blurTex(suv, radius);

    // The front band (peaks where mask ≈ p) — used for both the glow and the aberration.
    float fw = 0.30;
    float flare = smoothstep(p - fw, p, mask) * smoothstep(p + fw, p, mask);
    flare *= 1.0 - smoothstep(0.8, 1.0, uProgress);

    // (4) CHROMATIC EDGE: only where the front is passing, split R/G/B by a tiny offset so
    // the advancing edge shimmers with a hair of aberration; the settled body stays mono.
    float ab = flare * 2.0 * uTexel.x * uMaxBlur;
    if (ab > 0.0001) {
      tex.r = blurTex(suv + vec2(ab, 0.0), radius).r;
      tex.b = blurTex(suv - vec2(ab, 0.0), radius).b;
    }

    vec4 wide = blurTex(suv, uMaxBlur * 1.3);
    float halo = wide.a;

    vec3 rgb = tex.rgb;
    vec3 glow = mix(uEdge, vec3(1.0), 0.3);
    rgb += glow * flare * (tex.a * 0.6 + halo * 0.5);
    float alpha = max(tex.a * reveal, halo * flare * 0.5);

    gl_FragColor = vec4(rgb, alpha);
  }
`;

export class RevealGL {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private quad: WebGLBuffer;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private aPos = 0;
  private aUV = 0;
  private tex: WebGLTexture | null = null;
  private texW = 1;
  private texH = 1;
  private ok = false;
  private unwatch: () => void = () => {};

  constructor() {
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    const gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      this.gl = null as unknown as WebGLRenderingContext;
      this.prog = null as unknown as WebGLProgram;
      this.quad = null as unknown as WebGLBuffer;
      return;
    }
    this.gl = gl;
    this.unwatch = watchContextLoss(this.canvas, () => {
      this.ok = false;
    });
    this.prog = this.build(VERT, FRAG);
    this.aPos = gl.getAttribLocation(this.prog, "aPosition");
    this.aUV = gl.getAttribLocation(this.prog, "aUV");
    for (const u of [
      "uTex", "uTexel", "uProgress", "uMaxBlur", "uEdge", "uTime", "uAspect", "uSeed",
      "uParTL", "uParBR", "uCursor", "uHover", "uReverse",
    ]) {
      this.loc[u] = gl.getUniformLocation(this.prog, u);
    }
    const data = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
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

  setTexture(art: HTMLCanvasElement) {
    if (!this.ok) return;
    const gl = this.gl;
    if (this.tex) gl.deleteTexture(this.tex);
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    this.tex = tex;
    this.texW = art.width;
    this.texH = art.height;
  }

  resize(w: number, h: number, dpr: number) {
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    if (this.ok) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(
    progress: number,
    maxBlur: number,
    edge: [number, number, number],
    time: number,
    aspect: number,
    seed: number,
    parTL: [number, number],
    parBR: [number, number],
    cursor: [number, number],
    hover: number,
    reverse: number,
  ) {
    if (!this.ok || !this.tex) return;
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.aUV);
    gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, 16, 8);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.loc.uTex, 0);
    gl.uniform2f(this.loc.uTexel, 1 / this.texW, 1 / this.texH);
    gl.uniform1f(this.loc.uProgress, progress);
    gl.uniform1f(this.loc.uMaxBlur, maxBlur);
    gl.uniform3f(this.loc.uEdge, edge[0], edge[1], edge[2]);
    gl.uniform1f(this.loc.uTime, time);
    gl.uniform1f(this.loc.uAspect, aspect);
    gl.uniform1f(this.loc.uSeed, seed);
    gl.uniform2f(this.loc.uParTL, parTL[0], parTL[1]);
    gl.uniform2f(this.loc.uParBR, parBR[0], parBR[1]);
    gl.uniform2f(this.loc.uCursor, cursor[0], cursor[1]);
    gl.uniform1f(this.loc.uHover, hover);
    gl.uniform1f(this.loc.uReverse, reverse);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    this.unwatch();
    this.ok = false;
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.tex] });
    this.tex = null;
    this.canvas.remove();
  }
}

export interface CornerText {
  top: string[];
  bottom: string[];
  font: string;
  fill: string;
  cardW: number;
  cardH: number;
  dpr?: number;
}

export function renderCornerText(o: CornerText): HTMLCanvasElement {
  const dpr = o.dpr ?? capDpr();
  const cssW = Math.max(1, Math.round(o.cardW));
  const cssH = Math.max(1, Math.round(o.cardH));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = o.fill;
  ctx.textBaseline = "top";

  const pad = Math.round(cssW * 0.035);
  const maxLineW = cssW * 0.52;
  const allLines = [...o.top, ...o.bottom];
  let fontSize = Math.max(24, Math.min(40, cssW * 0.03));
  for (let i = 0; i < 24; i++) {
    ctx.font = `500 ${fontSize}px ${o.font}`;
    const widest = Math.max(...allLines.map((l) => ctx.measureText(l).width));
    if (widest <= maxLineW || fontSize <= 15) break;
    fontSize -= 1;
  }
  const lineH = fontSize * 1.42;
  ctx.font = `500 ${fontSize}px ${o.font}`;

  ctx.textAlign = "left";
  o.top.forEach((line, i) => {
    ctx.fillText(line, pad, pad + i * lineH);
  });

  ctx.textAlign = "right";
  const bottomBlockH = o.bottom.length * lineH;
  const startY = cssH - pad - bottomBlockH;
  o.bottom.forEach((line, i) => {
    ctx.fillText(line, cssW - pad, startY + i * lineH);
  });

  return canvas;
}
