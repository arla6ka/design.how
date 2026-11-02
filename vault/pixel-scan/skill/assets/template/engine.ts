// Pixel scan (https://design.how/vault/pixel-scan), engine.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, ACCENT, ACCENT2, TEXT_COLOR, GROUND, ENTRANCE_SECONDS, MODE, SPOT_RADIUS, TRAIL_LIFE, FONT_VAR).
import {disposeGl, watchContextLoss} from './runtime/dispose';
import {
  ACCENT, ACCENT2, BAND_WIDTH, BASE, DPR_CAP, ENTRANCE_SECONDS, FONT_SIZE, FONT_WEIGHT, HOVER_EASE, LIVE_EASE, MODE,
  SPOT_RADIUS, STILL_PROGRESS, TEXT_COLOR, TRAIL, TRAIL_LIFE, TRAIL_STEP_PX, WORD,
} from './params';

const FRAG =  `
precision highp float;
uniform sampler2D src;
uniform vec2 resolution;
uniform float time;
uniform float enterTime;
uniform int mode;
uniform float width;
uniform vec3 accent;
uniform vec3 accent2;
uniform vec3 baseCol;
uniform vec2 mouse;
uniform float hover;
uniform float spot;
#define TRAIL ${TRAIL}
uniform vec2 trail[TRAIL];
uniform float trailW[TRAIL];
#define W width
#define LAYERS 3.0

vec4 readTex(vec2 uv) {
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return vec4(0);
  return texture2D(src, uv);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(4859., 3985.))) * 3984.); }
float sdBox(vec2 p, float r) { vec2 q = abs(p) - r; return min(length(q), max(q.y, q.x)); }

vec2 mp = vec2(0.);
vec2 tp[TRAIL];

vec2 pxToP(vec2 px) {
  vec2 q = (px / resolution) * 2. - 1.;
  q.y *= resolution.y / resolution.x;
  return q;
}

float toRangeT(vec2 p, float scale) {
  if (mode == 0) return p.x / (scale * 2.) + .5;
  if (mode == 1) return 1. - (p.y / (scale * 2.) + .5);
  if (mode == 2) return length(p) / scale;
  return dot(p, vec2(0.7071, 0.7071)) / (scale * 2.) + .5;
}

// One block at a lattice cell: a small box jittered off its point, masked to the glyph, lit by the band and the pool.
vec4 cell(vec2 p, vec2 pi, float scale, float t, float edge) {
  vec2 pc = pi + .5;
  vec2 uvc = pc / scale;
  uvc.y /= resolution.y / resolution.x;
  uvc = uvc * 0.5 + 0.5;
  if (uvc.x < 0. || uvc.x > 1. || uvc.y < 0. || uvc.y > 1.) return vec4(0);
  float alpha = smoothstep(.0, .1, texture2D(src, uvc).a);

  // The per-cell jitter is wider than the band, so neighbours light at different scan positions.
  float x = toRangeT(pi, scale);
  float n = hash(pi);
  float anim = smoothstep(W * 2., .0, abs(x + n * W * 2.2 - t));

  // The pointer's pool, along its wake: a blob whose reach wobbles with angle and time.
  vec2 cellP = pc / scale;
  float spotA = 0.;
  for (int i = 0; i < TRAIL; i++) {
    float w = trailW[i];
    if (w <= 0.) continue;
    vec2 rel = cellP - tp[i];
    float ang = atan(rel.y, rel.x);
    float reach = spot * 0.8 * (1. + 0.30 * sin(3. * ang + time * 1.6) + 0.16 * sin(5. * ang - time * 1.1 + 1.3));
    spotA = max(spotA, smoothstep(reach, reach * 0.4, length(rel)) * w);
  }
  anim = max(anim, spotA * hover);

  // Each cell drifts between the two accents on its own phase.
  float tone = clamp(0.5 + 0.5 * sin(time * 2.0 + n * 6.2831) + 0.18 * sin(time * 3.7 + n * 12.566), 0., 1.);
  vec3 cellAccent = mix(accent, accent2, tone);
  vec4 color = vec4(mix(baseCol, cellAccent, anim), 1.) * anim;

  // A faint pull toward the pointer while it hovers.
  float pull = hover * smoothstep(spot * 1.4, 0., length(cellP - mp));
  vec2 bp = p - pc - normalize(mp - cellP + 1e-5) * pull * 0.18;

  float sd = sdBox(bp, .38);
  color *= mix(1., clamp(.3 / abs(sd), 0., 10.), edge * pow(anim, 9.));
  color += vec4(cellAccent, 1.) * anim * smoothstep(.55, .0, abs(sd)) * 0.07;
  return color * alpha;
}

// The centre cell weighted four times and its four neighbours once.
vec4 cellsColor(vec2 p, float scale, float t) {
  vec2 pi = floor(p);
  vec2 d = vec2(0, 1);
  vec4 cc = cell(p, pi, scale, t, .2) * 4.;
  cc += cell(p, pi + d.xy, scale, t, .9);
  cc += cell(p, pi - d.xy, scale, t, .9);
  cc += cell(p, pi + d.yx, scale, t, .9);
  cc += cell(p, pi - d.yx, scale, t, .9);
  return cc / 8.;
}

vec4 draw(vec2 uv, vec2 p, float t, float scale) {
  vec4 c = readTex(uv);
  vec2 pi = floor(p * scale);
  float n = hash(pi);
  t = t * (1. + W * 4.) - W * 2.;
  c *= smoothstep(t, t - W, toRangeT(pi, scale) + n * W);
  c += cellsColor(p * scale, scale, t) * 1.1;
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = uv * 2. - 1.;
  p.y *= resolution.y / resolution.x;
  mp = pxToP(mouse);
  for (int i = 0; i < TRAIL; i++) tp[i] = pxToP(trail[i]);
  float t = clamp(enterTime, 0., 1.);
  t = fract(t * .99999);
  vec4 col = vec4(0.);
  for (float i = 0.; i < LAYERS; i++) col += draw(uv, p, t, abs(cos(i) * 11. + 32.));
  gl_FragColor = col / LAYERS * smoothstep(0., 0.01, t);
}
`;

