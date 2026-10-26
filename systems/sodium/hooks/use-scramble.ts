'use client';

import {useCallback, type RefObject} from 'react';
import {useMotionToken, useTimeline, type TimelineOptions} from './use-timeline';

export const scrambleGlyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
export const scrambleTick = 40;

export function hash(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const settles = (ch: string) => !/[\p{L}\p{N}]/u.test(ch);

export function scrambleAt(text: string, elapsed: number, {duration = 400, seed = hash(text)}: {duration?: number; seed?: number} = {}): string {
  if (duration <= 0 || elapsed >= duration) return text;
  const chars = Array.from(text);
  const settled = Math.floor(Math.max(0, elapsed) / duration * chars.length);
  const tick = Math.floor(Math.max(0, elapsed) / scrambleTick);
  return chars.map((ch, i) => i < settled || settles(ch) ? ch : scrambleGlyphs[hash(seed, i, tick) % scrambleGlyphs.length]).join('');
}

export type ScrambleOptions = TimelineOptions & {
  ref?: RefObject<Element | null>;
  duration?: number;
  seed?: number;
};

export type Scramble = {
  text: string;
  scrambling: boolean;
};

export function useScramble(text: string, {ref, duration, seed, clock, play, restart}: ScrambleOptions = {}): Scramble {
  const token = useMotionToken(ref, '--dur-scramble');
  const total = duration ?? token.ms;
  const step = useCallback((ms: number) => ms >= total ? -1 : Math.floor(ms / scrambleTick), [total]);
  const elapsed = useTimeline({total, step, clock, play, restart: restart ?? text, reduced: token.reduced});
  const shown = scrambleAt(text, elapsed, {duration: total, seed});
  return {text: shown, scrambling: shown !== text};
}
