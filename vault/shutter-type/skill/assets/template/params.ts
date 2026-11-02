// Shutter type (https://design.how/vault/shutter-type), params.ts.
// VARIABLE: PAPER, SKY, SKY_SPANS, STRIPE_LAG_MAX, STRIPE_SEED, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const FRAME_MS = 40;
export const FRAMES = 68;
export const LOOP_MS = FRAMES * FRAME_MS;

export const SCENE_W = 600;
export const SCENE_H = 337.5;

export const PAPER = "#f6f3ea";
export const SKY = "#00afca";

export const FONT_VAR = "--visual-sans";
export const FONT_WEIGHT = 500;

export type Bezier = readonly [number, number, number, number];
export const EASE_SCROLL: Bezier = [0.8, 0, 0.2, 1];
export const EASE_LIFT: Bezier = [0.85, 0, 0.15, 1];

export function bezier(t: number, [x1, y1, x2, y2]: Bezier): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const u = (lo + hi) / 2;
    const v = 1 - u;
    const x = 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u;
    if (x < t) lo = u;
    else hi = u;
  }
  const u = (lo + hi) / 2;
  const v = 1 - u;
  return 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u;
}

export function step(table: readonly number[], i: number): number {
  const k = Math.max(0, Math.min(table.length - 1, Math.floor(i)));
  return table[k];
}

export type PhaseName = "streams" | "addup";

export interface Phase {
  name: PhaseName;
  from: number;
  to: number;
}

export const PHASES: readonly Phase[] = [
  { name: "streams", from: 0, to: 28 },
  { name: "addup", from: 29, to: 67 },
];

export function phaseAt(frame: number): Phase {
  const f = ((Math.floor(frame) % FRAMES) + FRAMES) % FRAMES;
  return f <= PHASES[0].to ? PHASES[0] : PHASES[1];
}

export const SKY_SPANS: readonly (readonly [number, number])[] = [
  [10, 28],
  [54, 67],
];

export function isSky(frame: number): boolean {
  const f = ((Math.floor(frame) % FRAMES) + FRAMES) % FRAMES;
  return SKY_SPANS.some(([a, b]) => f >= a && f <= b);
}

export const STREAMS_CAP = 49;
export const STREAMS_BASELINE = 187;
export const STREAMS_CENTRE = { x: 300, y: 163 } as const;

export interface StreamsWord {
  text: string;
  x: number;
  w: number;
  dy: readonly number[];
}

export const STREAMS_WORDS: readonly StreamsWord[] = [
  { text: "Design", x: 139, w: 218, dy: [-11, -12, -13, 8, 14, -14, 34, 22, 14, 8, 4, 2, 2, 0] },
  { text: "is", x: 284, w: 48, dy: [12, 8, -13, -11, 14, -10, 16, -27, -17, -10, -5, -2, -2, 0] },
  { text: "thinking", x: 443, w: 252, dy: [-8, -15, -15, 13, -14, 11, -16, 28, 18, 10, 5, 2, 2, 0] },
];

export const STREAMS_ZOOM_PER_FRAME = 0.0026;
export const STREAMS_ZOOM_ZERO = 13;

export const STREAMS_LIFT_START = 22;
export const STREAMS_LIFT_FRAMES = 10;
export const STREAMS_LIFT_PX = 97;

export function streamsScale(f: number): number {
  return 1 + STREAMS_ZOOM_PER_FRAME * (Math.max(f, 10) - STREAMS_ZOOM_ZERO);
}

export function streamsLift(f: number): number {
  return STREAMS_LIFT_PX * bezier((f - STREAMS_LIFT_START) / STREAMS_LIFT_FRAMES, EASE_LIFT);
}

export function streamsInner(f: number): { x: number; baseline: number }[] {
  return STREAMS_WORDS.map((w) => ({ x: w.x, baseline: STREAMS_BASELINE + step(w.dy, f) }));
}

export function streamsOuter(f: number): { scale: number; lift: number } {
  return { scale: streamsScale(f), lift: streamsLift(f) };
}

export function streamsPose(f: number): { words: { x: number; baseline: number }[]; scale: number } {
  const s = streamsScale(f);
  const lift = streamsLift(f);
  const cy = STREAMS_CENTRE.y - lift;
  const baseline = cy + (STREAMS_BASELINE - STREAMS_CENTRE.y) * s;
  return {
    scale: s,
    words: STREAMS_WORDS.map((w) => ({
      x: STREAMS_CENTRE.x + (w.x - STREAMS_CENTRE.x) * s,
      baseline: baseline + step(w.dy, f) * s,
    })),
  };
}

export const ADDUP_XHEIGHT = 57;
export const ADDUP_PITCH = 126;
export const ADDUP_BASELINE = 129;

export interface AddupWord {
  text: string;
  x: number;
  w: number;
  lag: number;
}

export const ADDUP_WORDS: readonly AddupWord[] = [
  { text: "made", x: 155.5, w: 251, lag: 0 },
  { text: "visual", x: 441.5, w: 255, lag: 0.4 },
];

export const ADDUP_BEAT = 14;
export const ADDUP_SCROLL_FRAMES = 12;
export const ADDUP_FIRST_SCROLL = 27;

export function addupScroll(f: number): number {
  const since = f - ADDUP_FIRST_SCROLL;
  const beats = Math.floor(since / ADDUP_BEAT);
  const within = since - beats * ADDUP_BEAT;
  return ADDUP_PITCH * (beats + bezier(within / ADDUP_SCROLL_FRAMES, EASE_SCROLL));
}

export function addupBaselines(f: number): number[] {
  return ADDUP_WORDS.map((w) => {
    const up = addupScroll(f - w.lag) % ADDUP_PITCH;
    return ADDUP_BASELINE - up;
  });
}

export const STRIPE_MIN = 14;
export const STRIPE_MAX = 60;
export const STRIPE_LAG_MAX = 2.4;
export const STRIPE_TAPS = 5;
export const STRIPE_SEED = 0x51ab7e;

export interface Stripe {
  y0: number;
  y1: number;
  lag: number;
  tap: number;
}

export function stripeLagOfTap(tap: number): number {
  return (STRIPE_LAG_MAX * tap) / (STRIPE_TAPS - 1);
}

export function buildStripes(seed = STRIPE_SEED): Stripe[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const out: Stripe[] = [];
  let y = 0;
  let lastTap = -1;
  while (y < SCENE_H) {
    const h = STRIPE_MIN + rnd() * (STRIPE_MAX - STRIPE_MIN);
    let tap = Math.floor(rnd() * STRIPE_TAPS);
    if (tap === lastTap) tap = (tap + 1 + Math.floor(rnd() * (STRIPE_TAPS - 1))) % STRIPE_TAPS;
    lastTap = tap;
    out.push({ y0: y, y1: Math.min(SCENE_H, y + h), lag: stripeLagOfTap(tap), tap });
    y += h;
  }
  return out;
}

export function sampleFrame(f: number, lag: number): number {
  const phase = phaseAt(f);
  return Math.max(phase.from, f - lag);
}

export const STILL_FRAME = 40;
