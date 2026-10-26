'use client';

import {useCallback, type RefObject} from 'react';
import {useMotionToken, useTimeline, type TimelineOptions} from './use-timeline';

export function typedAt(text: string, elapsed: number, perChar: number = 18, delay = 0): number {
  const length = Array.from(text).length;
  if (perChar <= 0) return length;
  return Math.max(0, Math.min(length, Math.floor((elapsed - delay) / perChar)));
}

export const firstChars = (text: string, count: number) => Array.from(text).slice(0, count).join('');

export type TypingOptions = TimelineOptions & {
  ref?: RefObject<Element | null>;
  delay?: number;
  perChar?: number;
};

export type Typing = {
  shown: string;
  typing: boolean;
  done: boolean;
};

export function useTyping(text: string, {ref, delay = 0, perChar, clock, play, restart}: TypingOptions = {}): Typing {
  const token = useMotionToken(ref, '--dur-type');
  const each = perChar ?? token.ms;
  const length = Array.from(text).length;
  const step = useCallback((ms: number) => typedAt(text, ms, each, delay), [text, each, delay]);
  const elapsed = useTimeline({total: delay + length * Math.max(0, each), step, clock, play, restart: restart ?? text, reduced: token.reduced});
  const count = typedAt(text, elapsed, each, delay);
  return {shown: firstChars(text, count), typing: count > 0 && count < length, done: count >= length};
}
