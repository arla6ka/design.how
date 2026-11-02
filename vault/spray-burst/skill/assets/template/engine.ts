// Spray burst (https://design.how/vault/spray-burst), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PALETTES, ORDER, SCENE_MS, FPS, SPRAY_INK, SPRAY_PLATE, SPRAY_SCALE, GRAIN_SCALE, CURSOR_AMOUNT, CURSOR_SPRAY, CURSOR_GRAIN).
import { disposeGl, watchContextLoss } from "./runtime/dispose";
import {
  BAND,
  BAR_BEATS,
  BAR_H,
  BAR_L,
  BAR_OFF,
  BAR_V,
  BAR_Y,
  BEAT,
  CORE_A,
  CORE_B,
  CORE_CAP,
  CORE_FALLOFF,
  CORE_TIP_MAX,
  CORE_TIP_MIN,
  CORE_TROUGH,
  CURSOR_AMOUNT,
  CURSOR_GESTURE,
  CURSOR_LOCAL_R,
  CURSOR_EASE,
  CURSOR_GRAIN,
  CURSOR_R,
  CURSOR_SPRAY,
  DISC_BEATS,
  DISC_OX,
  DISC_OY,
  DISC_PHASE,
  DISC_R,
  DISC_SPIN,
  DOT_ANGLE,
  DOT_BEATS,
  DOT_FREQ,
  DOT_INSET,
  DOT_MAX,
  DOT_MIN,
  DOT_SPEED,
  DOT_STEP,
  FAN,
  FPS,
  GLIDE,
  GRAIN_INK,
  GRAIN_SCALE,
  GRAIN_PAPER,
  GRAIN_PLATE,
  MARGIN,
  ORDER,
  PALETTES,
  POSES,
  RAY_TAPER,
  RAY_W0,
  RAY_WTIP,
  RING_BEATS,
  RING_GAP_AT,
  RING_GAP_W,
  RING_OFF,
  RING_R,
  RING_SPIN,
  RING_W,
  SCENE_COUNT,
  SNAP,
  SCENE_FRAMES,
  SPATTER,
  SPATTER_DECAY,
  SPRAY_INK,
  SPRAY_PLATE,
  SPRAY_SCALE,
  STAR_STATIONS,
  STATION,
  TIP_GROW,
  TOTAL,
  TRANSIT,
  TRANSIT_OUT,
  TRANSIT_SPLIT,
  WEDGE_AT,
  WEDGE_BEATS,
  WEDGE_R0,
  WEDGE_R1,
  WEDGE_SPIN,
  WEDGE_W,
  WOBBLE_INK,
  WOBBLE_PLATE,
  WOBBLE_SCALE,
  ease,
  type Pose,
} from "./params";

const DPR_CAP = 1.5;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const STILL_FRAME = ORDER.indexOf(0) * SCENE_FRAMES + 6;

