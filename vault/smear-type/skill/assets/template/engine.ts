// Smear type (https://design.how/vault/smear-type), engine.ts.
// FIXED. Change the VARIABLE values in params instead (DEFAULT_LINES, DEFAULT_GROUND, DEFAULT_RIBBON, DEFAULT_RIM, DEFAULT_TYPE, DEFAULT_INK, KEY_MS, CAP, WIDEN, EMBOLDEN, BLUR, FONT_WEIGHT, FONT_VAR, LAYERS_URL, INK_URL).
import {capDpr, disposeGl, watchContextLoss} from './runtime/dispose';
import {
  BLUR,
  CAP,
  CLOUD,
  CELL,
  COLS,
  DEFAULT_GROUND,
  DEFAULT_INK,
  DEFAULT_LINES,
  DEFAULT_RIBBON,
  DEFAULT_RIM,
  DEFAULT_TYPE,
  EMBOLDEN,
  FEATHER,
  FONT_WEIGHT,
  INK_CELL,
  INK_COLS,
  INK_FRAMES,
  INK_URL,
  KEY_MS,
  LAYERS,
  LAYERS_URL,
  LINE_BLUR,
  LINE_MARGIN,
  LINE_TOP,
  LOOP_KEYS,
  PRESENCE,
  PRESENCE_GAIN,
  RIM_IN,
  REVEAL_BLUR,
  REVEAL_CURVE,
  RIM_OUT,
  ROWS,
  SCENE,
  SLIDE,
  SOFT,
  STILL_KEY,
  TAPS,
  TRACK,
  WIDEN,
  WIDE,
} from './params';

export type SmearColours = {ground?: string; ribbon?: string; rim?: string; type?: string; ink?: string};

export interface SmearTypeOptions {
  family: string;
  lines?: readonly [string, string];
  colours?: SmearColours;
  weight?: number;
  speed?: number;
  layersUrl?: string;
  inkUrl?: string;
}

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

const N = SCENE / CELL;
const INK_N = SCENE / INK_CELL;
const INK_ROWS = Math.ceil(INK_FRAMES.length / INK_COLS);

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uScale;
uniform vec2 uOrigin;
uniform sampler2D uLayers, uInk, uType;
uniform vec2 uCell;     // this frame's cell in the layer atlas, column and row
uniform vec2 uInkCell;  // this frame's cell in the ink atlas, or -1 for none
uniform float uReady;
uniform vec4 uLines;    // the lines' box with its margin: left, top, right, bottom
uniform vec2 uSlide;    // each line's x offset this frame
uniform float uSplit;   // the y between the two lines
uniform vec3 uGround, uRibbon, uRim, uTypeInk, uInkCol;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// One layer of this frame at a scene point: layer 0 ribbon, 1 rim, 2 reveal, 3 smudge, 4 crisp. Kept half a cell
// inside the frame's block, so frames never bleed into each other.
float layer(float k, vec2 s) {
  vec2 c = clamp(s / ${f(CELL)}, vec2(0.5), vec2(${f(N - 0.5)}));
  vec2 px = (uCell * ${f(N)} + c) / vec2(${f(COLS * N)}, ${f(ROWS * N)});
  return texture2D(uLayers, vec2(px.x, (px.y + k) / ${f(LAYERS)})).r;
}

// A layer read blurred over a disc of r scene pixels.
float layerBlur(float k, vec2 s, float r) {
  float sum = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float a = fi * 2.39996;
    sum += layer(k, s + vec2(cos(a), sin(a)) * r * sqrt((fi + 0.5) / 12.0));
  }
  return sum / 12.0;
}

float inkAt(vec2 s) {
  if (uInkCell.x < 0.0) return 0.0;
  vec2 c = clamp(s / ${f(INK_CELL)}, vec2(0.5), vec2(${f(INK_N - 0.5)}));
  return texture2D(uInk, (uInkCell * ${f(INK_N)} + c) / vec2(${f(INK_COLS * INK_N)}, ${f(INK_ROWS * INK_N)})).r;
}

