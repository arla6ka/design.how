// Rush type (https://design.how/vault/rush-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, SY_PEAK, SX_PEAK, REST_S, SHUTTER_K, SAMPLES, ORBIT_YAW, ORBIT_PITCH, CRT_GAIN, HOLD_STRENGTH, FONT_VAR).
import { disposeGl, watchContextLoss } from "./runtime/dispose";
import {
  ARRIVE_S,
  BLOOM_BIAS,
  BLOOM_GAIN,
  AUTO_HOLD,
  AUTO_HOLD_AT,
  BLOOM_SPREAD,
  CRT_BEAM,
  CRT_GAIN,
  CRT_HUM,
  CRT_HUM_SPEED,
  CRT_MASK,
  CRT_PITCH,
  CRT_SCAN,
  CRT_SCAN_PITCH,
  CYCLE_S,
  DRIFT_DIR,
  EXPOSURE,
  FALL,
  FOCAL,
  FONT_VAR,
  GLOW_BASE,
  GLOW_MAX_Y,
  GLOW_MIN,
  GLOW_SPEED,
  GLOW_SPREAD,
  HANG_S,
  HOLD_EASE_IN,
  HOLD_EASE_OUT,
  HOLD_STRENGTH,
  LAG_U,
  LEAVE_S,
  ORBIT_DEPTH,
  ORBIT_HANG_ARC,
  ORBIT_IN,
  ORBIT_OUT,
  ORBIT_PITCH,
  ORBIT_PITCH_LAG,
  ORBIT_RISE,
  ORBIT_YAW,
  ORBIT_YAW_LAG,
  PIVOT_FRAC,
  REST_CAP_FRAC,
  REST_S,
  RISE,
  ROLL_U,
  SAMPLES,
  SCROLL_DECAY,
  SCROLL_GAIN,
  SCROLL_MAX,
  SHUTTER_K,
  SHUTTER_S,
  SHUTTER_SHAPE,
  SMEAR_GAIN,
  SPEED_GAIN,
  SWAP_FLASH,
  SWAP_SPREAD,
  SX_PEAK,
  SY_PEAK,
  THIN,
  WORDS,
  orbitTurn,
  sampleTable,
} from "./params";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = (samples: number, bloomSpread: number, bloomBias: number) => `
precision highp float;
varying vec2 vUv;

uniform sampler2D uText;
uniform vec2  uRes;      // canvas size, device px
uniform vec2  uHalfPx;   // one atlas half, texels
uniform float uSx;       // screen px per texture px, horizontal (never blurred)
uniform vec3  uSyQ;      // vertical scale across the shutter as a quadratic in u:
                         //   sy(u) = x + y*u + z*u*u,  u in -0.5..0.5
                         // Fitted through the scale at the start, middle and end.
                         // A LINEAR sweep is wrong and the peak is where it shows:
                         // the word turns around there, so start and end sit at
                         // nearly the same scale and a straight line between them
                         // reports almost no motion. The blur then vanishes at the
                         // exact moment the word is biggest, which is also the
                         // moment it swaps, and you can read both words straight
                         // through the "blur". The quadratic carries the excursion
                         // to the top and back, which is the real path.
uniform float uCenterY;  // 0..1 of canvas height, measured from the bottom
uniform float uSwapU;    // where in the shutter the word swaps, -0.5..0.5 (2.0 = no swap)
uniform float uHalfA;    // atlas half holding the word BEFORE the swap
uniform float uHalfB;    // atlas half holding the word AFTER it
uniform vec3  uK;        // per-channel shutter length, R G B
uniform vec2  uSwapScl;  // scale multiplier for the outgoing word, then the incoming
uniform float uShape;    // shutter weighting, 0 = box, 1 = triangle on the present
uniform float uRoll;     // rolling shutter, shutter-lengths over the frame height
uniform float uLag;      // per-letter lag, shutter-lengths over the frame width
uniform float uThin;     // stroke thinning, 0 at rest
uniform float uBloom;    // halo strength, 0 at rest
uniform float uGain;     // brightness recovered at speed (channel-neutral)
uniform float uExp;      // filmic rolloff
uniform float uFocal;    // focal length, device px
uniform vec3  uPos;      // word centre in camera space: X, Y, Z
uniform vec4  uRot;      // sin/cos of the yaw, then sin/cos of the pitch
uniform float uCrt;      // monitor strength, 0 at rest
uniform float uTime;     // seconds, for the hum bar's drift
uniform vec4  uGlow;     // the ground: centre xy (device px), radii xy
uniform float uGlowAmp;  // its peak brightness

#define SAMPLES ${samples}
#define BLOOM_TAPS 4
#define BLOOM_SPREAD ${bloomSpread.toFixed(3)}
#define BLOOM_BIAS ${bloomBias.toFixed(3)}
#define TAU 6.2831853
#define CRT_PITCH ${CRT_PITCH.toFixed(3)}
#define CRT_MASK ${CRT_MASK.toFixed(4)}
#define CRT_SCAN_PITCH ${CRT_SCAN_PITCH.toFixed(3)}
#define CRT_SCAN ${CRT_SCAN.toFixed(4)}
#define CRT_BEAM ${CRT_BEAM.toFixed(4)}
#define CRT_HUM ${CRT_HUM.toFixed(4)}
#define CRT_HUM_SPEED ${CRT_HUM_SPEED.toFixed(4)}

// One sample of the word at a given vertical scale, out of a given atlas half.
// Horizontal is read once per pixel and never swept: the measurement is
// unambiguous that the reference's blur does not touch x, which is why a
// vertical stem survives the worst frame as a hard white bar.
vec2 atlasUv(float sy, float halfIdx, vec2 W, out float inside) {
  float sx = max(uSx, 1e-4);
  float sv = max(abs(sy), 1e-4);
  vec2 q = vec2(
    (W.x / sx + uHalfPx.x * 0.5) / uHalfPx.x,
    (W.y / sv + uHalfPx.y * 0.5) / uHalfPx.y
  );
  // Arithmetic mask rather than a branch: this runs SAMPLES * 3 times a pixel
  // and the coordinates vary per iteration, so a real branch here would be
  // divergent and would also poison the derivatives the mip selection needs.
  inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return vec2(clamp(q.x, 0.0, 1.0), (clamp(q.y, 0.0, 1.0) + halfIdx) * 0.5);
}

float tap(float sy, float halfIdx, vec2 W, float front) {
  float inside;
  vec2 t = atlasUv(sy, halfIdx, W, inside);
  inside *= front;
  float v = texture2D(uText, t).r * inside;
  // Ink conservation: stretched type gets thinner. Squaring the coverage pulls
  // the antialiased edge in, so the stroke narrows as the word blasts instead
  // of keeping its resting weight and merely going grey. A mul-add rather than
  // a pow, because this line runs 84 times per pixel.
  return v * mix(1.0, v, uThin);
}

// The halo tap. Same geometry, read off a coarse mip so four of them cover what
// would otherwise take dozens, and NOT thinned — the halo is the light spilling
// off the stroke, not the stroke.
float tapBlur(float sy, float halfIdx, vec2 W, float front) {
  float inside;
  vec2 t = atlasUv(sy, halfIdx, W, inside);
  inside *= front;
  return texture2D(uText, t, BLOOM_BIAS).r * inside;
}

void main() {
  vec2 P = vUv * uRes;
  vec2 C = vec2(uRes.x * 0.5, uRes.y * uCenterY);
  vec2 sp = P - C;

  // ── Un-project ───────────────────────────────────────────────────────────
  // The word is a flat quad sitting at uPos in camera space, pitched about its
  // own horizontal axis and then yawed about its vertical one, seen through a
  // pinhole of focal length uFocal. Solve that projection backwards for the
  // point ON THE QUAD this pixel is looking at, and everything downstream
  // carries on working in the word's own flat space exactly as it did before
  // there was a quad.
  //
  //   Xc = uPos.x + a*cy + b*sp*sy
  //   Yc = uPos.y + b*cp
  //   Zc = uPos.z - a*sy + b*sp*cy
  //   sp_screen = uFocal * (Xc, Yc) / Zc
  //
  // Zc is LINEAR in a and b, so multiplying each screen equation through by it
  // leaves two linear equations in the two unknowns. A 2x2 solve, one
  // reciprocal, no iteration. There is no closed form that gets one coordinate
  // out before the other once both rotations are in play — with a single
  // rotation you can chain them, with two you cannot, and trying to leaves a
  // cross term unaccounted for that shows up as the word shearing.
  //
  // The determinant sits near uFocal^2 and cannot approach zero at the angles
  // this card turns through; the clamp is insurance, not load-bearing.
  //
  // At rest both rotations are zero and uPos is (0, 0, uFocal), which reduces
  // to a = sp.x and b = sp.y — the identity. The resting word is untouched.
  float sy = uRot.x, cy = uRot.y, sps = uRot.z, cps = uRot.w;
  float a1 = -(sp.x * sy + uFocal * cy);
  float b1 = sps * (sp.x * cy - uFocal * sy);
  float c1 = uFocal * uPos.x - sp.x * uPos.z;
  float a2 = -sp.y * sy;
  float b2 = sp.y * sps * cy - uFocal * cps;
  float c2 = uFocal * uPos.y - sp.y * uPos.z;
  float det = a1 * b2 - a2 * b1;
  float inv = 1.0 / (abs(det) < 1e-4 ? 1e-4 : det);
  float a = (c1 * b2 - c2 * b1) * inv;
  float b = (a1 * c2 - a2 * c1) * inv;
  float Zc = uPos.z - a * sy + b * sps * cy;
  vec2 W = vec2(a, b);
  // Behind the lens is not a place the word can be seen from.
  float front = step(uFocal * 0.05, Zc);

  vec3 acc = vec3(0.0);

  // At rest the word is not moving, so all three shutters have zero length and
  // every sample would land on the same texel. Take one tap instead: it is both
  // cheaper and genuinely sharper than 28 taps averaging the same value, and it
  // is the reason the resting frames come out pure white with no fringe. The
  // comparison is on a uniform, so the whole draw takes one side of it.
  if (abs(uSyQ.y) + abs(uSyQ.z) < 1e-5) {
    acc = vec3(tap(uSyQ.x, uHalfA, W, front));
  } else {
    // Where in the shutter THIS pixel sits, before the per-channel scaling.
    // Two offsets, both constant per pixel and both zero on the centre lines:
    // the rolling shutter reads the top of the frame earlier than the bottom,
    // and the lag puts the right of the word later in the blast than the left.
    // The lag is measured along the WORD, so it follows the word around the
    // orbit instead of staying pinned to the screen. The roll is a property of
    // the sensor, so it stays in screen space where it belongs.
    float off = uLag * (W.x / uRes.x) - uRoll * (sp.y / uRes.y);

    float wsum = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float u = float(i) / float(SAMPLES - 1) - 0.5;
      // Weighted towards the present instant, so the streak has a bright head
      // at the scale the word is at now and tails that fall away either side.
      float w = 1.0 - uShape * abs(u) * 2.0;
      wsum += w;

      float us = u + off;
      // Sweep the SCALE, not the position. A translation sweep would drag the
      // centroid, and the reference's per-channel centroids sit on top of each
      // other to under 2px in every frame. Each channel walks the same curve,
      // just over its own fraction of the shutter.
      vec3 uk = us * uK;
      vec3 sy = uSyQ.x + uSyQ.y * uk + uSyQ.z * uk * uk;
      acc.r += w * tap(
        sy.r * (uk.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.r < uSwapU ? uHalfA : uHalfB, W, front);
      acc.g += w * tap(
        sy.g * (uk.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.g < uSwapU ? uHalfA : uHalfB, W, front);
      acc.b += w * tap(
        sy.b * (uk.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.b < uSwapU ? uHalfA : uHalfB, W, front);
    }
    // Divide, never sum. This is what makes speed cost brightness, and it is
    // why the reference's peak luminance dips to 239 of 255 mid-blast. By the
    // weight sum rather than the count, so shaping the shutter changes where
    // the light lands without changing how much of it there is.
    acc /= max(wsum, 1e-4);

    // The halo, over a much longer sweep and off a coarse mip. Same per-channel
    // shutter, so green's reaches furthest — it deepens the split rather than
    // washing it out the way a neutral bloom pass would.
    vec3 halo = vec3(0.0);
    for (int j = 0; j < BLOOM_TAPS; j++) {
      float u = (float(j) / float(BLOOM_TAPS - 1) - 0.5) * BLOOM_SPREAD + off;
      vec3 uk = u * uK;
      vec3 sy = uSyQ.x + uSyQ.y * uk + uSyQ.z * uk * uk;
      halo.r += tapBlur(
        sy.r * (uk.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.r < uSwapU ? uHalfA : uHalfB, W, front);
      halo.g += tapBlur(
        sy.g * (uk.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.g < uSwapU ? uHalfA : uHalfB, W, front);
      halo.b += tapBlur(
        sy.b * (uk.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.b < uSwapU ? uHalfA : uHalfB, W, front);
    }
    acc += halo * (uBloom / float(BLOOM_TAPS));

    // Give some of the speed's brightness back. Channel-neutral by
    // construction, so it moves the exposure and never the colour.
    acc *= uGain;
  }

  // Filmic rolloff, normalised so a solid white texel lands on exactly 1.0.
  // That normalisation is what makes it safe at rest: the still word stays pure
  // white, unclipped and untinted. Everything below white is lifted, and the
  // dense core of a stroke is lifted much harder than its thin coloured tails,
  // so the core saturates hot while the fringes keep their colour against it.
  acc = (1.0 - exp(-acc * uExp)) / (1.0 - exp(-uExp));

  // ── The ground ───────────────────────────────────────────────────────────
  // A neutral pool of light behind the word, following it around the orbit and
  // growing with it. Composited UNDER the type as a proper over, not added to
  // it: the word is additive light and the ground is what it is standing in
  // front of, so adding would lift the type's own darks and flatten it.
  //
  // Neutral in all three channels by construction, so the only thing on this
  // card that can carry a colour is still the word, and still only when it is
  // moving. It goes in AFTER the rolloff, which is tuned for the word's
  // dynamic range and would otherwise lift this well past what it is set to.
  vec2 gd = (P - uGlow.xy) / max(uGlow.zw, vec2(1.0));
  float ground = uGlowAmp * (1.0 - smoothstep(0.0, 1.0, length(gd)));
  acc += ground * (1.0 - acc);

  // ── The glass ────────────────────────────────────────────────────────────
  // A monitor, and only while the word is moving. uCrt carries p, so the
  // resting frame skips this entire block and comes out of the shader as the
  // same pixels it always was. Everything here MULTIPLIES what is already on
  // screen: no light is invented, the glass only decides where it lands, which
  // is what keeps it out of the way of the colour rule.
  if (uCrt > 0.0) {
    float lum = max(max(acc.r, acc.g), acc.b);

    // Aperture grille. Three phosphor stripes per triad, 120 degrees apart, in
    // SCREEN space so the mask belongs to the glass and does not travel with
    // the word. The mask peaks above 1.0 as well as below it, so a stroke's
    // white core clips back to white and only the mid-tones carry the stripes.
    vec3 m = 0.5 + 0.5 * cos(TAU * (P.x / CRT_PITCH - vec3(0.0, 0.33333, 0.66667)));
    vec3 mask = mix(vec3(1.0), m * 2.0, CRT_MASK * uCrt);

    // Scanlines, horizontal — the one direction this card otherwise never
    // touches, which is exactly why they read as a grid over the image instead
    // of as more smearing. The beam blooms as current rises, so the depth falls
    // away where the signal is hot and the brightest part of the blast goes
    // clean; without that they sit on the picture like a decal.
    float s = 0.5 + 0.5 * cos(TAU * P.y / CRT_SCAN_PITCH);
    float scan = 1.0 - CRT_SCAN * uCrt * (1.0 - CRT_BEAM * lum) * (1.0 - s);

    // Hum bar: a soft band of extra beam current crawling slowly up the frame,
    // a display running a little out of step with what is driving it.
    float bar = 0.5 + 0.5 * cos(TAU * (P.y / uRes.y - uTime * CRT_HUM_SPEED));
    float hum = 1.0 + CRT_HUM * uCrt * (bar * 2.0 - 1.0);

    acc *= mask * scan * hum;
  }

  gl_FragColor = vec4(acc, 1.0);
}
`;

