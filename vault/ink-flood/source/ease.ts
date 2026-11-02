import type { EaseName } from "./scene";

export type EaseFn = (t: number) => number;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const EASINGS: Record<EaseName, EaseFn> = {
  linear: clamp01,
  measured: clamp01,

  expoOut: (t) => {
    const x = clamp01(t);
    return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },

  expoIn: (t) => {
    const x = clamp01(t);
    return x <= 0 ? 0 : Math.pow(2, 10 * (x - 1));
  },

  quintInOut: (t) => {
    const x = clamp01(t);
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
  },

  sineInOut: (t) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2,

  drift: (t) => {
    const x = clamp01(t);
    const head = Math.pow(x, 2.6);
    const tail = 1 - Math.pow(1 - x, 2.2);
    return head * (1 - x) + tail * x;
  },

  surge: (t) => {
    const x = clamp01(t);
    return 1 - Math.pow(1 - x, 3.4);
  },
};

export function easeFn(name: EaseName | undefined): EaseFn {
  return EASINGS[name ?? "measured"] ?? EASINGS.measured;
}

export function sampleTable(
  table: readonly number[],
  base: number,
  u: number,
  ease: EaseFn = EASINGS.measured,
): number {
  if (table.length === 0) return 0;
  const k = u - base;
  if (k <= 0) return table[0];
  if (k >= table.length - 1) return table[table.length - 1];
  const i = Math.floor(k);
  return table[i] + (table[i + 1] - table[i]) * ease(k - i);
}

export function mix(a: number, b: number, t: number, ease: EaseFn = EASINGS.measured): number {
  return a + (b - a) * ease(t);
}