const STAR_TOUR = [4, 0, 2];

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const table = (name: string, vals: readonly number[]) => {
  const chain = vals
    .slice(0, -1)
    .map((v, i) => `i == ${i} ? ${f(v)} : `)
    .join("");
  return `float ${name}(int i) { return ${chain}${f(vals[vals.length - 1])}; }`;
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;    // canvas size in device px
uniform vec2  uC;      // star centre, top-left origin
uniform vec4  uRect;   // plate x0,y0,x1,y1
uniform float uUnit;   // radial unit: half the plate's height
uniform float uSeed;   // per-frame, so the grain and the wobble both boil
uniform int   uScene;  // which drawing, 0..3
uniform vec3  uPaper;  // the three inks, in the order they are laid down
uniform vec3  uPlate;
uniform vec3  uInk;
uniform vec3  uGrain;  // grain step size for paper, plate, ink
uniform float uSprayI; // this scene's ink spray width, device px
uniform vec3  uCursor; // pointer x, y in device px, and its strength 0..1

// The two general-purpose parameter arrays. Every scene packs its own per-frame
// numbers into these rather than adding uniforms of its own, so one program
// serves all six drawings:
//
//   scene 0 (star)   uA = ray bearings (rad)     uT = ray tip radii (px)
//   scene 1 (rings)  uA = gap centre (turns)     uT = unused
//   scene 2 (bars)   uA = bar centre x (px)      uT = unused
//   scene 3 (discs)  uA = disc centre x (px)     uT = disc centre y (px)
uniform float uA[8];
uniform float uT[8];

const float TAU = 6.28318530718;

// The scene tables, baked in as lookup functions.
//
// GLSL ES 1.0 has no array initialisers, and indexing a const array by a loop
// variable is only guaranteed for constant expressions, so a plain T[i] is
// not portable here. A chain of ternaries is: the compiler folds it, the index
// is never dynamic, and it costs nothing at runtime. Uniform arrays would also
// work and would be worse — these never change, and uploading them every frame
// to say the same thing is pure ceremony.
${table("RING_R", RING_R)}
${table("RING_W", RING_W)}
${table("RING_GAP_W", RING_GAP_W)}
${table("BAR_Y", BAR_Y)}
${table("BAR_H", BAR_H)}
${table("BAR_L", BAR_L)}
${table("DISC_R", DISC_R)}
${table("WEDGE_W", WEDGE_W)}

// One hash for everything. Each consumer offsets uSeed so the plate dither,
// the ink dither, the two wobbles and the three grains are independent; using
// one stream for all of them correlates the plate and ink edges and produces
// visible seams where they cross.
// Each input is scaled by an irrational and folded to a fraction, then two rounds
// multiply every lane by a neighbouring lane and fold again, so a one-pixel step
// lands anywhere in 0..1. Every product stays under about 820, which keeps 14 bits
// below the point in a 32-bit float at any pixel and seed this card reaches.
float hash(vec2 p, float s) {
  vec3 q = fract(vec3(p, s) * vec3(0.7548777, 0.5698403, 0.6180340));
  q = fract(q * (q.yzx + 0.4310) * 571.3);
  q = fract(q * (q.zxy + 0.1897) * 433.7);
  return fract(q.x + q.y + q.z);
}

float vnoise(vec2 p, float s) {
  vec2 i = floor(p), fr = fract(p);
  fr = fr * fr * (3.0 - 2.0 * fr);
  return mix(mix(hash(i, s),                 hash(i + vec2(1.0, 0.0), s), fr.x),
             mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), fr.x), fr.y);
}

float sdBox(vec2 p, vec2 c, vec2 h) {
  vec2 d = abs(p - c) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float angDist(float a, float b) {
  float d = mod(abs(a - b), TAU);
  return min(d, TAU - d);
}

/** Core radius at a ray, growing with that ray's length and then capped. */
float corePeak(float tip) {
  return min(uUnit * (${f(CORE_A)} + ${f(CORE_B)} * clamp(tip / uUnit, ${f(CORE_TIP_MIN)}, ${f(CORE_TIP_MAX)})),
             ${f(CORE_CAP)} * uUnit);
}

/** A tapered spike, as a box SDF whose half-width varies along its length. The
 *  taper is shallow (about 11deg off the axis), so treating the edge as
 *  locally parallel costs under 2% in the distance and nothing visible once
 *  the spray is applied on top. */
float rayDist(vec2 q, float a, float tip, float base) {
  vec2 dir = vec2(cos(a), sin(a));
  float along = dot(q, dir);
  float perp = abs(q.x * dir.y - q.y * dir.x);
  float t = clamp((along - base) / max(1.0, tip - base), 0.0, 1.0);
  float w0 = ${f(RAY_W0)} * uUnit, wt = ${f(RAY_WTIP)} * uUnit;
  float hw = 0.5 * (wt + (w0 - wt) * pow(1.0 - t, ${f(RAY_TAPER)}));
  vec2 d = vec2(max(base - along, along - tip), perp - hw);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/** Scene 1. Concentric annuli, one gap each, the whole set pushed off centre.
 *
 *  Distance to an annulus is exact and cheap: abs(length(q) - r) - w. The gap
 *  is cut by taking a max against a wedge rather than by clipping the arc, so
 *  the two cut ends carry a real signed distance and spray exactly like every
 *  other edge in the piece. Clipping would give them a hard vector end, which
 *  is the one thing that would announce this scene as different machinery. */
float ringsDist(vec2 p) {
  vec2 q = p - uC;
  float th = atan(q.y, q.x) / TAU;
  float r = length(q);
  float d = 1e5;
  for (int i = 0; i < 5; i++) {
    float ri = RING_R(i) * uUnit;
    float wi = RING_W(i) * uUnit;
    float ring = abs(r - ri) - wi;
    // How far into this ring's gap the bearing sits, in turns, wrapped.
    float g = th - uA[i];
    g = g - floor(g + 0.5);
    // Inside the wedge the distance is pushed out by the arc-length shortfall,
    // which is what makes the ends round off the way a stroke end does.
    float halfGap = RING_GAP_W(i) * 0.5;
    float cut = (halfGap - abs(g)) * TAU * ri;
    d = min(d, max(ring, cut));
  }
  return d;
}

/** Scene 2. Horizontal bars of unequal thickness sliding at unequal speeds.
 *  The one drawing in the set made of straight edges, which is most of why the
 *  other three read as curved. */
float barsDist(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 6; i++) {
    vec2 c = vec2(uA[i], uC.y + BAR_Y(i) * uUnit);
    d = min(d, sdBox(p, c, vec2(BAR_L(i) * uUnit, BAR_H(i) * uUnit)));
  }
  return d;
}

/** Scene 3. One big disc and six satellites on slow ellipses, min-combined so
 *  that where two overlap they FUSE into one compound blob rather than crossing
 *  as outlines. That fusing is the whole scene: min on signed distance is a
 *  union, and a union of circles is a shape you cannot get by drawing circles. */
float discsDist(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 7; i++) {
    d = min(d, length(p - vec2(uA[i], uT[i])) - DISC_R(i) * uUnit);
  }
  return d;
}

