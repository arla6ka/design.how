// AI lights (https://design.how/vault/ai-lights), engine.ts.
// FIXED. Change the VARIABLE values in params instead (VARIANTS, PULSE_MS, MORPH_MS, FADE_OUT_MS, SETTLED_MS, RIM_LAYERS, RIM_STOPS, ARC_MIN, ARC_MAX).
import {ARC_MAX, ARC_MIN, FADE_OUT_MS, GAP_MS, HANDOVER_AT, MORPH_MS, PULSE_MS, STILL_ANCHOR, STILL_ARC} from './params';

export type Beats = {
  fadeOut: () => void;
  morph: () => void;
  arrive: () => void;
};

function hsl(h: number, s: number, l: number, a = 1): string {
  const hue = ((h % 360) + 360) % 360;
  return a === 1 ? `hsl(${hue.toFixed(1)} ${s}% ${l}%)` : `hsl(${hue.toFixed(1)} ${s}% ${l}% / ${a})`;
}

export function writePalette(el: HTMLElement, anchor: number, arc: number) {
  const at = (t: number) => anchor + arc * t;
  const s = el.style;
  s.setProperty('--ai-c1', hsl(at(0), 96, 48));
  s.setProperty('--ai-c2', hsl(at(0.18), 52, 80));
  s.setProperty('--ai-c3', hsl(at(0.4), 98, 55));
  s.setProperty('--ai-c4', hsl(at(0.66), 96, 52));
  s.setProperty('--ai-c5', hsl(at(0.88), 94, 50));
  s.setProperty('--ai-c6', hsl(at(1), 90, 72, 0.8));
  s.setProperty('--ai-tail', hsl(at(-0.12), 70, 76, 0.63));
  s.setProperty('--ai-bg1', hsl(at(0), 62, 97));
  s.setProperty('--ai-bg2', hsl(at(0.5), 54, 95));
  s.setProperty('--ai-bg3', hsl(at(1), 58, 93));
}

export class AiLights {
  readonly ok = true;
  private running = false;
  private timers: number[] = [];

  constructor(private card: HTMLElement, private body: HTMLElement, private beats: Beats) {}

  private after(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private pulse = () => {
    if (!this.running) return;
    this.timers = [];
    writePalette(this.card, Math.random() * 360, (ARC_MIN + Math.random() * (ARC_MAX - ARC_MIN)) * (Math.random() < 0.5 ? -1 : 1));
    this.body.dataset.playing = 'false';
    void this.body.offsetWidth;
    this.body.dataset.playing = 'true';
    this.after(HANDOVER_AT, () => {
      this.beats.fadeOut();
      this.after(FADE_OUT_MS, () => {
        this.body.removeAttribute('data-playing');
        this.beats.morph();
        this.after(MORPH_MS, () => this.beats.arrive());
      });
    });
    this.after(PULSE_MS + GAP_MS, this.pulse);
  };

  start() {
    if (this.running) return;
    this.running = true;
    delete this.body.dataset.still;
    this.pulse();
  }

  stop() {
    this.running = false;
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    this.body.dataset.playing = 'false';
  }

  resize() {}

  renderStill() {
    writePalette(this.card, STILL_ANCHOR, STILL_ARC);
    this.body.dataset.still = 'true';
  }

  destroy() {
    this.stop();
    delete this.body.dataset.still;
  }
}
