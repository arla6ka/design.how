import { SandboxRenderer } from "./SandboxRenderer";
import { PRESETS, type SandboxPreset } from "./presets";
import { mediaUrl } from "./runtime/media";
import { watchContextLoss } from "./runtime/dispose";

export const CYCLE_MS = 2000;
export const CELL = 8;

export function newCanvas(host: HTMLElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, { display: "block", width: "100%", height: "100%" });
  host.appendChild(canvas);
  return canvas;
}

const lookOf = (p: SandboxPreset) => ({ colors: p.colors, glyphs: p.glyphs, zoom: p.zoom ?? 1 });

export class SandboxCycle {
  readonly ok: boolean;
  private renderer: SandboxRenderer | null;
  private timer = 0;
  private index = 0;
  private preloaded = false;
  private unwatch: () => void;
  private ro: ResizeObserver;

  constructor(host: HTMLElement) {
    const canvas = newCanvas(host);
    const first = PRESETS[0];
    this.renderer = new SandboxRenderer(canvas, {
      cell: CELL,
      bandColors: first.colors,
      bandStops: [0, 0.25, 0.5, 0.75, 1],
      bandGlyphs: first.glyphs,
      zoom: first.zoom ?? 1,
    });
    this.ok = true;
    this.unwatch = watchContextLoss(canvas, () => this.stop());
    this.ro = new ResizeObserver(() => this.renderer?.resize());
    this.ro.observe(canvas);
  }

  start() {
    const r = this.renderer;
    if (!r || this.timer) return;
    if (!this.preloaded) {
      this.preloaded = true;
      r.preload(PRESETS.map((p) => mediaUrl(p.video)));
      r.setVideo(mediaUrl(PRESETS[this.index].video), lookOf(PRESETS[this.index]));
    } else {
      r.resume();
    }
    this.timer = window.setInterval(() => {
      this.index = (this.index + 1) % PRESETS.length;
      const p = PRESETS[this.index];
      this.renderer?.setVideo(mediaUrl(p.video), lookOf(p));
    }, CYCLE_MS);
  }

  stop() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.renderer?.pause();
  }

  resize() {
    this.renderer?.resize();
  }

  renderStill() {
    const r = this.renderer;
    if (!r) return;
    r.showFrame(mediaUrl(PRESETS[0].video), lookOf(PRESETS[0]));
  }

  destroy() {
    this.stop();
    this.unwatch();
    this.ro.disconnect();
    const canvas = this.renderer?.element;
    this.renderer?.dispose();
    this.renderer = null;
    canvas?.remove();
  }
}
