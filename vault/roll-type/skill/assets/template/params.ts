// Roll type (https://design.how/vault/roll-type), params.ts.
// VARIABLE: DEFAULT_PHRASES, STAGGER_MS, PHRASE_MS, GLASS_SPEED, LENS, FRINGE, FONT_WEIGHT, FONT_VAR. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export type Phrase = {lines: readonly (readonly string[])[]; ground: string; ink: string; fringe?: readonly [string, string]};
export type Phrases = readonly Phrase[];

export const SCENE_W = 1080;
export const SCENE_H = 608;
export const CAP = 102;
export const BASELINES = [292, 421] as const;
export const TOP_LINE = 94;
export const BOTTOM_LINE = 493;

export const KEY_MS = 40;
export const PHRASE_MS = 2080;
export const STAGGER_MS = 100;
export const ENTER_AFTER_MS = 460;
export const CUT_AFTER_MS = 600;
export const FIRST_EXIT_MS = 600;

export const EXIT = {
  d: [0, 0.05, 0.12, 0.24, 0.42, 0.66, 0.9, 1],
  h: [1, 1.01, 1, 0.97, 0.92, 0.75, 0.38, 0.05],
  w: [1, 1, 1, 0.995, 0.99, 0.97, 0.95, 0.93],
} as const;

export const ENTER = {
  e: [0, 0.06, 0.18, 0.43, 0.75, 0.94, 1.02, 1.04, 1.035, 1.025, 1.012, 1.008, 1],
  h: [0.04, 0.2, 0.32, 0.55, 0.77, 0.94, 0.99, 1.01, 1.01, 1, 1, 1, 1],
  w: [0.93, 0.94, 0.95, 0.99, 1, 1.01, 1.01, 1, 1, 1, 1, 1, 1],
} as const;

export const LEAN = 1.8;
export const LEAN_IN = 0.9;

export const FONT_WEIGHT = 500;
export const FONT_VAR = '--visual-sans';

export const FRAME_MS = 1000 / 60;
export const GLASS_SPEED = 26;
export const LENS = 0.22;
export const STRIPS = 28;
export const FRINGE = 3.5;
export const FRINGE_ALPHA = 0.3;
export const FRINGE_HUES = ['#00e0ff', '#ff3dbb'] as const;
export const DEFAULT_PHRASES: Phrases = [
  {lines: [['Design', 'with'], ['taste']], ground: '#2430ff', ink: '#f2efe6', fringe: ['#7dfcff', '#ff4fd8']},
  {lines: [['Agents'], ['just', 'get', 'it']], ground: '#ff5a24', ink: '#1a0c06', fringe: ['#ffe14a', '#6a00ff']},
  {lines: [['Systems', 'for'], ['every', 'agent']], ground: '#0b0b10', ink: '#d4ff3a', fringe: ['#00e0ff', '#ff3d7a']},
];

export const loopMs = (phrases: Phrases) => phrases.length * PHRASE_MS;

export function sample(table: readonly number[], key: number): number {
  if (key <= 0) return table[0];
  const last = table.length - 1;
  if (key >= last) return table[last];
  const i = Math.floor(key);
  return table[i] + (table[i + 1] - table[i]) * (key - i);
}