const VERT =  `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const U = ['src', 'resolution', 'time', 'enterTime', 'mode', 'width', 'accent', 'accent2', 'baseCol', 'mouse', 'hover', 'spot', 'trail', 'trailW'] as const;

function rasterise(w: number, h: number, dpr: number, family: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.scale(dpr, dpr);
  const px = w * FONT_SIZE;
  ctx.font = `${FONT_WEIGHT} ${px}px ${family}`;
  ctx.letterSpacing = `${-px * 0.02}px`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(WORD, w / 2, h / 2 + px * 0.04);
  return c;
}

export class PixelScan {
  readonly ok: boolean;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private loc = {} as Record<(typeof U)[number], WebGLUniformLocation | null>;
  private unwatch: () => void;

  private dpr = 1;
  private w = 0;
  private h = 0;
  private raf = 0;
  private running = false;
  private last = 0;
  private time = 0;
  private entrance = 0;

  private hoverTarget = 0;
  private hover = 0;
  private liveOn = false;
  private targetX = -1e4;
  private targetY = -1e4;
  private liveX = -1e4;
  private liveY = -1e4;
  private lastPx = 0;
  private lastPy = 0;
  private head = 1;
  private trail = new Float32Array(TRAIL * 2).fill(-1e4);
  private trailW = new Float32Array(TRAIL);
  private born = new Float64Array(TRAIL).fill(-1e9);

  constructor(private host: HTMLElement, private canvas: HTMLCanvasElement, private family: string) {
    this.gl = canvas.getContext('webgl', {alpha: true, antialias: false, premultipliedAlpha: true});
    this.unwatch = watchContextLoss(canvas, () => { this.stop(); this.gl = null; });
    this.ok = !!this.gl && this.build();
    if (!this.ok) return;
    this.resize();
    host.addEventListener('pointerenter', this.onEnter);
    host.addEventListener('pointerleave', this.onLeave);
    host.addEventListener('pointermove', this.onMove);
    host.addEventListener('pointerdown', this.onDown);
  }

  private build(): boolean {
    const gl = this.gl!;
    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return false; }
    this.program = program;
    gl.useProgram(program);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    for (const name of U) this.loc[name] = gl.getUniformLocation(program, name === 'trail' || name === 'trailW' ? `${name}[0]` : name);
    gl.uniform1i(this.loc.src, 0);
    gl.uniform1i(this.loc.mode, MODE);
    gl.uniform1f(this.loc.width, BAND_WIDTH);
    gl.uniform3fv(this.loc.accent, ACCENT);
    gl.uniform3fv(this.loc.accent2, ACCENT2);
    gl.uniform3fv(this.loc.baseCol, BASE);
    gl.uniform1f(this.loc.spot, SPOT_RADIUS);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.texture = gl.createTexture();
    return true;
  }

  resize() {
    const gl = this.gl;
    if (!gl) return;
    const r = this.host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    if (r.width === this.w && r.height === this.h && dpr === this.dpr) return;
    this.w = r.width;
    this.h = r.height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.loc.resolution, this.canvas.width, this.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rasterise(r.width, r.height, dpr, this.family));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (!this.running) this.draw(this.progress());
  }

  private progress(): number {
    if (this.entrance >= ENTRANCE_SECONDS) return 2;
    const x = this.entrance / ENTRANCE_SECONDS;
    return 1 - (1 - x) * (1 - x);
  }

  private draw(enter: number) {
    const gl = this.gl;
    if (!gl) return;
    gl.uniform1f(this.loc.time, this.time);
    gl.uniform1f(this.loc.enterTime, enter);
    gl.uniform1f(this.loc.hover, this.hover);
    gl.uniform2f(this.loc.mouse, this.liveX, this.liveY);
    gl.uniform2fv(this.loc.trail, this.trail);
    gl.uniform1fv(this.loc.trailW, this.trailW);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private local(e: PointerEvent) {
    const r = this.host.getBoundingClientRect();
    return {x: (e.clientX - r.left) * this.dpr, y: (r.height - (e.clientY - r.top)) * this.dpr};
  }
  private onEnter = (e: PointerEvent) => {
    this.hoverTarget = 1;
    this.liveOn = true;
    const l = this.local(e);
    this.targetX = this.liveX = this.lastPx = l.x;
    this.targetY = this.liveY = this.lastPy = l.y;
    this.entrance = 0;
  };
  private onLeave = () => { this.hoverTarget = 0; this.liveOn = false; };
  private onMove = (e: PointerEvent) => { const l = this.local(e); this.targetX = l.x; this.targetY = l.y; };
  private onDown = (e: PointerEvent) => { if (e.pointerType === 'touch') this.entrance = 0; };

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
    const frames = dt * 60;
    const prev = this.last || now;
    this.last = now;
    this.time += dt;
    this.entrance += dt;
    this.hover += (this.hoverTarget - this.hover) * (1 - Math.pow(1 - HOVER_EASE, frames));
    const follow = 1 - Math.pow(1 - LIVE_EASE, frames);
    this.liveX += (this.targetX - this.liveX) * follow;
    this.liveY += (this.targetY - this.liveY) * follow;

    if (this.liveOn) {
      const step = TRAIL_STEP_PX * this.dpr;
      let moved = Math.hypot(this.liveX - this.lastPx, this.liveY - this.lastPy);
      const total = moved;
      for (let placed = 0; moved >= step && placed < 4; placed++) {
        const f = step / moved;
        this.lastPx += (this.liveX - this.lastPx) * f;
        this.lastPy += (this.liveY - this.lastPy) * f;
        this.head = this.head + 1 >= TRAIL ? 1 : this.head + 1;
        this.trail[this.head * 2] = this.lastPx;
        this.trail[this.head * 2 + 1] = this.lastPy;
        this.born[this.head] = prev + (now - prev) * (total > 0 ? 1 - moved / total : 1);
        moved = Math.hypot(this.liveX - this.lastPx, this.liveY - this.lastPy);
      }
    }
    this.trail[0] = this.liveX;
    this.trail[1] = this.liveY;
    this.trailW[0] = this.liveOn ? 1 : 0;
    for (let i = 1; i < TRAIL; i++) {
      const d = Math.max(0, Math.min(1, 1 - (now - this.born[i]) / 1000 / TRAIL_LIFE));
      this.trailW[i] = d * d * (3 - 2 * d);
    }
    this.draw(this.progress());
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.running || !this.gl) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    this.time = 1;
    this.draw(STILL_PROGRESS);
  }

  destroy() {
    this.stop();
    this.host.removeEventListener('pointerenter', this.onEnter);
    this.host.removeEventListener('pointerleave', this.onLeave);
    this.host.removeEventListener('pointermove', this.onMove);
    this.host.removeEventListener('pointerdown', this.onDown);
    this.unwatch();
    disposeGl(this.gl, {programs: [this.program], buffers: [this.buffer], textures: [this.texture]});
    this.gl = null;
  }
}
