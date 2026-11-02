// Voice wave (https://design.how/vault/voice-wave), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PALETTE, PHRASES, ZOOM).
import { capDpr, disposeGl, watchContextLoss } from "./runtime/dispose";
import { VERT, FRAG } from "./shaders";
import { SignalSource } from "./audio";

function cssColor(el: HTMLElement, name: string, fallback: [number, number, number]) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as [number, number, number];
  }
  const rgb = raw.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.every((v) => !Number.isNaN(v))) {
      return [parts[0] / 255, parts[1] / 255, parts[2] / 255] as [number, number, number];
    }
  }
  return fallback;
}

export class VoiceWave {
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};

  readonly signal = new SignalSource();

  private raf = 0;
  private last = 0;
  private running = false;
  private dpr = 1;
  private ro: ResizeObserver | null = null;
  private disposed = false;
  private unwatch: () => void = () => {};
  private themeWatch: MutationObserver | null = null;

  private presence = 0;
  private presenceTarget = 1;

  private wake = 0;

  private wakeLag = 0;

  constructor(host: HTMLElement) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(this.canvas);

    const gl = this.canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    this.gl = gl;
    this.unwatch = watchContextLoss(this.canvas, () => {
      this.stop();
      this.disposed = true;
    });

    const prog = this.build(gl);
    if (!prog) return;
    this.prog = prog;
    gl.useProgram(prog);

    for (const n of ["uRes", "uTime", "uLow", "uMid", "uHigh", "uLevel", "uPresence", "uWake", "uWakeLag", "uPaper", "uDark"]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    this.pushPalette();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.themeWatch = new MutationObserver(() => {
      this.refreshPalette();
      if (!this.running) this.draw(0);
    });
    this.themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  get ok() {
    return !!this.gl && !!this.prog;
  }

  private build(gl: WebGL2RenderingContext): WebGLProgram | null {
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[voice-wave]", gl.getShaderInfoLog(s));
        }
        gl.deleteShader(s);
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[voice-wave]", gl.getProgramInfoLog(p));
      }
      gl.deleteProgram(p);
      return null;
    }
    return p;
  }

  private pushPalette() {
    const gl = this.gl;
    if (!gl) return;
    const dark = document.documentElement.dataset.theme === "dark";
    const paper = cssColor(this.host, "--color-background", dark ? [0.055, 0.055, 0.05] : [1, 1, 1]);
    gl.uniform3fv(this.u.uPaper!, paper);
    gl.uniform1f(this.u.uDark!, dark ? 1 : 0);
  }

  refreshPalette() {
    if (!this.gl || !this.prog) return;
    this.gl.useProgram(this.prog);
    this.pushPalette();
  }

  private resize() {
    const gl = this.gl;
    if (!gl || this.disposed) return;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.dpr = capDpr();
    const bw = Math.round(w * this.dpr);
    const bh = Math.round(h * this.dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    gl.viewport(0, 0, bw, bh);
    if (!this.running) this.draw(0);
  }

  async enableMic() {
    return this.signal.enableMic();
  }
  disableMic() {
    this.signal.disableMic();
  }
  get micLive() {
    return this.signal.live;
  }

  private draw(dt: number) {
    const gl = this.gl;
    if (!gl || !this.prog || this.disposed) return;

    const b = this.signal.read(dt);
    this.presence += (this.presenceTarget - this.presence) * Math.min(1, dt * 3);

    const target = this.signal.live
      ? Math.min(1, b.level * 1.35)
      : 0.12 + 0.88 * this.signal.envelope;
    const rate = target > this.wake ? 4.5 : 1.4;
    this.wake += (target - this.wake) * Math.min(1, dt * rate);

    this.wakeLag += (this.wake - this.wakeLag) * Math.min(1, dt * 8);

    gl.useProgram(this.prog);
    gl.uniform2f(this.u.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime!, performance.now() / 1000);
    gl.uniform1f(this.u.uLow!, b.low);
    gl.uniform1f(this.u.uMid!, b.mid);
    gl.uniform1f(this.u.uHigh!, b.high);
    gl.uniform1f(this.u.uLevel!, b.level);
    gl.uniform1f(this.u.uPresence!, this.presence);
    gl.uniform1f(this.u.uWake!, this.wake);
    gl.uniform1f(this.u.uWakeLag!, this.wakeLag);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  renderStill() {
    this.presence = 1;
    this.wake = 0.82;
    this.wakeLag = 0.82;
    for (let i = 0; i < 60; i++) this.signal.read(1 / 60);
    this.draw(0);
  }

  start() {
    if (this.running || !this.ok || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      this.draw(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.ro?.disconnect();
    this.ro = null;
    this.themeWatch?.disconnect();
    this.themeWatch = null;
    this.unwatch();
    this.signal.destroy();
    disposeGl(this.gl, { programs: [this.prog] });
    this.prog = null;
    this.gl = null;
    this.canvas.remove();
  }
}
