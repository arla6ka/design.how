// Blur reveal (https://design.how/vault/blur-reveal), engine.ts.
// FIXED. Change the VARIABLE values in params instead (PANELS, HOLD_MS, BG_MS, MAX_BLUR, K_IN, K_OUT).
import { PANELS } from "./panels";
import { RevealGL } from "./gl";
import { renderText } from "./text-texture";
import { capDpr, watchContextLoss } from "./runtime/dispose";

export const FONT_VAR = "--visual-wide";
const FONT_STACK = `var(${FONT_VAR}), system-ui, sans-serif`;

export const HOLD_MS = 900;
const OUT_HOLD_MS = 40;
export const BG_MS = 320;
export const MAX_BLUR = 18;

export const K_IN = 42;
export const K_OUT = 60;
const DAMP = 1.0;
const REVEALED_AT = 0.992;
const GONE_AT = 0.02;

function resolveFamily(cssFamily: string): string {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden";
  probe.style.fontFamily = cssFamily;
  probe.textContent = "Ag";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily || "serif";
  document.body.removeChild(probe);
  return fam;
}

function springStep(
  pos: number,
  vel: number,
  target: number,
  k: number,
  damp: number,
  dt: number,
): [number, number] {
  const c = 2 * Math.sqrt(k) * damp;
  const accel = -k * (pos - target) - c * vel;
  const v = vel + accel * dt;
  const x = pos + v * dt;
  return [x, v];
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class BlurReveal {
  private host: HTMLElement;
  private stage: HTMLDivElement;
  private gl: RevealGL | null = null;
  private useGL = false;
  private fallback: HTMLDivElement | null = null;
  private fontFamily = "serif";

  private index = 0;
  private W = 1;
  private H = 1;
  private dpr = 1;

  private raf = 0;
  private running = false;
  private disposed = false;
  private now = 0;
  private last = 0;
  private clock = 0;

  private phase: "in" | "hold" | "out" = "in";
  private phaseStart = 0;
  private progress = 0;
  private vel = 0;
  private target = 1;
  private edge: [number, number, number] = [1, 1, 1];
  private seed = Math.random() * 100;

  private ro?: ResizeObserver;
  private unwatch: (() => void) | null = null;
  readonly ok: boolean = true;

  constructor(host: HTMLElement) {
    this.host = host;
    this.dpr = capDpr();
    this.measure();

    const stage = document.createElement("div");
    Object.assign(stage.style, {
      position: "absolute",
      inset: "0",
      background: PANELS[0].bg,
      transition: `background-color ${BG_MS}ms ease`,
      overflow: "hidden",
      fontFamily: FONT_STACK,
    });
    host.appendChild(stage);
    this.stage = stage;
    this.fontFamily = resolveFamily(FONT_STACK);

    const gl = new RevealGL();
    if (gl.available) {
      this.gl = gl;
      this.useGL = true;
      gl.resize(this.W, this.H, this.dpr);
      stage.appendChild(gl.canvas);
      this.unwatch = watchContextLoss(gl.canvas, () => {
        this.stop();
        this.useGL = false;
      });
    }

    this.ro = new ResizeObserver(() => this.onResize());
    this.ro.observe(host);
  }

  private measure() {
    this.W = this.host.clientWidth || 1;
    this.H = this.host.clientHeight || 1;
  }

  resize() {
    this.onResize();
  }

  private onResize() {
    this.measure();
    if (this.W < 2 || this.H < 2) return;
    this.gl?.resize(this.W, this.H, this.dpr);
    this.mountPanel(this.index);
  }

  refreshFont() {
    this.fontFamily = resolveFamily(FONT_STACK);
    this.mountPanel(this.index);
  }

  private mountPanel(i: number) {
    const p = PANELS[i];
    this.stage.style.background = p.bg;
    this.edge = hexToRgb(p.fg);
    if (this.useGL && this.gl) {
      const t = renderText({
        line: p.line,
        font: this.fontFamily,
        fill: p.fg,
        cardW: this.W,
        cardH: this.H,
        dpr: this.dpr,
      });
      this.gl.setTexture(t.canvas);
    } else {
      this.mountFallback(p.line, p.fg);
    }
  }

  private mountFallback(line: string, fg: string) {
    if (!this.fallback) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8% 10%",
        fontStyle: "italic",
        fontWeight: "500",
        fontSize: "clamp(1.9rem, 7vw, 4rem)",
        textAlign: "center",
        transition: "opacity 300ms ease, filter 300ms ease",
      });
      this.stage.appendChild(el);
      this.fallback = el;
    }
    this.fallback.textContent = line;
    this.fallback.style.color = fg;
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.mountPanel(this.index);
    this.phase = "in";
    this.phaseStart = performance.now();
    this.last = this.phaseStart;
    this.progress = 0;
    this.vel = 0;
    this.target = 1;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop = () => {
    if (!this.running) return;
    this.now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (this.now - this.last) / 1000));
    this.last = this.now;
    this.clock += dt;

    const k = this.target > 0.5 ? K_IN : K_OUT;
    [this.progress, this.vel] = springStep(this.progress, this.vel, this.target, k, DAMP, dt);

    if (this.phase === "in") {
      if (this.progress >= REVEALED_AT) {
        this.phase = "hold";
        this.phaseStart = this.now;
      }
    } else if (this.phase === "hold") {
      if (this.now - this.phaseStart >= HOLD_MS) {
        this.phase = "out";
        this.phaseStart = this.now;
        this.target = 0;
      }
    } else {
      if (this.progress <= GONE_AT && this.now - this.phaseStart >= OUT_HOLD_MS) {
        this.index = (this.index + 1) % PANELS.length;
        this.seed = Math.random() * 100;
        this.mountPanel(this.index);
        this.phase = "in";
        this.phaseStart = this.now;
        this.progress = 0;
        this.vel = 0;
        this.target = 1;
      }
    }

    const clampP = Math.max(0, Math.min(1, this.progress));
    if (this.useGL && this.gl) {
      this.gl.draw(clampP, MAX_BLUR, this.edge, this.clock, this.W / Math.max(1, this.H), this.seed);
    } else if (this.fallback) {
      this.fallback.style.opacity = String(clampP);
      this.fallback.style.filter = `blur(${(1 - clampP) * 10}px)`;
    }

    this.raf = requestAnimationFrame(this.loop);
  };

  renderStill() {
    this.measure();
    this.gl?.resize(this.W, this.H, this.dpr);
    this.mountPanel(this.index);
    this.progress = 1;
    if (this.useGL && this.gl) this.gl.draw(1, 0, this.edge, 0, this.W / Math.max(1, this.H), this.seed);
    else if (this.fallback) { this.fallback.style.opacity = "1"; this.fallback.style.filter = "none"; }
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.ro?.disconnect();
    this.unwatch?.();
    this.unwatch = null;
    this.gl?.destroy();
    this.gl = null;
    this.stage.parentNode?.removeChild(this.stage);
  }
}
