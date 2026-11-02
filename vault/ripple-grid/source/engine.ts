import { disposeGl, watchContextLoss } from "./runtime/dispose";
import {
  CURSOR_EASE,
  CURSOR_PUSH,
  CURSOR_RADIUS,
  CURSOR_RIPPLE_BIAS,
  DPR_CAP,
  LENS_POWER,
  LENS_RADIUS,
  MODE_OFFSETS,
  MODE_PITCH,
  GRID_NX,
  GRID_NY,
  INK,
  PAPER,
  PITCH,
  RIPPLE_LEN,
  SHELL_SOFT,
  SIGMA_K,
  THRESHOLD,
  VIEW_SCALE,
  frameAt,
  rgb,
} from "./params";

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const frag = (nx: number, ny: number) => `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uPitch;
uniform float uViewScale;
uniform float uSigma;
uniform float uThreshold;
uniform float uRx;
uniform float uRy;
uniform float uShellSoft;
uniform float uRipple;
uniform float uRippleLen;
uniform float uRipplePhase;
uniform float uTwirl;
uniform vec2  uDrift;
uniform float uWobble;
uniform vec2  uCursor;
uniform float uCursorAmt;
uniform float uCursorPush;
uniform float uCursorRadius;
uniform float uRippleBias;
uniform float uRowOffset;
uniform float uLens;
uniform float uLensRadius;
uniform float uLensPower;
uniform vec3  uInk;
uniform vec3  uPaper;

#define TAU 6.28318530718
#define NX ${nx}
#define NY ${ny}

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// One axis of the separable gaussian grid. The radius argument is how many
// shells are lit, in index space, and the smoothstep is what lets a shell fade
// in as slivers instead of switching on as whole blobs.
//
// The weight is written as 1 - smoothstep(lo, hi, ...) rather than the shorter
// smoothstep(hi, lo, ...). GLSL leaves smoothstep UNDEFINED when edge0 > edge1,
// so the descending form works on the drivers that happen to implement it as a
// clamp and is free to return anything on the ones that do not.
//
// There is no continue and no early-out either. Skipping dead shells looks
// like a saving and is not: the loop runs a fixed seven times regardless on any
// GPU, and a branch inside it only costs the compiler its unrolling.
float axisWeight(float fk, float radius){
  return 1.0 - smoothstep(radius - uShellSoft, radius + uShellSoft, abs(fk));
}

float axisSumX(float u, float radius){
  float s = 0.0;
  for (int k = -NX; k <= NX; k++) {
    float fk = float(k);
    float d = u - fk * uPitch;
    s += axisWeight(fk, radius) * exp(-(d * d) / (2.0 * uSigma * uSigma));
  }
  return s;
}

// The Y sum, split by row PARITY.
//
// A hexagonal lattice shifts alternate rows sideways, which makes the x-term
// depend on the row index and so destroys the exact separability the whole
// shader is built on. Splitting the rows into two interleaved families
// restores it: each family is a plain rectangular sub-lattice, separable on
// its own, and the total is the sum of the two products. That costs two axis
// sums per direction instead of one (36 exp() against 18) and still beats a
// brute-force 2D sum by better than two to one.
//
// The 'want' argument selects the family: 0 for even rows, 1 for odd. At uRowOffset 0 the
// two families are geometrically identical and the result is exactly the old
// rectangular lattice, so the plain mode costs nothing in accuracy.
float axisSumYParity(float u, float radius, float want){
  float s = 0.0;
  for (int k = -NY; k <= NY; k++) {
    float fk = float(k);
    // mod(k, 2) as a 0/1 selector without an integer modulo, which GLSL ES
    // 1.00 does not have for signed ints in a way that is portable.
    float parity = abs(fk - 2.0 * floor(fk * 0.5));
    if (abs(parity - want) > 0.5) continue;
    float d = u - fk * uPitch;
    s += axisWeight(fk, radius) * exp(-(d * d) / (2.0 * uSigma * uSigma));
  }
  return s;
}

// Four displacements, in the order they matter. Drift moves the origin the other
// three work around, so the internal structure slides together instead of
// shearing against a fixed centre.
vec2 warp(vec2 p){
  p -= uDrift;

  // The ripple rings about a point biased toward the cursor, so a pointer on
  // the card becomes the source the rings travel out from. The bias is partial
  // on purpose: at a full move the composition loses its own centre and the
  // rosette stops resolving anywhere.
  vec2 origin = uCursor * (uRippleBias * uCursorAmt);

  float r = length(p - origin);
  float a = atan(p.y - origin.y, p.x - origin.x);

  // Angular shear growing with radius: the spiral.
  a += uTwirl * r;

  // Radial ripple: this is what folds the square lattice into rings. Where the
  // displacement's slope goes negative the lattice compresses into a shell.
  //
  // The origin fade is not cosmetic. At r = 0 the raw displacement is whatever
  // the sine's phase happens to be, so r goes NEGATIVE and every point near the
  // centre flips through the origin. Clamping r afterwards only trades that for
  // a cusp; the fix is to fade the ripple out before it reaches the middle.
  //
  // The WIDTH matters and is solved, not picked. The centre blob is about
  // 0.07 across in these units, so a fade narrower than that still starves it
  // from the outside and the surviving contour goes CONCAVE, printing a hard
  // four-pointed star in the middle of an otherwise entirely soft picture. At
  // 0.05 that star is plainly visible; at 0.10 the centre is a round blob again;
  // past 0.16 nothing further changes except that the rings lose their bite near
  // the middle. The rosette at full bloom is identical either way.
  r += uRipple * sin(TAU * r / uRippleLen - uRipplePhase)
             * smoothstep(0.0, 0.1, r);
  r = max(r, 0.0);

  p = origin + vec2(cos(a), sin(a)) * r;

  // The pointer pushes the field away from itself. A DISPLACEMENT, not an
  // added source: adding ink under the cursor would put a blob where the
  // lattice says there is none, and it would read as a foreign object rather
  // than as the lattice reacting. Pushing means the existing blobs slide,
  // stretch and part around the cursor, which is the same vocabulary the
  // ripple already speaks.
  // The lens: a radial remap inside a disc on the cursor, so the lattice under
  // the pointer is magnified. Same move as the ripple (remap r as a function
  // of r), different profile. Applied before the push, so the push acts on the
  // already-magnified field and the two read as one piece of glass rather than
  // as two effects fighting.
  vec2 toL = p - uCursor;
  float dL = length(toL);
  if (dL < uLensRadius && uLens > 0.001) {
    float x = dL / uLensRadius;
    // pow() is undefined for x == 0 in GLSL ES; the max keeps it finite at the
    // exact centre, where the remap is a no-op anyway.
    float mapped = pow(max(x, 1e-4), uLensPower);
    // Blend the remap in by uLens so the lens fades with the pointer, and ease
    // it out toward the rim so there is no hard seam where the disc ends.
    float rim = 1.0 - smoothstep(0.7, 1.0, x);
    float nr = mix(x, mapped, uLens * rim) * uLensRadius;
    p = uCursor + (toL / (dL + 1e-4)) * nr;
  }

  vec2 toC = p - uCursor;
  float dC = length(toC);
  // Gaussian falloff, matching the kernel the whole field is built from.
  float bump = exp(-(dC * dC) / (2.0 * uCursorRadius * uCursorRadius));
  // Normalising by dC would divide by zero at the exact centre; the +1e-4
  // keeps the direction finite there, where the push is symmetric anyway.
  p += (toC / (dC + 1e-4)) * bump * uCursorPush * uCursorAmt;

  // Organic lumpiness. Two decorrelated lookups so the offset is a real 2D
  // vector rather than a diagonal smear.
  p += uWobble * vec2(vnoise(p * 7.0 + uTime * 0.05) - 0.5,
                      vnoise(p * 7.0 + 31.7 - uTime * 0.04) - 0.5);

  return p;
}

float field(vec2 P){
  vec2 q = warp(P);
  // Two interleaved rectangular families. The odd rows are shifted sideways by
  // uRowOffset pitches, which is what turns the rectangular lattice into a
  // hexagonal one without leaving the separable form.
  float even = axisSumX(q.x, uRx) * axisSumYParity(q.y, uRy, 0.0);
  float odd  = axisSumX(q.x - uRowOffset * uPitch, uRx)
             * axisSumYParity(q.y, uRy, 1.0);
  return even + odd - uThreshold;
}

void main(){
  // Height units: y runs -0.5..0.5, x runs wider on a wide card. The whole
  // composition is defined against height, so it is identical at any card size.
  vec2 P = uViewScale * (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  float f = field(P);

  #ifdef HAS_FWIDTH
    float w = fwidth(f) * 0.75;
  #else
    // The field's gradient near the contour scales with 1/sigma; one pixel is
    // 1/uRes.y in height units. The warp amplifies this, hence the 1.6.
    float w = 1.6 / (uSigma * uRes.y);
  #endif
  w = max(w, 1e-5);

  float ink = smoothstep(-w, w, f);
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}
`;

