import { IDLE, type GlitchOptions } from "./params";

const LOOKALIKE: Record<string, string> = {
  a: "eo", b: "hd", c: "eo", d: "bh", e: "ca", f: "tr", g: "qy",
  h: "bn", i: "lj", j: "il", k: "hx", l: "il", m: "nw", n: "mh",
  o: "ce", p: "qb", q: "pg", r: "nf", s: "z5", t: "fl", u: "vn",
  v: "uy", w: "vm", x: "kz", y: "vg", z: "sx",
};

const SCRAMBLE_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function swap(ch: string): string {
  const near = LOOKALIKE[ch.toLowerCase()];
  if (near) return near[Math.floor(Math.random() * near.length)];
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

const REST_SHADOW = [
  "inset 0 1px 0 -0.5px rgba(255,255,255,0.4)",
  "inset 0 -1px 0 -0.5px rgba(0,32,15,0.3)",
  "inset 0 0 0 1px rgba(0,40,18,0.09)",
  "0 1px 2px rgba(6,46,24,0.22)",
  "0 4px 10px -4px rgba(6,46,24,0.28)",
].join(", ");

const DROP_EVERY = 8;
const DROP_JITTER = 5;

const SHADOW_LAG = 7;

const OVERSHOOT_SPAN = 0.14;
const OVERSHOOT_PEAK = 0.22;

function envelope(o: GlitchOptions, t: number): number {
  if (t < o.spanStart) return 0;
  const span = o.spanEnd - o.spanStart;

  if (t > o.spanEnd) {
    const tail = (t - o.spanEnd) / (span * OVERSHOOT_SPAN);
    return tail < 1 ? -OVERSHOOT_PEAK * (1 - tail) : 0;
  }

  const peak = o.spanStart + span * o.peakAt;
  return t < peak
    ? (t - o.spanStart) / (peak - o.spanStart)
    : (o.spanEnd - t) / (o.spanEnd - peak);
}

function jolt(o: GlitchOptions, t: number): number {
  return (Math.random() - 0.5) * 2 * envelope(o, t);
}

function band(o: GlitchOptions): { path: string; heightRatio: number } {
  const range = o.maxHeight - o.minHeight;
  const heightRatio = Math.random();
  const h = o.minHeight + heightRatio * range;
  const y = Math.random() * (1 - h);
  const top = (y * 100).toFixed(2);
  const bot = ((y + h) * 100).toFixed(2);
  return {
    path: `polygon(0% ${top}%, 100% ${top}%, 100% ${bot}%, 0% ${bot}%)`,
    heightRatio,
  };
}

function sliceFrames(
  o: GlitchOptions,
  index: number,
  rogue: number,
): Keyframe[] {
  const steps = Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1);
  const threshold = ((index + 1) / (o.sliceCount + 1)) * 0.9;
  const push = index === rogue ? o.maxOffset * o.rogueMultiplier : o.maxOffset;

  const out: Keyframe[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const e = envelope(o, t);
    if (Math.abs(e) < threshold) {
      const flicker = index === 0 && Math.random() < 0.035;
      if (!flicker) {
        out.push({ opacity: "0", transform: "none", clipPath: "unset" });
        continue;
      }
      const b = band(o);
      out.push({
        opacity: "1",
        transform: `translate3d(${((Math.random() - 0.5) * o.maxOffset * 0.3).toFixed(2)}%,0,0)`,
        clipPath: b.path,
      });
      continue;
    }
    const b = band(o);
    const scale = 0.35 + b.heightRatio * 0.65;
    out.push({
      opacity: "1",
      transform: `translate3d(${(jolt(o, t) * push * scale).toFixed(2)}%,0,0)`,
      clipPath: b.path,
    });
  }
  return out;
}

function dropFrames(o: GlitchOptions): Keyframe[] {
  const steps = Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1);
  const peakStep = Math.round(steps * (o.spanStart + (o.spanEnd - o.spanStart) * o.peakAt));
  const out: Keyframe[] = [];
  for (let i = 0; i < steps; i++) {
    out.push({ opacity: i === peakStep ? "0" : "1" });
  }
  return out;
}

function badgeFrames(o: GlitchOptions, radius: number): Keyframe[] {
  const steps = Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1);
  const out: Keyframe[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const e = envelope(o, t);
    if (e === 0) {
      out.push({ borderRadius: `${radius}px`, boxShadow: REST_SHADOW });
      continue;
    }
    const r = Math.max(0, radius + jolt(o, t) * o.cornerJitter);
    const lag = (-jolt(o, t) * SHADOW_LAG).toFixed(1);
    out.push({
      borderRadius: `${r.toFixed(2)}px`,
      boxShadow: [
        "inset 0 1px 0 -0.5px rgba(255,255,255,0.4)",
        "inset 0 -1px 0 -0.5px rgba(0,32,15,0.3)",
        "inset 0 0 0 1px rgba(0,40,18,0.09)",
        `${lag}px 1px 2px rgba(6,46,24,0.22)`,
        `${lag}px 4px 10px -4px rgba(6,46,24,0.28)`,
      ].join(", "),
    });
  }
  return out;
}

function shakeFrames(o: GlitchOptions): Keyframe[] {
  const steps = Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1);
  const out: Keyframe[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const x = jolt(o, t) * o.shakeAmplitude * 100;
    const y = jolt(o, t) * o.shakeAmplitude * 100;
    out.push({ transform: `translate3d(${x.toFixed(2)}%,${y.toFixed(2)}%,0)` });
  }
  return out;
}