/** Scene 4. A pinwheel of hard-edged sectors with a hole at the middle.
 *  Distinct from the starburst on purpose: those are tapered spikes growing out
 *  of a fat core, these are wedges of constant angular width cut out of a ring.
 *  One reads as a drawn object, the other as a stencil. */
float wedgeDist(vec2 p) {
  vec2 q = p - uC;
  float r = max(length(q), 1e-4);
  float th = atan(q.y, q.x) / TAU;
  float rad = max(${f(WEDGE_R0)} * uUnit - r, r - ${f(WEDGE_R1)} * uUnit);
  float d = 1e5;
  for (int i = 0; i < 7; i++) {
    float g = th - uA[i];
    g = g - floor(g + 0.5);
    // Angular half-width converted to an arc length at this radius, so a wedge
    // has parallel sides in the print rather than sides that spray wider the
    // further out they go.
    float ang = (abs(g) - WEDGE_W(i)) * TAU * r;
    d = min(d, max(ang, rad));
  }
  return d;
}

/** Scene 5. A halftone: a lattice of dots swelling and shrinking under a wave
 *  crossing the plate. The radius is capped below half a cell, which is what
 *  lets the whole infinite field be evaluated from one mod() instead of a
 *  search over the neighbouring cells. */
float dotsDist(vec2 p) {
  float step = ${f(DOT_STEP)} * uUnit;
  vec2 q = p - uC;
  vec2 cell = floor(q / step);
  vec2 local = q - (cell + 0.5) * step;
  // uA[0] carries the wave's travelled phase; uA[1] and uA[2] its direction.
  float phase = dot(cell + 0.5, vec2(uA[1], uA[2])) + uA[0];
  float wave = 0.5 + 0.5 * sin(phase * TAU);
  float rr = mix(${f(DOT_MIN)}, ${f(DOT_MAX)}, wave);

  // SWELL. Dots fatten under the pointer, as if the sheet took more ink there.
  // Measured from the CELL CENTRE, not the fragment: per-fragment it would be a
  // gradient across each dot and every one near the pointer would come out a
  // teardrop. Per cell, each dot stays a circle and only its radius changes,
  // which is what a halftone actually does under pressure.
  vec2 cc = uC + (cell + 0.5) * step;
  float swell = uA[3] * (1.0 - smoothstep(0.0, ${f(CURSOR_LOCAL_R)} * uUnit,
                                          distance(cc, uCursor.xy)));
  // Clamped below half a cell, or a swollen dot reaches into its neighbour's
  // cell and the single-mod() shortcut this whole field relies on breaks.
  rr = min(rr * (1.0 + swell), 0.48) * step;

  float dots = length(local) - rr;

  // Clipped to the plate, which no other scene is. A halftone is a fill, not an
  // object, and a fill that reaches the card edges swallows the plate and the
  // paper margin with it. max() against the plate's own inset distance keeps the
  // boundary a real signed distance, so it sprays like every other edge instead
  // of ending on a hard line.
  vec2 rc = vec2((uRect.x + uRect.z) * 0.5, (uRect.y + uRect.w) * 0.5);
  vec2 rh = vec2((uRect.z - uRect.x) * 0.5, (uRect.w - uRect.y) * 0.5)
          - ${f(DOT_INSET)} * uUnit;
  return max(dots, sdBox(p, rc, rh));
}