const SEQ = WORDS.length % 2 ? [...WORDS, ...WORDS] : WORDS;

interface Frame {
  p: number;
  psi: number;
  idx: number;
  rising: boolean;
}

const HANG_H = HANG_S * 0.5;
const ARRIVE_END = HANG_H + ARRIVE_S;
const REST_END = ARRIVE_END + REST_S;
const LEAVE_END = REST_END + LEAVE_S;
const SWING_ARC = Math.PI - ORBIT_HANG_ARC;

function frameAt(tSec: number): Frame {
  const total = CYCLE_S * SEQ.length;
  let t = tSec % total;
  if (t < 0) t += total;
  const idx = Math.floor(t / CYCLE_S);
  const tau = t - idx * CYCLE_S;

  let p: number;
  let psi: number;
  let rising = false;
  if (tau < HANG_H) {
    p = 1;
    psi = ORBIT_HANG_ARC * (tau / HANG_H);
  } else if (tau < ARRIVE_END) {
    const u = (tau - HANG_H) / ARRIVE_S;
    p = sampleTable(FALL, u);
    psi = ORBIT_HANG_ARC + SWING_ARC * sampleTable(ORBIT_IN, u);
  } else if (tau < REST_END) {
    p = 0;
    psi = Math.PI;
  } else if (tau < LEAVE_END) {
    const u = (tau - REST_END) / LEAVE_S;
    p = sampleTable(RISE, u);
    psi = Math.PI + SWING_ARC * sampleTable(ORBIT_OUT, u);
    rising = true;
  } else {
    p = 1;
    psi = 2 * Math.PI - ORBIT_HANG_ARC * (1 - (tau - LEAVE_END) / HANG_H);
    rising = true;
  }
  return { p, psi, idx, rising };
}