// The type's coverage, blurred over an ellipse of r scene pixels (across, down), on a disc turned at every pixel. Each
// line is read from where its slide puts it.
float typeAt(vec2 s, vec2 r) {
  s.x -= s.y < uSplit ? uSlide.x : uSlide.y;
  if (r.x < 0.3 && r.y < 0.3) return texture2D(uType, s / ${f(SCENE)}).a;
  float sum = 0.0;
  float spin = hash(floor(s * uScale)) * 6.2832;
  for (int i = 0; i < ${TAPS}; i++) {
    float fi = float(i);
    float a = fi * 2.39996 + spin;
    vec2 o = vec2(cos(a), sin(a)) * r * sqrt((fi + 0.5) / ${f(TAPS)});
    sum += texture2D(uType, (s + o) / ${f(SCENE)}).a;
  }
  return sum / ${f(TAPS)};
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 s = (px - uOrigin) / uScale;
  if (uReady < 0.5) { gl_FragColor = vec4(uGround, 1.0); return; }

  // Over the lines the traced layers carry the source's letters' silhouettes, so there they only say where and
  // when: the occluder's shape is our own type blurred into one long soft mass, filled with ground and glowing at its
  // edge wherever the traced rim says it lies. Elsewhere every layer is read as traced; the two hand over across
  // FEATHER pixels at the edge of the lines' box.
  vec2 edge = min(s - uLines.xy, uLines.zw - s);
  float lines = clamp(min(edge.x, edge.y) / ${f(FEATHER)}, 0.0, 1.0);
  float ribbon = mix(layer(0.0, s), layerBlur(0.0, s, ${f(LINE_BLUR)}), lines);
  float reveal = smoothstep(${f(REVEAL_CURVE[0])}, ${f(REVEAL_CURVE[1])}, mix(layer(2.0, s), layerBlur(2.0, s, ${f(REVEAL_BLUR)}), lines));
  float crisp = min(reveal, smoothstep(${f(REVEAL_CURVE[0])}, ${f(REVEAL_CURVE[1])}, mix(layer(4.0, s), layerBlur(4.0, s, ${f(REVEAL_BLUR)}), lines)));
  vec3 col = mix(uGround, uRibbon, ribbon);
  float rim = layer(1.0, s);
  if (lines > 0.0) {
    float here = clamp(layerBlur(1.0, s, ${f(PRESENCE)}) * ${f(PRESENCE_GAIN)}, 0.0, 1.0) * lines;
    float cloud = typeAt(s, vec2(${f(CLOUD[0])}, ${f(CLOUD[1])}));
    col = mix(col, uGround, here * (1.0 - reveal) * smoothstep(${f(RIM_OUT[0])}, ${f(RIM_OUT[1])}, cloud));
    // The occluder only lies where the type is hidden, so its rim does too.
    float ours = smoothstep(${f(RIM_IN[0])}, ${f(RIM_IN[1])}, cloud) * (1.0 - smoothstep(${f(RIM_OUT[0])}, ${f(RIM_OUT[1])}, cloud));
    rim = mix(rim, ours * smoothstep(0.1, 0.5, 1.0 - reveal), here);
  }
  // The type: sharp as far as crisp says, and blurred for the darkness the reveal has beyond that.
  float type = typeAt(s, vec2(${f(SOFT)})) * crisp + typeAt(s, vec2(${f(BLUR[0])}, ${f(BLUR[1])})) * (reveal - crisp);
  col = mix(col, uTypeInk, type);
  // Ghosts and streaks outside the lines, then the rim, then the ink.
  col = mix(col, uTypeInk, layer(3.0, s));
  col = mix(col, uRim, rim);
  col = mix(col, uInkCol, inkAt(s));
  gl_FragColor = vec4(col, 1.0);
}`;

const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];

export class SmearType {
  readonly ok: boolean = false;

  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private textures: (WebGLTexture | null)[] = [];
  private u: Record<string, WebGLUniformLocation | null> = {};
  private unwatch: () => void = () => {};
  private raf = 0;
  private running = false;
  private t0 = 0;
  private elapsed = 0;
  private scale = 1;
  private origin: [number, number] = [0, 0];
  private loaded = 0;
  private box: [number, number, number, number] = [0, 0, 0, 0];
  private disposed = false;
  private readonly lines: readonly [string, string];
  private readonly colours: Required<SmearColours>;
  private readonly weight: number;
  private readonly family: string;
  private readonly speed: number;

  constructor(private canvas: HTMLCanvasElement, opts: SmearTypeOptions) {
    this.family = opts.family;
    this.lines = opts.lines ?? DEFAULT_LINES;
    this.colours = {ground: DEFAULT_GROUND, ribbon: DEFAULT_RIBBON, rim: DEFAULT_RIM, type: DEFAULT_TYPE, ink: DEFAULT_INK, ...opts.colours};
    this.weight = opts.weight ?? FONT_WEIGHT;
    this.speed = opts.speed && opts.speed > 0 ? opts.speed : 1;
    const gl = canvas.getContext('webgl', {alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power'}) as WebGLRenderingContext | null;
    if (!gl) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(canvas, () => this.stop());
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      console.warn('[smear-type]', gl.getShaderInfoLog(sh));
      return null;
    };
    const v = compile(gl.VERTEX_SHADER, VERT);
    const fr = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !fr) return;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, fr);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(fr);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return;
    this.prog = p;
    gl.useProgram(p);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(p, 'aPos');
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uScale', 'uOrigin', 'uLayers', 'uInk', 'uType', 'uCell', 'uInkCell', 'uReady', 'uLines', 'uSlide', 'uSplit', 'uGround', 'uRibbon', 'uRim', 'uTypeInk', 'uInkCol']) this.u[n] = gl.getUniformLocation(p, n);
    this.textures = [gl.createTexture(), gl.createTexture(), gl.createTexture()];
    gl.uniform1i(this.u.uLayers, 0);
    gl.uniform1i(this.u.uInk, 1);
    gl.uniform1i(this.u.uType, 2);
    const c = this.colours;
    gl.uniform3fv(this.u.uGround, rgb(c.ground));
    gl.uniform3fv(this.u.uRibbon, rgb(c.ribbon));
    gl.uniform3fv(this.u.uRim, rgb(c.rim));
    gl.uniform3fv(this.u.uTypeInk, rgb(c.type));
    gl.uniform3fv(this.u.uInkCol, rgb(c.ink));
    (this as {ok: boolean}).ok = true;
    [opts.layersUrl ?? LAYERS_URL, opts.inkUrl ?? INK_URL].forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (this.disposed || !this.gl) return;
        this.upload(i, img, gl.LUMINANCE);
        this.loaded++;
        if (!this.running) this.renderStill();
      };
      img.src = url;
    });
    this.resize();
  }

  private upload(unit: number, src: TexImageSource, format: number) {
    const gl = this.gl;
    if (!gl) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[unit]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  resize() {
    const gl = this.gl;
    if (!gl) return;
    const box = this.canvas.getBoundingClientRect();
    const dpr = capDpr();
    const w = Math.max(1, Math.round(box.width * dpr));
    const h = Math.max(1, Math.round(box.height * dpr));
    this.canvas.width = w;
    this.canvas.height = h;
    gl.viewport(0, 0, w, h);
    this.scale = Math.max(w, h) / SCENE;
    this.origin = [(w - SCENE * this.scale) / 2, (h - SCENE * this.scale) / 2];
    this.rasterise(Math.min(2048, Math.round(SCENE * this.scale)));
    if (!this.running) this.renderStill();
  }

  private rasterise(size: number) {
    const src = document.createElement('canvas');
    src.width = src.height = size;
    const ctx = src.getContext('2d');
    if (!ctx) return;
    ctx.font = `${this.weight} 100px ${this.family}`;
    const ascent = ctx.measureText('H').actualBoundingBoxAscent || 72;
    ctx.scale(size / SCENE, size / SCENE);
    const box: [number, number, number, number] = [SCENE, SCENE, 0, 0];
    this.lines.forEach((text, i) => {
      const chars = [...text];
      const inkAt = (px: number) => {
        ctx.font = `${this.weight} ${px}px ${this.family}`;
        const m = ctx.measureText(text);
        const cap = (px * ascent) / 100;
        return (m.actualBoundingBoxLeft + m.actualBoundingBoxRight + (chars.length - 1) * TRACK * cap) * WIDEN + EMBOLDEN * cap;
      };
      let px = (100 * CAP) / ascent / (1 + EMBOLDEN);
      const wide = inkAt(px);
      if (wide > WIDE) px *= WIDE / wide;
      ctx.font = `${this.weight} ${px}px ${this.family}`;
      ctx.fontKerning = 'normal';
      const line = ctx.measureText(text);
      const cap = (px * ascent) / 100;
      const stroke = EMBOLDEN * cap;
      const track = TRACK * cap;
      const inkW = line.actualBoundingBoxLeft + line.actualBoundingBoxRight + (chars.length - 1) * track;
      const left = SCENE / 2 - inkW / 2;
      const baseline = LINE_TOP[i] + cap + stroke / 2;
      const half = (inkW * WIDEN) / 2 + stroke;
      box[0] = Math.min(box[0], SCENE / 2 - half);
      box[2] = Math.max(box[2], SCENE / 2 + half);
      box[1] = Math.min(box[1], LINE_TOP[i] - stroke);
      box[3] = Math.max(box[3], LINE_TOP[i] + cap + stroke);
      ctx.save();
      ctx.translate(SCENE / 2, 0);
      ctx.scale(WIDEN, 1);
      ctx.translate(-SCENE / 2, 0);
      ctx.fillStyle = ctx.strokeStyle = '#fff';
      ctx.lineWidth = stroke;
      ctx.lineJoin = 'round';
      chars.forEach((ch, j) => {
        const pen = ctx.measureText(chars.slice(0, j + 1).join('')).width - ctx.measureText(ch).width + line.actualBoundingBoxLeft + j * track;
        ctx.fillText(ch, left + pen, baseline);
        if (stroke > 0) ctx.strokeText(ch, left + pen, baseline);
      });
      ctx.restore();
    });
    this.box = [box[0] - LINE_MARGIN, box[1] - LINE_MARGIN, box[2] + LINE_MARGIN, box[3] + LINE_MARGIN];
    this.upload(2, src, this.gl!.RGBA);
  }

  paint(at: number) {
    const gl = this.gl;
    if (!gl || !this.prog) return;
    const frame = ((Math.floor(at) % LOOP_KEYS) + LOOP_KEYS) % LOOP_KEYS;
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uScale, this.scale);
    gl.uniform2f(this.u.uOrigin, this.origin[0], this.origin[1]);
    gl.uniform1f(this.u.uReady, this.loaded >= 2 ? 1 : 0);
    gl.uniform4f(this.u.uLines, ...this.box);
    gl.uniform2f(this.u.uSlide, SLIDE[0][frame] ?? 0, SLIDE[1][frame] ?? 0);
    gl.uniform1f(this.u.uSplit, (LINE_TOP[0] + CAP + LINE_TOP[1]) / 2);
    gl.uniform2f(this.u.uCell, frame % COLS, Math.floor(frame / COLS));
    const slot = (INK_FRAMES as readonly number[]).indexOf(frame);
    gl.uniform2f(this.u.uInkCell, slot < 0 ? -1 : slot % INK_COLS, slot < 0 ? -1 : Math.floor(slot / INK_COLS));
    this.textures.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  render(ms: number) {
    this.paint(ms / KEY_MS);
  }

  renderStill() {
    this.paint(STILL_KEY);
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now() - this.elapsed / this.speed;
    const tick = (now: number) => {
      if (!this.running) return;
      this.elapsed = (now - this.t0) * this.speed;
      this.render(this.elapsed);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.unwatch();
    disposeGl(this.gl, {programs: [this.prog], buffers: [this.quad], textures: this.textures});
    this.gl = null;
    this.prog = null;
    this.quad = null;
    this.textures = [];
  }
}