float starDist(vec2 p) {
  vec2 q = p - uC;
  float r = length(q);
  float th = atan(q.y, q.x);

  // The two nearest rays, which bracket this bearing. The core's radius is
  // read off them: it peaks on a ray and dips to a constant trough midway.
  float d1 = 99.0, d2 = 99.0, t1 = 0.0;
  for (int i = 0; i < 8; i++) {
    float dd = angDist(th, uA[i]);
    if (dd < d1) { d2 = d1; d1 = dd; t1 = uT[i]; }
    else if (dd < d2) { d2 = dd; }
  }
  float bump = pow(1.0 - clamp(d1 / max(d2, 1e-4), 0.0, 1.0), ${f(CORE_FALLOFF)});
  float coreR = mix(${f(CORE_TROUGH)} * uUnit, corePeak(t1), bump);

  // The band joining the spike bases into a ring, then the spikes themselves.
  float d = max(coreR - r, r - (coreR + ${f(BAND)} * uUnit));
  for (int i = 0; i < 8; i++) {
    d = min(d, rayDist(q, uA[i], uT[i], corePeak(uT[i])));
  }
  return d;
}

/** Coverage from signed distance. The logistic is a cheap stand-in for the
 *  measured normal CDF (they agree to about 1% over the range that matters),
 *  plus the sparse far tail that carries the overspray. */
float coverage(float d, float sigma) {
  float c = 1.0 / (1.0 + exp(clamp(d * 1.702 / sigma, -20.0, 20.0)));
  if (d > 0.0) {
    c = max(c, ${f(SPATTER)} * exp(-d / (${f(SPATTER_DECAY)} * uUnit)));
  }
  return c;
}

/** 0, 1 or 2 steps, weighted toward 0 to match the measured 62/25/12 split.
 *  Squaring the hash does that in one operation; a uniform pick reads as a
 *  flat 33% noise and grays the ink down too far. */
float grainStep(vec2 p, float s) {
  float h = hash(p, s);
  return floor(h * h * 3.0);
}

/** Whichever drawing is being printed this frame. A uniform branch, so it is
 *  the same path for every fragment in the draw and costs nothing. */
