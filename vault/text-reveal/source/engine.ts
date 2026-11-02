import { capDpr, watchContextLoss } from "./runtime/dispose";
import { RevealGL, renderCornerText } from "./reveal-gl";
import {
  BR_ANCHOR, DAMP, EDGE, FONT_CSS, GONE_AT, HOLD_MS, INK, K_IN, K_OUT, MAX_BLUR, OUT_HOLD_MS, PARALLAX_AMP,
  REVEALED_AT, TEXT_PAIRS, TL_ANCHOR, WASH_SECONDS,
} from "./params";

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function resolveFamily(cssFamily: string): string {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden";
  probe.style.fontFamily = cssFamily;
  probe.textContent = "Ag";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily || "serif";
  probe.remove();
  return fam;
}

function springStep(pos: number, vel: number, target: number, k: number, damp: number, dt: number): [number, number] {
  const c = 2 * Math.sqrt(k) * damp;
  const accel = -k * (pos - target) - c * vel;
  const v = vel + accel * dt;
  return [pos + v * dt, v];
}

export class TextReveal {
  private gl = new RevealGL();
  private edge = hexToRgb(EDGE);
  private W = 1;
  private H = 1;
  private dpr = 1;
  private fontFamily = resolveFamily(FONT_CSS);
  private index = 0;
  private seed = 1.7;

  private pTgtX = 0.5;
  private pTgtY = 0.5;
  private pCurX = 0.5;
  private pCurY = 0.5;
  private cursorUV: [number, number] = [-1, -1];
  private hoverTgt = 0;
  private hoverCur = 0;

  private phase: "in" | "hold" | "out" = "in";
  private phaseStart = 0;
  private progress = 0;
  private vel = 0;
  private target = 1;
  private clock = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private held = 0;
  private lost = false;
  private unwatch: () => void = () => {};

  readonly ok: boolean;

  constructor(private host: HTMLElement, private wash: HTMLElement | null) {
    this.ok = this.gl.available;
    if (!this.ok) return;
    this.unwatch = watchContextLoss(this.gl.canvas, () => {
      this.stop();
      this.lost = true;
    });
    host.appendChild(this.gl.canvas);
    this.resize();
    host.addEventListener("pointermove", this.onMove);
    host.addEventListener("pointerleave", this.onLeave);
  }

  private onMove = (e: PointerEvent) => {
    const b = this.host.getBoundingClientRect();
    const ux = (e.clientX - b.left) / b.width;
    const uy = (e.clientY - b.top) / b.height;
    this.pTgtX = ux;
    this.pTgtY = uy;
    this.cursorUV = [ux, uy];
    this.hoverTgt = 1;
  };
  private onLeave = () => {
    this.pTgtX = 0.5;
    this.pTgtY = 0.5;
    this.hoverTgt = 0;
  };

  private mount() {
    if (!this.ok) return;
    const pair = TEXT_PAIRS[this.index];
    this.gl.setTexture(renderCornerText({ top: pair.top, bottom: pair.bottom, font: this.fontFamily, fill: INK, cardW: this.W, cardH: this.H, dpr: this.dpr }));
  }

  resize() {
    if (!this.ok) return;
    const W = this.host.clientWidth;
    const H = this.host.clientHeight;
    if (W < 2 || H < 2) return;
    this.W = W;
    this.H = H;
    this.dpr = capDpr();
    this.gl.resize(W, H, this.dpr);
    this.mount();
    if (!this.running) this.renderStill();
  }

  refreshFont() {
    this.fontFamily = resolveFamily(FONT_CSS);
    this.mount();
    if (!this.running) this.renderStill();
  }

  private setWash(u: number) {
    if (!this.wash) return;
    const e = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
    const tx = -0.8 + 1.6 * e;
    const ty = -0.6 + 1.2 * e;
    const s = 1.08 + 0.02 * e;
    const r = 0.35 * e;
    this.wash.style.transform = `translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.clock += dt;

    const k = this.target > 0.5 ? K_IN : K_OUT;
    [this.progress, this.vel] = springStep(this.progress, this.vel, this.target, k, DAMP, dt);

    if (this.phase === "in") {
      if (this.progress >= REVEALED_AT) { this.phase = "hold"; this.phaseStart = now; }
    } else if (this.phase === "hold") {
      if (now - this.phaseStart >= HOLD_MS) { this.phase = "out"; this.phaseStart = now; this.target = 0; }
    } else if (this.progress <= GONE_AT && now - this.phaseStart >= OUT_HOLD_MS) {
      this.index = (this.index + 1) % TEXT_PAIRS.length;
      this.seed = ((this.seed * 1.618) % 7) + 0.3;
      this.mount();
      this.phase = "in"; this.phaseStart = now; this.progress = 0; this.vel = 0; this.target = 1;
    }

    const pk = 1 - Math.pow(0.0009, dt);
    this.pCurX += (this.pTgtX - this.pCurX) * pk;
    this.pCurY += (this.pTgtY - this.pCurY) * pk;
    this.hoverCur += (this.hoverTgt - this.hoverCur) * (1 - Math.pow(0.002, dt));
    const amp = PARALLAX_AMP * this.hoverCur;
    const parTL: [number, number] = [(this.pCurX - TL_ANCHOR[0]) * amp, (this.pCurY - TL_ANCHOR[1]) * amp];
    const parBR: [number, number] = [(this.pCurX - BR_ANCHOR[0]) * amp, (this.pCurY - BR_ANCHOR[1]) * amp];

    const p = Math.max(0, Math.min(1, this.progress));
    const reverse = this.phase === "out" ? 1 : 0;
    this.gl.draw(p, MAX_BLUR, this.edge, this.clock, this.W / Math.max(1, this.H), this.seed, parTL, parBR, this.cursorUV, this.hoverCur, reverse);

    this.held += ((this.phase === "hold" ? 1 : 0) - this.held) * (1 - Math.pow(0.02, dt));
    const breathe = Math.sin(this.clock * 0.45) * 0.5 + 0.5;
    const s = 1 + this.held * breathe * 0.0015;
    const b = 1 + this.held * (breathe - 0.5) * 0.012;
    this.gl.canvas.style.transform = `scale(${s.toFixed(4)})`;
    this.gl.canvas.style.filter = `brightness(${b.toFixed(3)})`;
    this.setWash((this.clock % WASH_SECONDS) / WASH_SECONDS);

    this.raf = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.running || !this.ok || this.lost) return;
    this.running = true;
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

  renderStill() {
    if (!this.ok || this.lost) return;
    this.setWash(0);
    this.gl.draw(1, 0, this.edge, 0, this.W / Math.max(1, this.H), this.seed, [0, 0], [0, 0], [-1, -1], 0, 0);
  }

  destroy() {
    this.stop();
    this.unwatch();
    this.host.removeEventListener("pointermove", this.onMove);
    this.host.removeEventListener("pointerleave", this.onLeave);
    this.gl.destroy();
  }
}