export class GlitchWord {
  private base: HTMLElement;
  private layers: HTMLElement[];
  private badge: HTMLElement | null;
  private badgeRadius = 8;
  private drift: Animation | null = null;
  private unit: HTMLElement | null = null;
  private sinceDrop = 0;
  private word: string;

  private opts: GlitchOptions = IDLE;
  private anims: Animation[] = [];
  private scrambleTimer: number | null = null;
  private scrambleTick = 0;
  private cycleStart = 0;
  private running = false;
  private reduced: boolean;

  constructor(
    base: HTMLElement,
    layers: HTMLElement[],
    word: string,
    reduced = false,
  ) {
    this.unit = base.closest<HTMLElement>("[data-glitch-magnet]");
    this.badge = base.querySelector<HTMLElement>("[data-glitch-badge]");
    if (this.badge) {
      const r = parseFloat(getComputedStyle(this.badge).borderTopLeftRadius);
      if (!Number.isNaN(r)) this.badgeRadius = r;
    }
    this.base = base;
    this.layers = layers;
    this.word = word;
    this.reduced = reduced;
  }

  setOptions(o: GlitchOptions) {
    this.opts = o;
    if (this.running) {
      this.cancel();
      this.run();
    }
  }

  start() {
    if (this.running || this.reduced) return;
    this.running = true;
    this.run();
    this.startScramble();
    this.startDrift();
  }

  private startDrift() {
    if (this.drift || this.reduced) return;
    const px = this.opts.driftPx;
    this.drift = this.base.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: `translate3d(${px}px,${-px * 0.6}px,0)` },
        { transform: `translate3d(${-px * 0.8}px,${px}px,0)` },
        { transform: `translate3d(${px * 0.5}px,${px * 0.7}px,0)` },
        { transform: "translate3d(0,0,0)" },
      ],
      {
        duration: 9400,
        iterations: Infinity,
        easing: "ease-in-out",
        composite: "add",
      },
    );
  }

  private stopDrift() {
    this.drift?.cancel();
    this.drift = null;
  }

  stop() {
    this.running = false;
    this.cancel();
    this.stopScramble();
    this.stopDrift();
  }

  private run() {
    const o = this.opts;
    const timing: KeyframeAnimationOptions = {
      duration: o.duration,
      iterations: 1,
      easing: `steps(${Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1)}, jump-start)`,
      fill: "none",
    };

    const rogue = Math.floor(Math.random() * o.sliceCount);

    if (this.unit && ++this.sinceDrop >= DROP_EVERY + Math.floor(Math.random() * DROP_JITTER)) {
      this.sinceDrop = 0;
      this.anims.push(
        this.unit.animate(dropFrames(o), {
          duration: o.duration,
          iterations: 1,
          easing: `steps(${Math.max(1, Math.floor((o.velocity * o.duration) / 1000) + 1)}, jump-start)`,
          fill: "none",
        }),
      );
    }

    this.anims = [
      this.base.animate(shakeFrames(o), timing),
      ...this.layers
        .slice(0, o.sliceCount)
        .map((el, i) => el.animate(sliceFrames(o, i, rogue), timing)),
    ];

    if (this.badge) {
      this.anims.push(
        this.badge.animate(badgeFrames(o, this.badgeRadius), {
          duration: o.duration,
          iterations: 1,
          easing: "ease-in-out",
          fill: "none",
        }),
      );
    }

    this.cycleStart = performance.now();
    this.anims[0]?.finished
      .then(() => {
        if (this.running) this.run();
      })
      .catch(() => {
      });
  }

  private cancel() {
    for (const a of this.anims) {
      try {
        a.cancel();
      } catch {}
    }
    this.anims = [];
    for (const el of this.layers) {
      el.style.opacity = "0";
      el.style.transform = "none";
      el.style.clipPath = "none";
      el.style.removeProperty("color");
      el.style.removeProperty("filter");
    }
    this.base.style.transform = "none";
    if (this.unit) this.unit.style.removeProperty("opacity");
  }

  private startScramble() {
    this.stopScramble();
    this.cycleStart = performance.now();
    const tick = () => {
      const o = this.opts;
      const phase = ((performance.now() - this.cycleStart) % o.duration) / o.duration;
      if (envelope(o, phase) === 0) {
        this.setText(this.word);
        return;
      }
      if (++this.scrambleTick % 2 !== 0) {
        this.setText(this.word);
        return;
      }
      let out = this.word;
      for (let i = 0; i < out.length; i++) {
        if (Math.random() < o.scrambleRate) {
          const c = swap(out[i]);
          out = out.slice(0, i) + c + out.slice(i + 1);
        }
      }
      this.setText(out);
    };
    tick();
    this.scrambleTimer = window.setInterval(tick, this.opts.scrambleInterval);
  }

  private stopScramble() {
    if (this.scrambleTimer !== null) window.clearInterval(this.scrambleTimer);
    this.scrambleTimer = null;
    this.setText(this.word);
  }

  private setText(s: string) {
    const baseSlot =
      this.base.querySelector<HTMLElement>("[data-glitch-text]") ?? this.base;
    baseSlot.textContent = s;
    for (const el of this.layers) {
      const slot = el.querySelector<HTMLElement>("[data-glitch-text]") ?? el;
      slot.textContent = s;
    }
  }

  destroy() {
    this.stop();
  }
}