float sceneDist(vec2 p) {
  if (uScene == 0) return starDist(p);
  if (uScene == 1) return ringsDist(p);
  if (uScene == 2) return barsDist(p);
  if (uScene == 3) return discsDist(p);
  if (uScene == 4) return wedgeDist(p);
  return dotsDist(p);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float wob = ${f(WOBBLE_SCALE)} * uUnit;

  // The pointer's reach at this pixel. Applied to the PRINT, identically in
  // every drawing: near the cursor the ink sprays wider and the interiors grain
  // harder, as if that part of the sheet took more ink. This half needs no
  // per-scene code, which is what makes it scale — a drawing added later gets
  // it without being told.
  float near = uCursor.z * (1.0 - smoothstep(0.0, ${f(CURSOR_R)} * uUnit,
                                             distance(p, uCursor.xy)));

  vec3 col = uPaper - grainStep(p, uSeed + 71.3) * uGrain.x;

  vec2 rc = vec2((uRect.x + uRect.z) * 0.5, (uRect.y + uRect.w) * 0.5);
  vec2 rh = vec2((uRect.z - uRect.x) * 0.5, (uRect.w - uRect.y) * 0.5);
  float dp = sdBox(p, rc, rh)
           + (vnoise(p / wob, uSeed + 11.0) - 0.5) * 2.0 * ${f(WOBBLE_PLATE)} * uUnit;
  if (hash(p, uSeed + 3.7) < coverage(dp, ${f(SPRAY_PLATE)} * uUnit)) {
    col = uPlate - grainStep(p, uSeed + 91.1) * uGrain.y * (1.0 + ${f(CURSOR_GRAIN)} * near);
  }

  float db = sceneDist(p)
           + (vnoise(p / wob, uSeed + 29.0) - 0.5) * 2.0 * ${f(WOBBLE_INK)} * uUnit;
  if (hash(p, uSeed + 5.1) < coverage(db, uSprayI * (1.0 + ${f(CURSOR_SPRAY)} * near))) {
    col = uInk - grainStep(p, uSeed + 53.9) * uGrain.z * (1.0 + ${f(CURSOR_GRAIN)} * near);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function lerpAngle(a: number, b: number, t: number): number {
  const d = (((b - a + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  return a + d * t;
}

function turnDelta(a: number, b: number): number {
  return b - a - Math.round(b - a);
}

function poseCentre(pose: Pose, rect: Rect): [number, number] {
  const hw = (rect.x1 - rect.x0) * 0.5;
  const hh = (rect.y1 - rect.y0) * 0.5;
  return [
    rect.x0 + hw + pose.u * STATION * hw,
    rect.y0 + hh + pose.v * STATION * hh,
  ];
}

function poseRays(pose: Pose, cx: number, cy: number, rect: Rect): number[] {
  const norm = (a: number) => ((a % TAU) + TAU) % TAU;
  let out: number[];
  if (pose.corner) {
    const fx = pose.u > 0 ? rect.x0 : rect.x1;
    const fy = pose.v > 0 ? rect.y0 : rect.y1;
    const far = Math.atan2(fy - cy, fx - cx);
    out = [...FAN.map((o) => far + o * DEG), far + Math.PI];
  } else {
    const corners: [number, number][] = [
      [rect.x1, rect.y1],
      [rect.x0, rect.y1],
      [rect.x0, rect.y0],
      [rect.x1, rect.y0],
    ];
    out = [
      0,
      Math.PI / 2,
      Math.PI,
      -Math.PI / 2,
      ...corners.map(([x, y]) => Math.atan2(y - cy, x - cx)),
    ];
  }
  return out.map(norm).sort((a, b) => a - b);
}

function tipRadius(cx: number, cy: number, a: number, r: Rect): number {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let t = Infinity;
  if (dx > 1e-6) t = Math.min(t, (r.x1 - cx) / dx);
  else if (dx < -1e-6) t = Math.min(t, (r.x0 - cx) / dx);
  if (dy > 1e-6) t = Math.min(t, (r.y1 - cy) / dy);
  else if (dy < -1e-6) t = Math.min(t, (r.y0 - cy) / dy);
  return Number.isFinite(t) ? t : 0;
}

export class SprayBurst {
  ok = false;

  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};

  private raf = 0;
  private running = false;
  private start0 = 0;
  private lastFrame = -1;

  private rect: Rect = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private unit = 1;

  private angles = new Float32Array(8);
  private tips = new Float32Array(8);
  private px = 0;
  private py = 0;
  private over = false;
  private cursor = 0;
  private lastT = 0;
  private star = { cx: 0, cy: 0, a: new Float32Array(8), t: new Float32Array(8) };
  private unwatch: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl =
      (canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(canvas, () => {
      this.stop();
      this.ok = false;
    });

    const prog = this.link(VERT, FRAG);
    if (!prog) return;
    this.prog = prog;

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
      "uRes", "uC", "uRect", "uUnit", "uSeed",
      "uScene", "uPaper", "uPlate", "uInk", "uGrain", "uSprayI", "uCursor",
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
    this.u.uA = gl.getUniformLocation(prog, "uA[0]");
    this.u.uT = gl.getUniformLocation(prog, "uT[0]");

    this.ok = true;
    this.resize();
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

  private link(vs: string, fs: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) return null;
    const v = this.compile(gl.VERTEX_SHADER, vs);
    const f2 = this.compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f2) return null;
    const p = gl.createProgram();
    if (!p) return null;
    gl.attachShader(p, v);
    gl.attachShader(p, f2);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f2);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      gl.deleteProgram(p);
      return null;
    }
    gl.useProgram(p);
    return p;
  }

  resize() {
    const gl = this.gl;
    if (!gl || !this.ok) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const m = h * MARGIN;
    this.rect = { x0: m, y0: m, x1: w - m, y1: h - m };
    this.unit = (this.rect.y1 - this.rect.y0) * 0.5;
    this.lastFrame = -1;
  }

  private starFrame(k0: number, out: { cx: number; cy: number; a: Float32Array; t: Float32Array }) {
    const beat = Math.floor(k0 / BEAT) % STAR_STATIONS;
    const k = k0 % BEAT;

    let from = beat;
    let to = beat;
    let p = 1;
    if (k >= TRANSIT_OUT) {
      to = (beat + 1) % STAR_STATIONS;
      p = TRANSIT[k - TRANSIT_OUT];
    } else if (k < TRANSIT.length - TRANSIT_SPLIT) {
      from = (beat + STAR_STATIONS - 1) % STAR_STATIONS;
      p = TRANSIT[k + TRANSIT_SPLIT];
    }

    const [ax, ay] = poseCentre(POSES[STAR_TOUR[from]], this.rect);
    const [bx, by] = poseCentre(POSES[STAR_TOUR[to]], this.rect);
    out.cx = ax + (bx - ax) * p;
    out.cy = ay + (by - ay) * p;

    const ra = poseRays(POSES[STAR_TOUR[from]], ax, ay, this.rect);
    const rb = poseRays(POSES[STAR_TOUR[to]], bx, by, this.rect);

    const grow = TIP_GROW * this.unit;
    const tipRect: Rect = {
      x0: this.rect.x0 - grow,
      y0: this.rect.y0 - grow,
      x1: this.rect.x1 + grow,
      y1: this.rect.y1 + grow,
    };
    for (let i = 0; i < 8; i++) {
      const a = lerpAngle(ra[i], rb[i], p);
      out.a[i] = a;
      out.t[i] = tipRadius(out.cx, out.cy, a, tipRect);
    }
  }

  private render(frame: number) {
    const gl = this.gl;
    if (!gl || !this.prog) return;

    const slot = Math.floor(frame / SCENE_FRAMES) % SCENE_COUNT;
    const scene = ORDER[slot];
    const k = frame % SCENE_FRAMES;
    const u = k / SCENE_FRAMES;
    const pal = PALETTES[slot];

    const paced = (table: number[], beats: number) => {
      const b = u * beats;
      return Math.floor(b) + ease(table, b % 1);
    };

    const amt = this.cursor * CURSOR_AMOUNT[scene];
    const gesture = CURSOR_GESTURE[scene];
    const localR = CURSOR_LOCAL_R * this.unit;
    const nearness = (x: number, y: number) =>
      Math.max(0, 1 - Math.hypot(x - this.px, y - this.py) / localR);

    const angles = this.angles;
    const tips = this.tips;
    let cx = (this.rect.x0 + this.rect.x1) * 0.5;
    let cy = (this.rect.y0 + this.rect.y1) * 0.5;

    if (scene === 0) {
      this.starFrame(k, this.star);
      cx = this.star.cx;
      cy = this.star.cy;
      angles.set(this.star.a);
      tips.set(this.star.t);
      if (gesture === "reach" && amt > 0) {
        const toCur = Math.atan2(this.py - cy, this.px - cx);
        for (let i = 0; i < 8; i++) {
          const align = Math.max(0, Math.cos(angles[i] - toCur));
          tips[i] *= 1 + amt * align * align;
        }
      }
    } else if (scene === 1) {
      cx += RING_OFF[0] * this.unit;
      cy += RING_OFF[1] * this.unit;
      const g = paced(SNAP, RING_BEATS);
      const toCur = Math.atan2(this.py - cy, this.px - cx) / TAU;
      for (let i = 0; i < RING_SPIN.length; i++) {
        const own = RING_GAP_AT[i] + RING_SPIN[i] * g;
        angles[i] = own + amt * turnDelta(own, toCur);
      }
    } else if (scene === 2) {
      const reach = Math.max(...BAR_L) * this.unit;
      const span = this.rect.x1 - this.rect.x0 + 2 * reach;
      for (let i = 0; i < BAR_V.length; i++) {
        const b = u * BAR_BEATS + BAR_OFF[i];
        const g = Math.floor(b) + ease(SNAP, b % 1);
        const t = ((BAR_V[i] * g) % 1 + 1) % 1;
        const x = this.rect.x0 - reach + t * span;
        angles[i] = x + amt * nearness(x, this.rect.y0 + (this.rect.y1 - this.rect.y0) * 0.5 + BAR_Y[i] * this.unit) * (this.px - x);
      }
    } else if (scene === 3) {
      const g = paced(GLIDE, DISC_BEATS);
      for (let i = 0; i < DISC_R.length; i++) {
        const th = (DISC_PHASE[i] + DISC_SPIN[i] * g) * TAU;
        let x = cx + Math.cos(th) * DISC_OX[i] * this.unit;
        let y = cy + Math.sin(th) * DISC_OY[i] * this.unit;
        const pull = amt * nearness(x, y) * (DISC_R[0] / DISC_R[i]);
        x += pull * (this.px - x);
        y += pull * (this.py - y);
        angles[i] = x;
        tips[i] = y;
      }
    } else if (scene === 4) {
      let g = WEDGE_SPIN * paced(SNAP, WEDGE_BEATS);
      if (amt > 0) {
        const toCur = Math.atan2(this.py - cy, this.px - cx) / TAU;
        let best = 0;
        for (let i = 0; i < WEDGE_AT.length; i++) {
          const d = turnDelta(WEDGE_AT[i] + g, toCur);
          if (Math.abs(d) < Math.abs(best) || i === 0) best = d;
        }
        g += amt * best;
      }
      for (let i = 0; i < WEDGE_AT.length; i++) angles[i] = WEDGE_AT[i] + g;
    } else {
      const th = DOT_ANGLE * TAU;
      angles[0] = DOT_SPEED * paced(GLIDE, DOT_BEATS);
      angles[1] = (Math.cos(th) * DOT_FREQ * DOT_STEP);
      angles[2] = (Math.sin(th) * DOT_FREQ * DOT_STEP);
      angles[3] = amt;
    }

    gl.useProgram(this.prog);
    gl.uniform2f(this.u.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uC!, cx, cy);
    gl.uniform4f(
      this.u.uRect!,
      this.rect.x0,
      this.rect.y0,
      this.rect.x1,
      this.rect.y1,
    );
    gl.uniform1f(this.u.uUnit!, this.unit);
    gl.uniform1i(this.u.uScene!, scene);
    gl.uniform3f(this.u.uPaper!, pal.paper[0] / 255, pal.paper[1] / 255, pal.paper[2] / 255);
    gl.uniform3f(this.u.uPlate!, pal.plate[0] / 255, pal.plate[1] / 255, pal.plate[2] / 255);
    gl.uniform3f(this.u.uInk!, pal.ink[0] / 255, pal.ink[1] / 255, pal.ink[2] / 255);
    gl.uniform1f(this.u.uSprayI!, SPRAY_INK * this.unit * SPRAY_SCALE[scene]);
    gl.uniform3f(this.u.uCursor!, this.px, this.py, this.cursor);
    const gs = GRAIN_SCALE[scene];
    gl.uniform3f(
      this.u.uGrain!,
      (GRAIN_PAPER * gs) / 255,
      (GRAIN_PLATE * gs) / 255,
      (GRAIN_INK * gs) / 255,
    );
    gl.uniform1f(this.u.uSeed!, frame * 7.13 + 0.5);
    gl.uniform1fv(this.u.uA!, angles);
    gl.uniform1fv(this.u.uT!, tips);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    if (!this.start0) this.start0 = now;

    const dt = this.lastT ? Math.min((now - this.lastT) / 1000, 0.05) : 0;
    this.lastT = now;
    const target = this.over ? 1 : 0;
    if (dt > 0) this.cursor += (target - this.cursor) * (1 - Math.exp(-dt / CURSOR_EASE));
    const moved = Math.abs(this.cursor - target) > 0.001;
    const idx = Math.floor(((now - this.start0) / 1000) * FPS) % TOTAL;
    if (idx !== this.lastFrame || moved) {
      this.lastFrame = idx;
      this.render(idx);
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  start() {
    if (!this.ok || this.running) return;
    this.running = true;
    this.start0 = performance.now() - (this.lastFrame < 0 ? 0 : (this.lastFrame / FPS) * 1000);
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setPointer(x: number | null, y: number | null) {
    if (x == null || y == null) {
      this.over = false;
      return;
    }
    const scale = this.canvas.width / Math.max(1, this.canvas.clientWidth);
    this.px = x * scale;
    this.py = y * scale;
    this.over = true;
  }

  renderStill() {
    if (!this.ok) return;
    this.lastFrame = STILL_FRAME;
    this.render(STILL_FRAME);
  }

  destroy() {
    this.stop();
    this.unwatch();
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad] });
    this.gl = null;
    this.quad = null;
    this.prog = null;
    this.ok = false;
  }
}