type U = Record<string, WebGLUniformLocation | null>;

export class RippleGrid {
  readonly ok: boolean;

  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private u: U = {};

  private raf = 0;
  private running = false;
  private destroyed = false;
  private clock = 0;
  private last = 0;

  private curX = 0;
  private curY = 0;
  private curTX = 0;
  private curTY = 0;
  private curAmt = 0;
  private curTAmt = 0;

  private mode = 0;
  private modePitch = 1;
  private started = false;
  private unwatch: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.unwatch = watchContextLoss(canvas, () => {
      this.stop();
      this.destroyed = true;
    });
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    this.gl = gl;
    this.ok = !!gl && this.build();
    if (this.ok) {
      this.resize();
      this.renderStill();
    }
  }

  private compile(type: number, src: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  private build(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    const hasDeriv = !!gl.getExtension("OES_standard_derivatives");
    const src =
      (hasDeriv
        ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_FWIDTH 1\n"
        : "") + frag(GRID_NX, GRID_NY);

    const vs = this.compile(gl.VERTEX_SHADER, VERT);
    const fs = this.compile(gl.FRAGMENT_SHADER, src);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      return false;
    }
    this.prog = prog;
    gl.useProgram(prog);

    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const n of [
      "uRes", "uTime", "uPitch", "uViewScale", "uSigma", "uThreshold", "uRx", "uRy",
      "uShellSoft", "uRipple", "uRippleLen", "uRipplePhase", "uTwirl",
      "uDrift", "uWobble", "uInk", "uPaper",
      "uCursor", "uCursorAmt", "uCursorPush", "uCursorRadius", "uRippleBias",
      "uRowOffset", "uLens", "uLensRadius", "uLensPower",
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    gl.uniform1f(this.u.uPitch, PITCH);
    gl.uniform1f(this.u.uViewScale, VIEW_SCALE);
    gl.uniform1f(this.u.uSigma, SIGMA_K * PITCH);
    gl.uniform1f(this.u.uThreshold, THRESHOLD);
    gl.uniform1f(this.u.uShellSoft, SHELL_SOFT);
    gl.uniform1f(this.u.uRippleLen, RIPPLE_LEN);
    gl.uniform3fv(this.u.uInk, rgb(INK));
    gl.uniform3fv(this.u.uPaper, rgb(PAPER));
    gl.uniform1f(this.u.uCursorPush, CURSOR_PUSH);
    gl.uniform1f(this.u.uCursorRadius, CURSOR_RADIUS);
    gl.uniform1f(this.u.uRippleBias, CURSOR_RIPPLE_BIAS);
    gl.uniform1f(this.u.uLensRadius, LENS_RADIUS);
    gl.uniform1f(this.u.uLensPower, LENS_POWER);
    this.mode = -1;
    this.pickMode();
    return true;
  }

  private pickMode() {
    const gl = this.gl;
    if (!gl || !this.prog || this.destroyed) return;
    gl.useProgram(this.prog);
    let next = this.mode;
    while (next === this.mode && MODE_OFFSETS.length > 1) {
      next = Math.floor(Math.random() * MODE_OFFSETS.length);
    }
    this.mode = next;
    const mp = MODE_PITCH[this.mode];
    this.modePitch = mp;
    gl.uniform1f(this.u.uRowOffset, MODE_OFFSETS[this.mode]);
    gl.uniform1f(this.u.uPitch, PITCH * mp);
    gl.uniform1f(this.u.uSigma, SIGMA_K * PITCH * mp);
  }

  setPointer(x: number, y: number) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;
    this.curTX = (VIEW_SCALE * (x - 0.5) * w) / h;
    this.curTY = VIEW_SCALE * (0.5 - y);
    this.curTAmt = 1;
  }

  clearPointer() {
    this.curTAmt = 0;
  }

  resize() {
    const gl = this.gl;
    if (!gl || this.destroyed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    gl.viewport(0, 0, w, h);
    if (!this.running) this.draw(this.clock);
  }

  private draw(t: number) {
    const gl = this.gl;
    if (!gl || !this.prog || this.destroyed) return;
    const f = frameAt(t);

    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime, t);
    gl.uniform1f(this.u.uRx, f.rx / this.modePitch);
    gl.uniform1f(this.u.uRy, f.ry / this.modePitch);
    gl.uniform1f(this.u.uRipple, f.ripple);
    gl.uniform1f(this.u.uRipplePhase, f.ripplePhase);
    gl.uniform1f(this.u.uTwirl, f.twirl);
    gl.uniform2f(this.u.uDrift, f.driftX, f.driftY);
    gl.uniform1f(this.u.uWobble, f.wobble);
    gl.uniform2f(this.u.uCursor, this.curX, this.curY);
    gl.uniform1f(this.u.uCursorAmt, this.curAmt);
    gl.uniform1f(this.u.uLens, this.curAmt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  start() {
    if (this.running || !this.ok || this.destroyed) return;
    if (this.started) this.pickMode();
    this.started = true;
    this.running = true;
    this.last = performance.now();
    const tick = () => {
      if (!this.running || this.destroyed) return;
      const now = performance.now();
      const dt = Math.min(now - this.last, 50) / 1000;
      this.clock += dt;
      this.last = now;

      const k = 1 - Math.exp(-dt / CURSOR_EASE);
      this.curX += (this.curTX - this.curX) * k;
      this.curY += (this.curTY - this.curY) * k;
      this.curAmt += (this.curTAmt - this.curAmt) * k;

      this.draw(this.clock);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(0);
  }

  destroy() {
    this.stop();
    this.destroyed = true;
    const gl = this.gl;
    if (!gl) return;
    this.unwatch();
    disposeGl(gl, {programs: [this.prog], buffers: [this.quad]});
    this.gl = null;
    this.prog = null;
    this.quad = null;
  }
}