function resolveFamily(cssVar: string): string {
  if (typeof document === "undefined") return "sans-serif";
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:${cssVar}`;
  probe.textContent = "Ag";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily;
  document.body.removeChild(probe);
  return fam || "sans-serif";
}

export class RushType {
  ok = false;

  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private tex: WebGLTexture | null = null;
  private uni: Record<string, WebGLUniformLocation | null> = {};

  private aw = 1024;
  private hh = 256;
  private texCap = 164;
  private scratch: HTMLCanvasElement | null = null;
  private halfWord: [string | null, string | null] = [null, null];
  private wordHalfW = 1;
  private rasteredFor = Number.NaN;

  private family = "sans-serif";
  private raf = 0;
  private running = false;
  private last = 0;
  private readonly startOffset = ARRIVE_END + REST_S * 0.5;
  private clock = this.startOffset;
  private vel = 0;
  private lastY = 0;
  private held = false;
  private hold = 0;
  private autoUntil = 0;
  private autoCycle = -1;
  private wall = 0;
  private unwatch: () => void = () => {};

  constructor(host: HTMLElement) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(this.canvas);
    this.family = resolveFamily(FONT_VAR);
    this.init();
  }

  private init() {
    const gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext | null;
    if (!gl) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(this.canvas, () => {
      this.stop();
      this.ok = false;
    });

    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    const prog = this.link(VERT, FRAG(coarse ? 18 : SAMPLES, BLOOM_SPREAD, BLOOM_BIAS));
    if (!prog) return;
    this.prog = prog;

    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    for (const n of [
      "uText", "uRes", "uHalfPx", "uSx", "uSyQ",
      "uCenterY", "uSwapU", "uHalfA", "uHalfB", "uK",
      "uShape", "uRoll", "uLag", "uThin", "uBloom", "uGain", "uExp", "uSwapScl",
      "uFocal", "uPos", "uRot", "uCrt", "uTime", "uGlow", "uGlowAmp",
    ]) {
      this.uni[n] = gl.getUniformLocation(prog, n);
    }

    gl.clearColor(0, 0, 0, 1);
    this.resize();
    this.ok = true;
  }

  private link(vs: string, fs: string): WebGLProgram | null {
    const gl = this.gl!;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      gl.deleteProgram(p);
      return null;
    }
    return p;
  }

  private allocAtlas() {
    const gl = this.gl!;
    const needed = this.canvas.width * (SX_PEAK / (1 - ORBIT_DEPTH)) * 1.3;
    const aw = needed > 1000 ? 2048 : 1024;
    const hh = aw / 4;
    const changed = aw !== this.aw || !this.tex;
    this.aw = aw;
    this.hh = hh;
    this.texCap = Math.round(hh * 0.64);

    if (changed) {
      if (this.tex) gl.deleteTexture(this.tex);
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, aw, hh * 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.scratch = document.createElement("canvas");
      this.scratch.width = aw;
      this.scratch.height = hh;
      this.halfWord = [null, null];
      this.rasteredFor = Number.NaN;
    }
  }

  private rasterWord(word: string, half: 0 | 1) {
    const gl = this.gl;
    const c = this.scratch;
    if (!gl || !c || !this.tex) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);

    const text = (word || "").trim();
    if (text) {
      let size = this.texCap * 1.4;
      ctx.font = `400 ${size}px ${this.family}`;
      const capOf = () => {
        const m = ctx.measureText("H");
        return m.actualBoundingBoxAscent || size * 0.72;
      };
      size *= this.texCap / capOf();
      ctx.font = `400 ${size}px ${this.family}`;
      const maxW = c.width * 0.92;
      const w = ctx.measureText(text).width;
      if (w > maxW) {
        size *= maxW / w;
        ctx.font = `400 ${size}px ${this.family}`;
      }
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, c.width / 2, c.height / 2 + this.texCap / 2);
      this.wordHalfW = ctx.measureText(text).width * 0.5;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texSubImage2D(
      gl.TEXTURE_2D, 0, 0, half * this.hh, gl.RGBA, gl.UNSIGNED_BYTE, c,
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.halfWord[half] = word;
  }

  private resize() {
    const gl = this.gl;
    if (!gl) return;
    const r = this.host.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (w === this.canvas.width && h === this.canvas.height && this.tex) return;
    this.canvas.width = w;
    this.canvas.height = h;
    gl.viewport(0, 0, w, h);
    this.allocAtlas();
    this.rasterWord(SEQ[0], 0);
    this.rasterWord(SEQ[1 % SEQ.length], 1);
    this.rasteredFor = 0;
  }

  onResize() {
    this.resize();
    if (!this.running) this.draw(this.clock);
  }

  refreshFont() {
    this.family = resolveFamily(FONT_VAR);
    const a = this.halfWord[0];
    const b = this.halfWord[1];
    if (a) this.rasterWord(a, 0);
    if (b) this.rasterWord(b, 1);
    if (!this.running) this.draw(this.clock);
  }

  private draw(tSec: number) {
    const gl = this.gl;
    const prog = this.prog;
    if (!gl || !prog || !this.tex) return;

    const half = SHUTTER_S * 0.5;
    const here = frameAt(tSec);
    const before = frameAt(tSec - half);
    const after = frameAt(tSec + half);

    const total = CYCLE_S * SEQ.length;
    let tw = tSec % total;
    if (tw < 0) tw += total;
    const k = Math.floor(tw / CYCLE_S);
    if (this.rasteredFor !== k && tw - k * CYCLE_S >= ARRIVE_END) {
      const nextIdx = (k + 1) % SEQ.length;
      this.rasterWord(SEQ[nextIdx], (nextIdx % 2) as 0 | 1);
      this.rasteredFor = k;
    }

    const k0 = Math.floor((tSec - half) / CYCLE_S);
    const k1 = Math.floor((tSec + half) / CYCLE_S);
    const swapU = k1 > k0 ? (k1 * CYCLE_S - tSec) / SHUTTER_S : 2;

    const swapSep = Math.max(0, 1 - (2 * (tSec - Math.round(tSec / CYCLE_S) * CYCLE_S)) ** 2 / SHUTTER_S ** 2);

    const restCap = this.canvas.height * REST_CAP_FRAC;
    const unit = restCap / this.texCap;
    const syOf = (f: Frame) => unit * (1 + f.p * (SY_PEAK - 1));

    const syB = syOf(before);
    const syC = syOf(here);
    const syA = syOf(after);
    const qa = syC;
    const qc = 2 * (syA + syB - 2 * syC);
    const qbT = syA - syB;
    const extra = SMEAR_GAIN * here.p * syC;
    const mag = Math.sqrt(qbT * qbT + extra * extra);
    const qb = qbT < 0 ? -mag : mag;
    const sx = unit * (1 + here.p * (SX_PEAK - 1));
    const pivot = PIVOT_FRAC * here.p;

    const cw = DRIFT_DIR[here.idx % DRIFT_DIR.length] ?? 1;
    const psi = here.psi * Math.sign(cw || 1);
    const amp = Math.abs(cw);
    const f = this.canvas.height * FOCAL;
    const z = f * (1 - ORBIT_DEPTH * (1 + Math.cos(psi)) * 0.5);
    const x = 0;
    const y = f * ORBIT_RISE * amp * Math.sin(psi);
    const yaw = orbitTurn(psi, ORBIT_YAW, ORBIT_YAW_LAG);
    const pitch = orbitTurn(psi, ORBIT_PITCH, ORBIT_PITCH_LAG);

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.uniform1i(this.uni.uText, 0);
    gl.uniform2f(this.uni.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uni.uHalfPx, this.aw, this.hh);
    gl.uniform1f(this.uni.uSx, sx);
    gl.uniform3f(this.uni.uSyQ, qa, qb, qc);
    gl.uniform1f(this.uni.uCenterY, 0.5 + pivot);
    gl.uniform1f(this.uni.uSwapU, swapU);
    gl.uniform1f(this.uni.uHalfA, before.idx % 2);
    gl.uniform1f(this.uni.uHalfB, after.idx % 2);
    gl.uniform3f(this.uni.uK, SHUTTER_K[0], SHUTTER_K[1], SHUTTER_K[2]);
    gl.uniform1f(this.uni.uShape, SHUTTER_SHAPE);
    gl.uniform1f(this.uni.uRoll, ROLL_U);
    gl.uniform1f(this.uni.uLag, LAG_U);
    gl.uniform1f(this.uni.uThin, THIN * here.p);
    gl.uniform1f(this.uni.uBloom, BLOOM_GAIN * here.p);
    gl.uniform1f(
      this.uni.uGain,
      (1 + SPEED_GAIN * here.p) * (1 + SWAP_FLASH * swapSep),
    );
    gl.uniform2f(
      this.uni.uSwapScl,
      1 + SWAP_SPREAD * swapSep,
      1 - SWAP_SPREAD * swapSep,
    );
    gl.uniform1f(this.uni.uExp, EXPOSURE);
    gl.uniform1f(this.uni.uFocal, f);
    gl.uniform3f(this.uni.uPos, x, y, z);
    gl.uniform4f(
      this.uni.uRot,
      Math.sin(yaw), Math.cos(yaw),
      Math.sin(pitch), Math.cos(pitch),
    );
    gl.uniform1f(this.uni.uCrt, CRT_GAIN * here.p);
    const gx = this.canvas.width * 0.5 + (f * x) / z;
    const gy = this.canvas.height * (0.5 + pivot) + (f * y) / z;
    const persp = f / z;
    const wordW = this.wordHalfW * sx * persp;
    const wordH = this.texCap * syC * persp;
    gl.uniform4f(
      this.uni.uGlow,
      gx,
      gy,
      Math.max(wordW * GLOW_SPREAD, this.canvas.width * GLOW_MIN),
      Math.min(
        Math.max(wordH * GLOW_SPREAD, this.canvas.height * GLOW_MIN),
        this.canvas.height * GLOW_MAX_Y,
      ),
    );
    gl.uniform1f(this.uni.uGlowAmp, GLOW_BASE + GLOW_SPEED * here.p);
    gl.uniform1f(this.uni.uTime, this.wall % (1 / CRT_HUM_SPEED));

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private onScroll = () => {
    const y = window.scrollY;
    this.vel = Math.min(this.vel + Math.abs(y - this.lastY), SCROLL_MAX / SCROLL_GAIN);
    this.lastY = y;
  };

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    this.wall += dt;
    this.vel *= Math.exp(-SCROLL_DECAY * dt);

    const fr = frameAt(this.clock);
    const auto = AUTO_HOLD[fr.idx % AUTO_HOLD.length] ?? 0;
    const cycle = Math.floor(this.clock / CYCLE_S);
    if (auto > 0 && fr.rising && fr.p > AUTO_HOLD_AT && this.autoCycle !== cycle) {
      this.autoCycle = cycle;
      this.autoUntil = this.wall + auto;
    }

    const want = Math.max(this.held ? 1 : 0, this.wall < this.autoUntil ? 1 : 0);
    const ease = want > this.hold ? HOLD_EASE_IN : HOLD_EASE_OUT;
    const k = dt > 0 ? 1 - Math.exp(-dt / ease) : 0;
    this.hold += (want - this.hold) * k;

    const pp = fr.p * fr.p;
    const brake = 1 - this.hold * HOLD_STRENGTH * pp * pp;
    this.clock += dt * (1 + Math.min(SCROLL_GAIN * this.vel, SCROLL_MAX)) * brake;
    this.draw(this.clock);
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.last = 0;
    this.lastY = window.scrollY;
    this.vel = 0;
    window.addEventListener("scroll", this.onScroll, { passive: true });
    this.raf = requestAnimationFrame(this.tick);
  }

  setHeld(v: boolean) {
    this.held = v;
  }

  stop() {
    if (this.running) window.removeEventListener("scroll", this.onScroll);
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.draw(this.clock);
  }

  destroy() {
    this.stop();
    this.unwatch();
    disposeGl(this.gl, { programs: [this.prog], buffers: [this.quad], textures: [this.tex] });
    this.gl = null;
    this.prog = null;
    this.quad = null;
    this.tex = null;
    this.scratch = null;
    this.canvas.remove();
  }
}
